'use client';

import { Button, Input, Select, Calendar, Loader } from '@/components/common';
import {
  addStudent,
  updateStudent,
  useGetEducationalClassById,
  useGetEducationalClasses,
  deleteStudent,
} from '@/service/member/memberStore';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { FormField } from '@/components/common/Form';
import dayjs from 'dayjs';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import EditChildPhotoClient from '@/components/modal/child-edit';
import { useImageEditor } from '@/hooks/useImageEditor';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import Image from 'next/image';
import { useToast } from '@/hooks/store/useToastStore';
import { createPortal } from 'react-dom';
import type { IChildData, IMyChildrenClientProps } from './types';

const createChild = async (data: IChildData, classId: number) => {
  // 선택된 클래스 id를 사용하도록 수정
  const result = await addStudent(classId, {
    name: data.name,
    birthday: data.birthday,
    state: data.state,
    thumbUrl: data.thumbUrl || '',
    gender: data.gender,
  });
  return result;
};

const updateChild = async (id: number, data: IChildData) => {
  const result = await updateStudent(id, {
    name: data.name,
    birthday: data.birthday,
    state: data.state,
    thumbUrl: data.thumbUrl || '',
    gender: data.gender,
  });

  return result;
};

const childSchema = z.object({
  name: z.string().nonempty('이름을 입력하세요.'),
  birthday: z.string().nonempty('생년월일을 입력하세요.'),
  state: z.enum(['NORMAL', 'GRADUATE'], {
    required_error: '재원여부를 선택하세요.',
  }),
  thumbUrl: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE'], {
    required_error: '성별을 선택하세요.',
  }),
  photoFileInfos: z.array(z.object({ photoFileObjectId: z.number(), imageUrl: z.string() })).optional(),
});

