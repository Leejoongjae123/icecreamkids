'use Client';

import React, { useEffect, useState } from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';

import { Button, Input, Select, Checkbox } from '@/components/common';
import { FormField } from '@/components/common/Form';
import {
  addEducationalClass,
  deleteEducationalClassById,
  useGetEducationalClasses,
  updateEducationalClassById,
} from '@/service/member/memberStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import type { UserInfo } from '@/hooks/store/useUserStore';
import { useToast } from '@/hooks/store/useToastStore';
import { useAuth } from '@/hooks/useAuth';
import { ApiResponseEducationalClassResult } from '@/service/member/schemas';
import { IRegisterClassData } from './types';

// Zod 스키마 수정 - 검증 메시지 추가
const classSchema = z.object({
  year: z.number({ invalid_type_error: '년도는 숫자여야 합니다.' }).int(),
  className: z.string(),
  age: z.number({ invalid_type_error: '연령은 숫자여야 합니다.' }).int(),
  isBasicClass: z.boolean().default(true),
});

const handleCreateClass = async (
  teacherId: number,
  data: IRegisterClassData,
): Promise<ApiResponseEducationalClassResult> => {
  const result = await addEducationalClass({
    teacherProfileId: teacherId,
    year: data.year,
    name: data.className.trim(), // 공백 제거 확실히
    age: data.age,
    isBasicClass: data.isBasicClass,
    basicClass: data.isBasicClass,
  });
  return result;
};

const handleUpdateClass = async (id: number, teacherId: number, data: IRegisterClassData) => {
  const result = await updateEducationalClassById(id, {
    teacherProfileId: teacherId,
    year: data.year,
    name: data.className.trim(), // 공백 제거 확실히
    age: data.age,
    ...(data.isBasicClass ? { isBasicClass: data.isBasicClass, basicClass: data.isBasicClass } : {}),
  });
  return result;
};