const MyChildrenClient = ({ userInfo, classId, isActive }: IMyChildrenClientProps) => {
  const { showAlert } = useAlertStore();
  const imageEditor = useImageEditor('/images/profile.png');
  const [editingChildId, setEditingChildId] = useState<null | number>(null);
  const [editingChildThumbnail, setEditingChildThumbnail] = useState<null | string>(null);
  const [openChildProfile, setOpenChildProfile] = useState(false);
  const { id: teacherId, basicClassId } = userInfo;
  const [selectedClassId, setSelectedClassId] = useState<string>(basicClassId ? String(basicClassId) : '');
  const [orginBasicClassId, setOrginBasicClassId] = useState<string>(basicClassId ? String(basicClassId) : '');
  const { postFile } = useS3FileUpload();
  const [fileData, setFileData] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const addToast = useToast((state) => state.add);

  // 반정보 호출
  const { data: classData } = useGetEducationalClasses(String(teacherId), undefined, {
    query: { enabled: Boolean(teacherId) },
  });

  // 아이정보 호출
  const { data: childData, refetch } = useGetEducationalClassById(
    Number(selectedClassId),
    { includes: 'students' },
    {
      query: {
        queryKey: ['childrenByClass', selectedClassId],
        enabled: Boolean(selectedClassId),
      },
    },
  );

  useEffect(() => {
    if (isActive) {
      refetch();
    }
  }, [isActive, refetch]);

  // 반 선택 셀렉츠 설정
  const classList = useMemo(() => {
    if (!classData?.result) return [];
    return classData.result.map((cls): { text: string; value: string } => ({
      text: `${cls.year}년 ${cls.name}`,
      value: String(cls.id),
    }));
    // 정렬 필요시 추가
    // ?.sort((itemA, ItemB) => {
    //   if (itemA.year !== ItemB.year) {
    //     return ItemB.year - itemA.year;
    //   }
    //   return ItemB.id - itemA.id;
    // })
  }, [classData]);

  // 아이목록 셋팅
  const students = useMemo(() => childData?.result?.students || [], [childData]);

  // 최초 기본반 노출 설정 - classId가 있는 경우 해당 반을 노출
  useEffect(() => {
    if (classList.length > 0) {
      if (classId) {
        const selectedClass = classList.find((cls) => cls.value === String(classId));
        if (selectedClass) setSelectedClassId(selectedClass.value);
      } else if (!selectedClassId) {
        const defaultClass = classList.find((cls) => cls.value === String(basicClassId)) || classList[0];
        setSelectedClassId(defaultClass.value);
      }
      if (!orginBasicClassId) {
        setOrginBasicClassId(String(basicClassId));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classList, basicClassId]);

  // basicClassId 변경 시 동작
  useEffect(() => {
    if (orginBasicClassId !== String(basicClassId)) {
      const defaultClass = classList.find((cls) => cls.value === String(basicClassId)) || classList[0];
      if (defaultClass) {
        setSelectedClassId(String(defaultClass.value));
        setOrginBasicClassId(String(defaultClass.value));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basicClassId]);

  // 수정모드 제어
  const isActionDisabled = editingChildId !== null;

  // 성볓 및 제원여부 선택
  const genderOptions = useMemo(
    () => [
      { text: '남', value: 1 },
      { text: '여', value: 0 },
    ],
    [],
  );
  const stateOptions = useMemo(
    () => [
      { text: 'O', value: 1 },
      { text: 'X', value: 0 },
    ],
    [],
  );

  // 반선택
  const handleSelectClass = useCallback((val: any) => {
    setSelectedClassId(String(val));
    setEditingChildId(null);
  }, []);

  // 중복여부 체크
  const isDuplicate = useCallback(
    (formData: z.infer<typeof childSchema>) => {
      const formattedBirthday = dayjs(formData.birthday).format('YYYY.MM.DD');
      return students.some((child: any) => {
        // 수정 중인 아이는 중복 체크에서 제외
        if (editingChildId != null && child.id === editingChildId) return false;
        return (
          child.name === formData.name &&
          dayjs(child.birthday).format('YYYY.MM.DD') === formattedBirthday &&
          child.gender === formData.gender
        );
      });
    },
    [students, editingChildId],
  );

  // 등록 스키마
  const registerForm = useForm<z.infer<typeof childSchema>>({
    resolver: zodResolver(childSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      birthday: '',
      state: 'NORMAL',
      thumbUrl: '',
      gender: 'FEMALE',
      photoFileInfos: [],
    },
  });

  const handleImageS3Upload = useCallback(
    async (paramFileData: File) => {
      try {
        const uploadResult = await postFile({
          file: paramFileData,
          fileType: 'IMAGE',
          taskType: 'ETC',
          source: 'THUMBNAIL',
        });
        // console.log('파일 업로드 결과:', uploadResult);
        return uploadResult;
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        return null;
      }
    },
    [postFile],
  );

  // 아이등록
  const handleRegister = useCallback(
    async (formData: z.infer<typeof childSchema>) => {
      const formattedBirthday = dayjs(formData.birthday).format('YYYY.MM.DD');

      const newData = { ...formData, birthday: formattedBirthday };
      if (isDuplicate(newData)) {
        showAlert({ message: '이미 등록된 아이입니다.' });
        return;
      }
      showAlert({
        message: `[${formData.name}/${formattedBirthday}] 아이를 등록하시겠습니까?`,
        onCancel: () => {},
        onConfirm: async () => {
          // 로딩 시작
          setIsLoading(true);
          setLoadingMessage('아이 등록 중입니다.');
          try {
            // 1) S3 업로드 결과가 담길 변수
            let uploadResult: any;

            // 2) fileData가 있으면 S3에 업로드
            if (fileData) {
              uploadResult = await handleImageS3Upload(fileData);
            }

            // 3) thumbUrl 결정:
            //    업로드 결과 우선, 없으면 newData.thumbUrl(기존 데이터) 사용,
            //    둘 다 없으면 null
            const thumbUrl =
              uploadResult && uploadResult.length > 0
                ? `${uploadResult[0].host}/${uploadResult[0].bucket}/${uploadResult[0].key}`
                : (newData.thumbUrl ?? '');

            // 4) body에 thumbUrl 반영
            const body = { ...newData, thumbUrl };

            // 5) 등록 API 호출
            const result = await createChild(body, Number(selectedClassId));
            if (!result) {
              throw new Error('등록에 실패했습니다.');
            }

            if (result.status !== 200) {
              throw new Error('등록에 실패했습니다.');
            }

            addToast({ message: '등록되었습니다.' });
            setIsLoading(false);
            registerForm.reset();
            setFileData(null);
            setPreviewImage('');
            refetch();
          } catch (error: any) {
            // 에러 발생 시 알림 표시
            setIsLoading(false);
            setTimeout(() => {
              showAlert({
                message: `등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
                onConfirm: () => {},
              });
            }, 1);
          } finally {
            // 로딩 종료
            // setIsLoading(false);
            setLoadingMessage(null);
          }
        },
      });
    },
    [isDuplicate, registerForm, refetch, showAlert, selectedClassId, fileData, handleImageS3Upload, addToast],
  );

  // 수정 스키마
  const editForm = useForm<z.infer<typeof childSchema>>({
    resolver: zodResolver(childSchema),
    mode: 'onChange',
  });

  // 업데이트 - 아이 정보
  const handleUpdate = useCallback(
    async (formData: z.infer<typeof childSchema>) => {
      const formattedBirthday = dayjs(formData.birthday).format('YYYY.MM.DD');
      const newData = { ...formData, birthday: formattedBirthday };
      if (isDuplicate(newData)) {
        showAlert({ message: '이미 등록된 아이입니다.' });
        return;
      }

      // 로딩 시작
      setIsLoading(true);
      setLoadingMessage('아이 등록 중입니다.');

      try {
        let updateData = { ...newData };
        let imageUrl: any = null;
        if (fileData) {
          imageUrl = await handleImageS3Upload(fileData);
          // useS3FileUpload;
          const { host, bucket, key } = imageUrl[0];
          updateData = { ...newData, thumbUrl: `${host}/${bucket}/${key}` };
        }

        const result = await updateChild(editingChildId as number, updateData);

        // 업데이트 실패 시 에러 처리
        if (result.status !== 200) {
          throw new Error('업데이트에 실패했습니다.');
        }

        setFileData(null);
        setEditingChildId(null);
        refetch();
        setIsLoading(false);
        addToast({ message: '수정되었습니다.' });
      } catch (error: any) {
        // 에러 발생 시 알림 표시
        setIsLoading(false);
        showAlert({
          message: `수정 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
        });
      } finally {
        // 로딩 종료
        // setIsLoading(false);
        setLoadingMessage(null);
      }
    },
    [editingChildId, fileData, handleImageS3Upload, isDuplicate, refetch, showAlert, addToast],
  );

  const handleCancelEdit = useCallback(() => {
    editForm.reset({
      name: '',
      birthday: '',
      state: 'NORMAL',
      thumbUrl: '',
      gender: 'FEMALE',
      photoFileInfos: [],
    });
    setFileData(null);
    setEditingChildId(null);
  }, [editForm]);

  const handleDeleteChild = useCallback(
    async (id: number, name: string) => {
      showAlert({
        message: `우리반 관리 리스트에서만 삭제됩니다.<br/>우리반에서 [${name}] 아이를 삭제하시겠습니까?`,
        isConfirm: true,
        onCancel: () => {},
        onConfirm: async () => {
          // 로딩 시작
          // setIsLoading(true);
          // setLoadingMessage('아이 삭제 중입니다.');

          try {
            const result = await deleteStudent(id);

            // 삭제 실패 시 에러 처리
            if (result && result.status !== 200) {
              throw new Error('삭제에 실패했습니다.');
            }

            refetch();
            addToast({ message: '삭제되었습니다.' });
            setIsLoading(false);
          } catch (error: any) {
            // 에러 발생 시 알림 표시
            setIsLoading(false);
            showAlert({
              message: `삭제 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
            });
          } finally {
            // 로딩 종료
            // setIsLoading(false);
            // setLoadingMessage(null);
          }
        },
      });
    },
    [refetch, showAlert, addToast],
  );

  const handleToggleChildModal = useCallback(async () => {
    // 초기화 우선
    if (previewImage) await setEditingChildThumbnail(previewImage);
    else await setEditingChildThumbnail(null);

    if (editingChildId) {
      if (editForm?.getValues()?.thumbUrl) {
        const editThumbUrl = editForm?.getValues()?.thumbUrl;
        if (editThumbUrl) await setEditingChildThumbnail(editThumbUrl);
      }
    }
    await setOpenChildProfile((prev) => !prev);
  }, [editForm, editingChildId, previewImage]);

  // onConfirm 콜백: 편집된 이미지 업로드 처리
  const handleConfirmEditPopup = async ({ file, preview }: { file: File; preview: string }) => {
    setFileData(file);
    // 등록과 수정 구분
    if (!isActionDisabled) {
      setPreviewImage(preview);
    } else if (editingChildId) {
      editForm.setValue('thumbUrl', preview);
    }
    setEditingChildThumbnail(null);
  };

  // // 탭 이동간 초기화
  // useEffect(() => {
  //   if (!isActive) {
  //     registerForm.reset();
  //     handleCancelEdit();
  //     setFileData(null);
  //     setPreviewImage('');
  //   }
  // }, [handleCancelEdit, isActive, registerForm]);

  return (
    <>
      <div className="group-head" style={{ position: 'relative', zIndex: 100 }}>
        <dl className="info-head">
          <dt>등록 학생수</dt>
          <dd>{students.length}</dd>
        </dl>
        <div className="group-form">
          <Select
            size="small"
            style={{ width: '200px' }}
            options={classList}
            value={selectedClassId}
            onChange={handleSelectClass}
          />
        </div>
      </div>

      <div className="group-table">
        <table className="item-table">
          <caption className="ir_caption">아이관리목록</caption>
          <colgroup>
            <col style={{ width: '100px' }} />
            <col style={{ width: '238px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '106px' }} />
            <col style={{ width: '106px' }} />
            <col style={{ width: '210px' }} />
          </colgroup>
          <thead>
            <tr>
              <th>대표사진</th>
              <th>이름</th>
              <th>생년월일</th>
              <th>성별</th>
              <th>재원여부</th>
              <th>아이관리</th>
            </tr>
            {/* 등록 폼 */}
            <FormProvider {...registerForm}>
              <tr>
                <td>
                  {previewImage ? (
                    <button
                      type="button"
                      className="thumb-profile"
                      onClick={handleToggleChildModal}
                      style={{
                        backgroundImage: `url(${previewImage})`,
                        cursor: 'pointer',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        width: '40px',
                        height: '40px',
                        margin: '0 auto',
                      }}
                    >
                      <Image width={40} height={40} src={previewImage} alt="" />
                    </button>
                  ) : (
                    <Button
                      className="btn-icon"
                      disabled={isActionDisabled}
                      onClick={handleToggleChildModal}
                      color="line"
                      size="small"
                      icon="plus-g"
                    >
                      <span className="screen_out">사진 추가</span>
                    </Button>
                  )}
                </td>
                <td>
                  <FormField
                    name="name"
                    control={registerForm.control}
                    render={({ field, fieldState }) => (
                      <Input
                        id="name"
                        value={field.value}
                        isError={Boolean(fieldState.error)}
                        onChange={field.onChange}
                        placeholder="이름 입력"
                        disabled={isActionDisabled}
                      />
                    )}
                  />
                </td>
                <td className="td-calendar">
                  <FormField
                    name="birthday"
                    control={registerForm.control}
                    render={({ field, fieldState }) => (
                      <Calendar
                        id="birthday"
                        value={String(field.value)}
                        isError={Boolean(fieldState.error)}
                        onChange={field.onChange}
                        placeholder="YYYY.MM.DD"
                        format="YYYY.MM.DD"
                        disabled={isActionDisabled}
                      />
                    )}
                  />
                </td>
                <td>
                  <FormField
                    name="gender"
                    control={registerForm.control}
                    render={({ field, fieldState }) => (
                      <Select
                        id="childGender"
                        size="small"
                        options={genderOptions}
                        value={field.value === 'MALE' ? 1 : 0}
                        disabled={isActionDisabled}
                        onChange={(val) => field.onChange(Number(val) === 1 ? 'MALE' : 'FEMALE')}
                      />
                    )}
                  />
                </td>
                <td>
                  <FormField
                    name="state"
                    control={registerForm.control}
                    render={({ field, fieldState }) => (
                      <Select
                        id="childState"
                        size="small"
                        options={stateOptions}
                        value={field.value === 'NORMAL' ? 1 : 0}
                        disabled={isActionDisabled}
                        onChange={(val) => field.onChange(Number(val) === 1 ? 'NORMAL' : 'GRADUATE')}
                      />
                    )}
                  />
                </td>
                <td>
                  <Button
                    size="small"
                    disabled={isActionDisabled}
                    color="line"
                    onClick={registerForm.handleSubmit(handleRegister)}
                  >
                    아이등록
                  </Button>
                </td>
              </tr>
            </FormProvider>
          </thead>
          <tbody>
            {/* 학생 목록 */}
            {students.map((item) =>
              editingChildId === item.id ? (
                <FormProvider key={item.id} {...editForm}>
                  <tr>
                    <td>
                      <div className="item-picture">
                        <span
                          className="thumb-profile"
                          style={{
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundImage: editForm.getValues()?.thumbUrl
                              ? `url(${editForm.getValues()?.thumbUrl})`
                              : 'url(/images/profile.png)',
                          }}
                        />
                        {/* handleToggleChildModal */}
                        <button type="button" className="btn-picture" onClick={handleToggleChildModal}>
                          <span className="ico-comm ico-edit-16">아이 사진 수정</span>
                        </button>
                      </div>
                    </td>
                    <td>
                      <FormField
                        name="name"
                        control={editForm.control}
                        render={({ field, fieldState }) => (
                          <Input
                            id={`edit-name-${item.id}`}
                            value={field.value}
                            isError={Boolean(fieldState.error)}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </td>
                    <td className="td-calendar">
                      <FormField
                        name="birthday"
                        control={editForm.control}
                        render={({ field, fieldState }) => (
                          <Calendar
                            id={`edit-birthday-${item.id}`}
                            value={String(field.value)}
                            isError={Boolean(fieldState.error)}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <FormField
                        name="gender"
                        control={editForm.control}
                        render={({ field, fieldState }) => (
                          <Select
                            id={`edit-gender-${item.id}`}
                            size="small"
                            options={genderOptions}
                            value={field.value === 'MALE' ? 1 : 0}
                            isError={Boolean(fieldState.error)}
                            onChange={(val) => field.onChange(Number(val) === 1 ? 'MALE' : 'FEMALE')}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <FormField
                        name="state"
                        control={editForm.control}
                        render={({ field, fieldState }) => (
                          <Select
                            id={`edit-state-${item.id}`}
                            size="small"
                            options={stateOptions}
                            value={field.value === 'NORMAL' ? 1 : 0}
                            isError={Boolean(fieldState.error)}
                            onChange={(val) => field.onChange(Number(val) === 1 ? 'NORMAL' : 'GRADUATE')}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <div className="group-btn">
                        <Button size="small" onClick={editForm.handleSubmit(handleUpdate)}>
                          저장
                        </Button>
                        <Button size="small" color="gray" onClick={handleCancelEdit}>
                          취소
                        </Button>
                      </div>
                    </td>
                  </tr>
                </FormProvider>
              ) : (
                <tr key={item.id}>
                  <td>
                    <div className="item-picture" style={{ borderRadius: '50%', overflow: 'hidden' }}>
                      {/* <img src={item.thumbUrl} /> */}
                      {item.thumbUrl ? (
                        <Image alt="" src={item.thumbUrl} width={40} height={40} />
                      ) : (
                        <span
                          className="thumb-profile"
                          style={{
                            backgroundImage: 'url(/images/profile.png)',
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td>{item.name}</td>
                  <td>{item.birthday}</td>
                  <td>{item.gender === 'MALE' ? '남' : '여'}</td>
                  <td>{item.state === 'NORMAL' ? 'O' : 'X'}</td>
                  <td>
                    <div className="group-btn">
                      <Button
                        size="small"
                        color="line"
                        disabled={isActionDisabled}
                        onClick={() => {
                          setEditingChildId(item.id);
                          editForm.reset({
                            name: item.name,
                            birthday: item.birthday,
                            state: item.state === 'LEAVED' ? 'NORMAL' : item.state,
                            thumbUrl: item.thumbUrl,
                            // 'UNKNOWN'인 경우 기본값 'FEMALE' 지정
                            gender: item.gender === 'UNKNOWN' ? 'FEMALE' : item.gender,
                            photoFileInfos: item.photoFileInfos || [],
                          });
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        disabled={isActionDisabled}
                        size="small"
                        color="gray"
                        onClick={() => handleDeleteChild(item.id, item.name)}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <EditChildPhotoClient
        open={openChildProfile}
        thumbUrl={editingChildThumbnail}
        close={handleToggleChildModal}
        handleGetFileData={handleConfirmEditPopup}
      />
      {isLoading &&
        createPortal(<Loader hasOverlay loadingMessage={loadingMessage || '처리 중입니다...'} />, document.body)}
    </>
  );
};

export default MyChildrenClient;