const MyClassClient = ({ userInfo, isActive }: { userInfo: UserInfo; isActive: boolean }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedBasicId, setSelectedBasicId] = useState<number | null>(null);
  const { showAlert } = useAlertStore();
  const { id: teacherId } = userInfo;
  const { updatedUserInfo } = useAuth();
  const addToast = useToast((state) => state.add);

  // 년도 설정(하드)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2022 + 1 }, (_, i) => ({
    value: 2022 + i,
    text: String(2022 + i),
  })).sort((a, b) => b.value - a.value);

  // 나이설정 (하드)
  const ageOptions = [
    { value: 0, text: '0세' },
    { value: 1, text: '1세' },
    { value: 2, text: '2세' },
    { value: 3, text: '3세' },
    { value: 4, text: '4세' },
    { value: 5, text: '5세' },
  ];

  // 수정버튼 클릭시 다른 행들은 전부 비활성화
  const isActionDisabled = editingId !== null;

  const { data: classList, refetch } = useGetEducationalClasses(String(teacherId));

  useEffect(() => {
    if (isActive) {
      refetch();
    }
  }, [isActive, refetch]);

  // 반 등록갯수 여부
  const isFirstRegistration = classList?.result?.length === 0;

  // 반 삭제
  const deleteEducationalClass = (item: IRegisterClassData) => {
    if (item.isBasicClass) {
      showAlert({ message: '기본반은 삭제할 수 없습니다.', isConfirm: false });
      return;
    }
    showAlert({
      message: `우리반 관리 리스트에서만 삭제됩니다.<br/>'${item.name}' 반을 삭제하시겠습니까?`,
      isConfirm: true,
      onCancel: () => {},
      onConfirm: async () => {
        try {
          await deleteEducationalClassById(item.id as number, {
            teacherProfileId: teacherId,
            year: item.year,
            name: item.className,
            age: item.age,
            isBasicClass: item.isBasicClass,
          });
          addToast({ message: `${item.name}반이 삭제되었습니다.` });
          refetch();
        } catch (error) {
          console.error('반 삭제 오류:', error);
          showAlert({ message: '반 삭제 중 오류가 발생했습니다. 다시 시도해주세요.', isConfirm: false });
        }
      },
    });
  };
  // 반 등록폼
  const registerForm = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    mode: 'onChange',
    defaultValues: {
      year: currentYear,
      className: '',
      age: 5,
      isBasicClass: !!isFirstRegistration,
    },
  });

  // 폼 에러 상태 가져오기
  const registerFormErrors = registerForm.formState.errors;

  // 기본반 설정체크
  useEffect(() => {
    if (classList?.result) {
      const basic = classList.result.find((item) => item.isBasicClass);
      const firstRegistration = classList.result.length === 0;

      setSelectedBasicId(basic ? basic.id : null);
      registerForm.setValue('isBasicClass', !!firstRegistration);
    }
  }, [classList, registerForm]);

  const handleRefetchClass = async () => {
    const refreshResult = await refetch();
    if (refreshResult?.data?.result) {
      const resultData = refreshResult?.data?.result;
      const baseClass = resultData.find((classItem) => classItem.isBasicClass);

      if (baseClass?.id) {
        await updatedUserInfo(
          {
            basicClassId: baseClass?.id,
            email: '',
            id: 0,
            code: '',
            accountId: 0,
            state: 'NORMAL',
            name: '',
            photoObjectId: 0,
            modifiedAt: '',
            createdAt: '',
            followingCount: 0,
            followerCount: 0,
          },
          'basicClassId',
        );
      }
    }
  };

  const handleRegister = async (data: z.infer<typeof classSchema>) => {
    // 이름 공백 제거 및 빈 값 확인
    const className = data.className.trim();

    // 1. 빈 값 체크 - onSubmit에서 직접 검사
    if (!className) {
      registerForm.setError('className', {
        type: 'manual',
        // message: '반 이름을 입력하세요.',
      });
      showAlert({ message: '반 이름을 입력하세요.', isConfirm: false });
      return;
    }

    // 2. 중복 체크 - 연령 제한 제거
    const duplicate = classList?.result?.find(
      // (item) => Number(item.year) === data.year && item.name === className && Number(item.age) === data.age,
      (item) => Number(item.year) === data.year && item.name === className,
    );

    if (duplicate) {
      registerForm.setError('className', {
        type: 'manual',
      });
      showAlert({ message: '중복된 반 정보가 존재합니다.', isConfirm: false });
      return;
    }

    try {
      const { status, result } = await handleCreateClass(teacherId, { ...data, className });

      if (status === 200 && result) {
        addToast({ message: `${result?.name}반이 등록되었습니다.` });
      }

      registerForm.reset({
        year: currentYear,
        className: '',
        age: 5,
        isBasicClass: false,
      });
      // class 리셋 및 basicClassId 저장
      await handleRefetchClass();
    } catch (error) {
      console.error('반 등록 오류:', error);
      showAlert({ message: '반 등록 중 오류가 발생했습니다. 다시 시도해주세요.', isConfirm: false });
    }
  };

  // 반 수정 폼 (수정 모드에서도 라디오는 그대로 사용)
  const editForm = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    mode: 'onChange',
  });

  // 폼 에러 상태 가져오기
  const editFormErrors = editForm.formState.errors;

  const handleUpdate = async (data: z.infer<typeof classSchema>) => {
    // 이름 공백 제거 및 빈 값 확인
    const className = data.className.trim();
    if (!className) {
      showAlert({ message: '반 이름을 입력하세요.', isConfirm: false });
      return;
    }

    // 중복 확인 - 날짜 제한 제거
    const duplicate = classList?.result?.find(
      (item) =>
        Number(item.year) === data.year &&
        item.name === className &&
        // Number(item.age) === data.age &&
        item.id !== editingId,
    );
    if (duplicate) {
      showAlert({ message: '중복된 반 정보가 존재합니다.', isConfirm: false });
      return;
    }

    try {
      const { status, result } = await handleUpdateClass(editingId as number, teacherId, { ...data, className });

      if (status === 200 && result) {
        addToast({ message: `수정이 완료되었습니다.` });
      }
      setEditingId(null);
      // class 리셋 및 basicClassId 저장
      handleRefetchClass();
    } catch (error) {
      console.error('반 수정 오류:', error);
      showAlert({ message: '반 수정 중 오류가 발생했습니다. 다시 시도해주세요.', isConfirm: false });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const tableHeaderList = [
    { id: 0, text: '기본반', width: '80px' },
    { id: 1, text: '년도', width: '106px' },
    { id: 2, text: '반이름', width: '234px' },
    { id: 3, text: '연령', width: '146px' },
    { id: 4, text: '등록 학생수', width: '144px' },
    { id: 5, text: '관리', width: '210px' },
  ];

  return (
    <div className="group-table">
      <table className="item-table">
        <caption className="ir_caption">나의반 관리 목록</caption>
        <colgroup>
          {tableHeaderList.map((header) => (
            <col key={header.id} style={{ width: `${header.width}` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {tableHeaderList.map((header) => (
              <th key={header.id}>{header.text}</th>
            ))}
          </tr>
          {/* 반 등록 (최초 등록은 체크박스로 유지) */}
          <FormProvider {...registerForm}>
            <tr>
              <td>
                <FormField
                  name="isBasicClass"
                  control={registerForm.control}
                  render={({ field }) => (
                    <Checkbox
                      label="선택"
                      labHidden
                      id="registerClass"
                      className="item-choice"
                      disabled={isActionDisabled || isFirstRegistration}
                      {...field}
                      checked={field.value}
                    />
                  )}
                />
              </td>
              <td>
                <FormField
                  name="year"
                  control={registerForm.control}
                  render={({ field }) => (
                    <Select
                      id="itemYear"
                      size="small"
                      options={yearOptions}
                      value={field.value}
                      disabled={isActionDisabled}
                      onChange={(val) => field.onChange(Number(val))}
                    />
                  )}
                />
              </td>
              <td>
                <FormField
                  name="className"
                  control={registerForm.control}
                  render={({ field }) => (
                    <div>
                      <Input
                        id="className"
                        sizeType="small"
                        placeholder="반이름을 입력하세요."
                        value={field.value}
                        disabled={isActionDisabled}
                        onChange={(e) => field.onChange(e.target.value)}
                        isError={!!registerFormErrors.className}
                      />
                      {registerFormErrors.className && (
                        <div className="error-message" style={{ color: 'red', fontSize: '12px' }}>
                          {registerFormErrors.className.message}
                        </div>
                      )}
                    </div>
                  )}
                />
              </td>
              <td>
                <FormField
                  name="age"
                  control={registerForm.control}
                  render={({ field }) => (
                    <Select
                      id="itemAge"
                      size="small"
                      options={ageOptions}
                      value={field.value}
                      disabled={isActionDisabled}
                      onChange={(val) => field.onChange(Number(val))}
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </td>
              <td>-</td>
              <td>
                <div className="group-btn">
                  <Button
                    color="line"
                    size="small"
                    onClick={registerForm.handleSubmit(handleRegister)}
                    disabled={isActionDisabled}
                  >
                    반등록
                  </Button>
                </div>
              </td>
            </tr>
          </FormProvider>
        </thead>
        <tbody>
          {/* 반 목록 */}
          {classList?.result?.map((item) =>
            editingId === item.id ? (
              // 수정 모드 (라디오는 기존 코드 그대로)
              <FormProvider key={item.id} {...editForm}>
                <tr>
                  <td>
                    <FormField
                      name="isBasicClass"
                      control={editForm.control}
                      render={({ field }) => (
                        <Checkbox label="선택" labHidden id="checkBasicClass" className="item-choice" {...field} />
                      )}
                    />
                  </td>
                  <td>
                    <FormField
                      name="year"
                      control={editForm.control}
                      render={({ field }) => (
                        <Select
                          id={`editYear-${item.id}`}
                          size="small"
                          options={yearOptions}
                          value={field.value}
                          onChange={(val) => field.onChange(Number(val))}
                        />
                      )}
                    />
                  </td>
                  <td>
                    <FormField
                      name="className"
                      control={editForm.control}
                      render={({ field }) => (
                        <div>
                          <Input
                            id={`editClassName-${item.id}`}
                            sizeType="small"
                            placeholder="반이름을 입력하세요."
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            isError={!!editFormErrors.className}
                          />
                          {editFormErrors.className && (
                            <div className="error-message" style={{ color: 'red', fontSize: '12px' }}>
                              {editFormErrors.className.message}
                            </div>
                          )}
                        </div>
                      )}
                    />
                  </td>
                  <td>
                    <FormField
                      name="age"
                      control={editForm.control}
                      render={({ field }) => (
                        <Select
                          id={`editAge-${item.id}`}
                          size="small"
                          options={ageOptions}
                          value={field.value}
                          style={{ width: '100%' }}
                          onChange={(val) => field.onChange(Number(val))}
                        />
                      )}
                    />
                  </td>
                  <td>{item.studentCount}</td>
                  <td>
                    <Button size="small" onClick={editForm.handleSubmit(handleUpdate)}>
                      저장
                    </Button>
                    <Button color="gray" size="small" onClick={handleCancelEdit}>
                      취소
                    </Button>
                  </td>
                </tr>
              </FormProvider>
            ) : (
              <tr key={item.id}>
                <td>
                  <div className="item-choice">
                    <input
                      type="radio"
                      id={`choice-${item.id}`}
                      name="isBasicClass"
                      className="inp-comm"
                      checked={selectedBasicId === item.id}
                      disabled={selectedBasicId !== item.id}
                    />
                    <label htmlFor={`choice-${item.id}`} className="lab-radio">
                      <span className="ico-comm ico-inp-radio" />
                      <span className="screen_out">기본반</span>
                    </label>
                  </div>
                </td>
                <td>{item.year}</td>
                <td>{item.name}</td>
                <td>{item.age}세</td>
                <td>{item.studentCount}</td>
                <td>
                  <Button
                    size="small"
                    color="line"
                    onClick={() => {
                      setEditingId(item.id);
                      editForm.reset({
                        year: item.year,
                        className: item.name,
                        age: item.age,
                        isBasicClass: item.isBasicClass,
                      });
                    }}
                    disabled={isActionDisabled}
                  >
                    수정
                  </Button>
                  <Button
                    color="gray"
                    size="small"
                    onClick={() =>
                      deleteEducationalClass({
                        year: item.year,
                        className: item.name,
                        age: item.age,
                        isBasicClass: item.isBasicClass,
                        id: item.id,
                        name: item.name,
                      })
                    }
                    disabled={isActionDisabled}
                  >
                    삭제
                  </Button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MyClassClient;
