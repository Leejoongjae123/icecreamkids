'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef, Children } from 'react';
import {
  Button,
  Input,
  Textarea,
  Form,
  FormField,
  Thumbnail,
  RangeCalendar,
  Select,
  Loader,
} from '@/components/common';
import { sanitizeAndFormat } from '@/utils';
import {
  LectureReportAddRequest,
  LectureReportResult,
  SmartFolderItemResult,
  SmartFolderItemResultFileType,
} from '@/service/file/schemas';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { IPreviewContent } from '@/app/work-board/(protected)/playing-report/types';
import { useReportStore } from '@/hooks/store/useReportStore';
import { createLectureReport, updateLectureReport } from '@/service/file/fileStore';
import useUserStore from '@/hooks/store/useUserStore';
import { useToast } from '@/hooks/store/useToastStore';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { AGE_OPTIONS, IP_ADDRESS } from '@/const';
import cx from 'clsx';
import { DownloadModal } from '@/components/modal';
import useCaptureImage from '@/hooks/useCaptureImage';
import { useLoadingState } from '@/hooks/useLoadingState';
import { SplitButton } from '@/components/common/SplitButton';
import { useHandleFile } from '@/hooks/useHandleFile';
import useImagesLoaded from '@/hooks/useImamgesLoaded';
import usePrint from '@/hooks/usePrint';

const formSchema = z.object({
  subject: z.string().min(1, '놀이 주제를 입력해주세요.'),
  startsAt: z.string().min(1, '놀이 시작일을 선택해주세요.'),
  endsAt: z.string().min(1, '놀이 종료일을 선택해주세요.'),
  objective: z.string().optional(),
  support: z.string().optional(),
  studentAge: z.number(),
  cards: z.array(
    z.object({
      title: z.string().optional(),
      contents: z.string().optional(),
      isDetailMode: z.boolean().optional(),
    }),
  ),
});

type FormData = z.infer<typeof formSchema>;

interface IPreviewReportClientProps extends IPreviewContent {
  showHeader?: boolean;
  onBackEdit: (updatedData: any, isOverPreview?: boolean) => void;
  className?: string;
  onEditModeChange?: (data: any) => void;
}

const PreviewReportClient = ({
  previewData: initialPreviewData,
  showHeader = true,
  onBackEdit,
  className,
  onEditModeChange,
}: IPreviewReportClientProps) => {
  const params = useParams();
  const paramsId = params.id as string;
  const [localPreviewData, setLocalPreviewData] = useState(initialPreviewData);
  const [editMode, setEditMode] = useState(false);
  const [selectedAge, setSelectAge] = useState(2);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const reportData = useReportStore((state) => state.reportData);
  const { userInfo } = useUserStore();
  const addToast = useToast((state) => state.add);
  const router = useRouter();
  const { showAlert } = useAlertStore();
  const mountedRef = useRef(false);
  const isPreviewLayer = useMemo(() => className === 'previewLayerReport', [className]); // 미리보기 화면용 설정
  const { getImageAndUploadToS3 } = useCaptureImage();
  const { printForLectureReport } = usePrint();
  /* 로딩 */
  const currentPath = usePathname();
  const [loading, setLoading] = useState<boolean>(false);
  const allImagesLoaded = useImagesLoaded({ containerId: 'lecture-plan-report', watchTrigger: reportData });
  const [isisPrintLoading, setIsisPrintLoading] = useState<boolean>(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState('');

  useEffect(() => {
    if (currentPath.includes('/preview')) setLoading(!allImagesLoaded);
  }, [allImagesLoaded, currentPath, setLoading]);

  const [saving, setSaving] = useState<boolean>(false);
  const { isLoading, message } = useLoadingState([
    {
      isLoading: loading,
      name: '로딩',
      message: '로딩 중입니다.',
      priority: 0,
    },
    {
      isLoading: saving,
      name: '저장',
      message: '이미지로 저장 중입니다.',
      priority: 1, // 가장 높은 우선순위
    },
  ]);
  const [currentActionItem, setCurrentActionItem] = useState<LectureReportResult>();
  const { handleCopy } = useHandleFile();

  const defaultValues = useMemo(
    () => ({
      id: localPreviewData.id,
      subject: localPreviewData.subject,
      startsAt: localPreviewData.startsAt,
      endsAt: localPreviewData.endsAt,
      objective: localPreviewData.objective,
      support: localPreviewData.support,
      studentAge: localPreviewData.studentAge,
      cards:
        localPreviewData.cards?.map((card) => ({
          title: card.title,
          contents: card.contents,
        })) || [],
    }),
    [localPreviewData],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const {
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues,
  } = form;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (!mountedRef.current) {
      setLocalPreviewData((prev) => ({
        ...prev,
        studentAge: reportData?.studentAge || 2,
      }));
      setSelectAge(reportData?.studentAge || 2);
      mountedRef.current = true;
    }
  }, [initialPreviewData, reportData?.studentAge]);

  const selectedPeriod = useMemo(
    () => ({
      startDate: localPreviewData.startsAt,
      endDate: localPreviewData.endsAt,
    }),
    [localPreviewData.startsAt, localPreviewData.endsAt],
  );

  const handlePeriodChange = useCallback(
    (key: string, value: string) => {
      if (key === 'startDate') {
        setValue('startsAt', value);
      } else {
        setValue('endsAt', value);
      }
    },
    [setValue],
  );

  const createRequestData = useCallback(
    (data: FormData, updatedData: any): LectureReportAddRequest => {
      return {
        subject: data.subject,
        studentAge: updatedData.studentAge, // 업데이트된 studentAge 사용
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        learningPoint: data.objective as string,
        teacherSupport: data.support as string,
        ownerAccountId: userInfo?.accountId as number,
        ownerProfileId: userInfo?.id as number,
        creatorAccountId: userInfo?.accountId as number,
        creatorProfileId: userInfo?.id as number,
        creatorIp: IP_ADDRESS, // 임시 IP
        lectureReportCards: updatedData.cards?.map((card: any) => ({
          cardOrder: card.cardOrder,
          photoDriveItemId: card.photoDriveItemId as number,
          title: card.title,
          contents: card.contents,
          isUserEdited: card.isUserEdited,
        })),
      };
    },
    [userInfo],
  );

  const handleSaveReport = useCallback(
    async (data: LectureReportAddRequest) => {
      try {
        const result =
          paramsId && paramsId !== 'create'
            ? await updateLectureReport({ id: +paramsId, ...data })
            : await createLectureReport(data);

        if (result.status === 200) {
          addToast({
            message: `저장되었습니다. <br />스마트 폴더 &gt; 자료 &gt; 놀이보고서`,
          });
        }
      } catch (error) {
        addToast({ message: '등록중 에러가 발생하였습니다.' });
        console.log('등록에러', error);
      }
    },
    [addToast, paramsId],
  );

  const handleClickPrintButton = async () => {
    setIsLoadingMessage('인쇄 준비 중입니다.');
    setIsisPrintLoading(true);
    await printForLectureReport('lecture-plan-report');
    setIsisPrintLoading(false);
  };

  // 미리보기 데이터 업데이트
  const updateLocalData = useCallback(
    (formData: FormData) => {
      const updatedCards =
        localPreviewData.cards?.map((card, index) => ({
          ...card,
          title: formData?.cards[index]?.title || '',
          contents: formData?.cards[index]?.contents || '',
          isDetailMode: formData?.cards[index]?.isDetailMode || null,
        })) || [];

      const updatedData = {
        ...localPreviewData,
        subject: formData.subject,
        startsAt: formData.startsAt,
        endsAt: formData.endsAt,
        objective: formData.objective || '',
        support: formData.support || '',
        studentAge: formData.studentAge,
        cards: updatedCards,
      };

      setLocalPreviewData(updatedData);
      return updatedData;
    },
    [localPreviewData],
  );

  // 저장
  const onSubmit = useCallback<SubmitHandler<FormData>>(
    async (data) => {
      const updatedData = updateLocalData(data);
      const requestData = createRequestData(data, updatedData);
      await handleSaveReport(requestData);
    },
    [updateLocalData, createRequestData, handleSaveReport],
  );

  // 다른 위치로 저장
  const handleClickSaveElsewhere = async () => {
    try {
      const data = form.getValues();
      const updatedData = updateLocalData(data);
      const requestData = createRequestData(data, updatedData);

      const { result, status } =
        paramsId && paramsId !== 'create'
          ? await updateLectureReport({ id: +paramsId, ...requestData })
          : await createLectureReport(requestData);

      if (status === 200) {
        setCurrentActionItem(result as LectureReportResult);
        setIsDownloadModalOpen(true);
      }
    } catch (error) {
      addToast({ message: '등록중 에러가 발생하였습니다.' });
      console.log('등록에러', error);
    }
  };

  const handleConfirmSaveElsewhere = async (folder: SmartFolderItemResult | undefined | null, path?: string) => {
    if (!folder) {
      return;
    }

    await handleCopy(
      folder,
      currentActionItem?.smartFolderItem?.id as number,
      currentActionItem?.smartFolderItem?.smartFolderApiType,
      path,
      '저장되었습니다.',
      '등록중 에러가 발생하였습니다.',
    );

    setTimeout(() => {
      // router.push('/work-board/playing-report');
    }, 500);
    setIsDownloadModalOpen(false);
  };

  const handleSaveToImage = async (folderItem: SmartFolderItemResult | null, path?: string) => {
    if (!folderItem || !folderItem.id) {
      showAlert({ message: '폴더를 선택해 주세요.' });
      return;
    }

    setSaving(true);

    const elementId = 'lecture-plan-report';
    const imageFileName = `${currentActionItem?.smartFolderItem?.name}.png`;
    const uploadedFile: SmartFolderItemResult | undefined = await getImageAndUploadToS3({
      elementId,
      fileName: imageFileName,
      taskType: 'LECTURE_PLAN_REPORT',
      smartFolderApiType: folderItem.smartFolderApiType,
      targetFolderId: folderItem.id,
    });

    if (uploadedFile) {
      addToast({ message: `이미지로 저장되었습니다. ${path && `<br />${path}`}` });
      setIsDownloadModalOpen(false);
    } else {
      showAlert({ message: '이미지로 저장에 실패하였습니다.' });
    }

    setSaving(false);
    setIsDownloadModalOpen(false);
  };

  // 생성전 화면으로 이동
  const handleBackEdit = useCallback(() => {
    showAlert({
      message: '생성화면으로 이동시 AI생성 내용이 소실됩니다.<br/>이동하시겠습니까?',
      onCancel: () => {},
      onConfirm: () => {
        const data = getValues();
        const updatedData = updateLocalData(data);
        onBackEdit(updatedData, true);
      },
    });
  }, [updateLocalData, getValues, onBackEdit, showAlert]);

  // 편집모드 버튼
  const toggleEditMode = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
      e?.preventDefault();
      e?.stopPropagation();

      if (editMode) {
        showAlert({
          message: '편집모드에서 나가면 편집한 내용이 저장되지 않습니다.<br/>편집을 취소하시겠습니까?',
          onCancel() {},
          onConfirm: () => {
            reset({
              subject: localPreviewData.subject,
              startsAt: localPreviewData.startsAt,
              endsAt: localPreviewData.endsAt,
              objective: localPreviewData.objective,
              support: localPreviewData.support,
              studentAge: localPreviewData?.studentAge,
              cards:
                localPreviewData.cards?.map((card) => ({
                  title: card?.title || '',
                  contents: card?.contents || '',
                })) || [],
            });
            setEditMode(false);
          },
        });
      } else {
        setEditMode(true);
      }
    },
    [editMode, reset, localPreviewData, showAlert],
  );

  // 편집완료
  const handleEditComplete = useCallback(() => {
    const data = getValues();

    // 활동내용이 있는데 제목이 없는 카드가 있는지 확인
    const hasInvalidCard = data.cards?.some((card) => card.contents?.trim() && !card.title?.trim());

    if (hasInvalidCard) {
      showAlert({ message: '활동내용의 제목을 입력해주세요.' });
      return;
    }

    const updatedCards =
      localPreviewData.cards?.map((card, index) => ({
        ...card,
        title: data.cards[index]?.title || '',
        contents: data.cards[index]?.contents || '',
        isDetailMode: true,
      })) || [];

    const updatedData = {
      ...localPreviewData,
      subject: data.subject,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      objective: data.objective || '',
      support: data.support || '',
      studentAge: data.studentAge,
      cards: updatedCards,
    };
    setLocalPreviewData(updatedData);
    setEditMode(false);
    if (onEditModeChange) onEditModeChange(updatedData); // 편집 완료 후 편집 모드 종료를 부모에게 알림
  }, [getValues, localPreviewData, setEditMode, onEditModeChange, showAlert]);

  // 나이 변경
  const handleSelectAge = useCallback(
    (value: string | number | (number | string)[]) => {
      const newAge = Number(value);
      setSelectAge(newAge);
      setValue('studentAge', newAge); // form의 studentAge만 업데이트
      // setLocalPreviewData((prev) => ({
      //   ...prev,
      //   studentAge: newAge, // localPreviewData의 studentAge만 업데이트
      // }));
    },
    [setValue],
  );

  // 하단 카드
  const cardItems = useMemo(
    () =>
      Children.toArray(
        localPreviewData.cards?.map((card, index) => (
          <li style={{ alignSelf: !card.title && !card.contents ? 'flex-start' : undefined }}>
            <div className="item-thumbnail">
              <Thumbnail
                fileName={card.photoDriveItemResult?.name || ''}
                fileType={card.photoDriveItemResult?.fileType as SmartFolderItemResultFileType}
                thumbUrl={card.photoDriveItemResult?.thumbUrl || '/images/thumb_profile.png'}
                nameHidden
                hover={false}
                eagerLoading
              />
            </div>

            {editMode ? (
              <div className={cx('wrap-report', isPreviewLayer ? 'type_layer' : undefined)}>
                <FormField
                  control={control}
                  name={`cards.${index}.title`}
                  render={({ field }) => (
                    <Input placeholder="제목을 입력해주세요." id={`item${index}Title`} {...field} />
                  )}
                />
                <div style={{ marginTop: 6 }}>
                  <FormField
                    control={control}
                    name={`cards.${index}.contents`}
                    render={({ field }) => (
                      <Textarea
                        placeholder="활동 내용을 입력해주세요."
                        id={`item${index}Text`}
                        {...field}
                        maxLength={500}
                      />
                    )}
                  />
                </div>
              </div>
            ) : (
              card.title &&
              card.contents && (
                <div className={cx('wrap-report', isPreviewLayer ? 'type_layer' : undefined)}>
                  <strong className="tit-report">{card.title}</strong>
                  <p
                    className="txt-report"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeAndFormat(card.contents),
                    }}
                  />
                </div>
              )
            )}
          </li>
        )),
      ),
    [localPreviewData.cards, editMode, control, isPreviewLayer],
  );

  const saveElsewhereButtonOptions = () => {
    return [
      {
        key: 'save',
        text: '저장',
        action: () => {
          const value = form.getValues();
          onSubmit(value);
        },
      },
      {
        key: 'saveElseWhere',
        text: '다른 위치에 저장',
        action: handleClickSaveElsewhere,
      },
    ];
  };

  // 상단 버튼모음
  const headerButtons = () =>
    editMode ? (
      <>
        {/* <div className="util-head util-left">
          <button type="button" onClick={toggleEditMode} className="btn-prev">
            <span className="ico-comm ico-arrow-left">이전으로 가기</span>
          </button>
        </div> */}
        <div className="util-head util-right">
          <Button size="small" color="gray" type="button" onClick={toggleEditMode}>
            편집취소
          </Button>
          <Button size="small" color="primary" icon="check-14-w" type="button" onClick={handleEditComplete}>
            편집완료
          </Button>
        </div>
      </>
    ) : (
      <>
        <div className="util-head util-left">
          <Button size="small" color="line" icon="arrow-left-14" onClick={handleBackEdit}>
            생성전 화면으로 이동
          </Button>
        </div>
        <div className="util-head util-right">
          <Button size="small" color="line" icon="edit2-14" onClick={toggleEditMode}>
            편집
          </Button>
          <Button size="small" color="line" icon="print-14" onClick={handleClickPrintButton}>
            인쇄
          </Button>
          <SplitButton size="small" color="primary" options={saveElsewhereButtonOptions()}>
            저장
          </SplitButton>
        </div>
      </>
    );

  return (
    <Form form={form} onSubmit={onSubmit} style={{ display: 'block' }} className={className}>
      {showHeader && (
        <div className="head-content head-list">
          <h3 className="screen_out">놀이보고서 상세</h3>
          {headerButtons()}
        </div>
      )}
      <div id="lecture-plan-report">
        <div className="body-content body-info">
          <table className="item-table type-vertical" style={{ tableLayout: isPreviewLayer ? 'auto' : undefined }}>
            <caption className="ir_caption">놀이 계획안 정보 테이블</caption>
            <colgroup>
              <col className="titleCol" style={{ width: isPreviewLayer ? '15%' : '140px' }} />
              <col />
              <col className="titleCol" style={{ width: isPreviewLayer ? '15%' : '140px' }} />
              <col />
              {!isPreviewLayer && (
                <>
                  <col className="titleCol" style={{ width: isPreviewLayer ? '15%' : '140px' }} />
                  <col />
                </>
              )}
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">놀이 주제</th>
                <td>
                  {editMode ? (
                    <FormField
                      control={control}
                      name="subject"
                      render={({ field }) => <Input id="subjectContent" {...field} isError={!!errors.subject} />}
                    />
                  ) : (
                    <span>
                      {localPreviewData.subject}
                      {isPreviewLayer && (
                        <>
                          / <span>{localPreviewData.studentAge}세</span>
                        </>
                      )}
                    </span>
                  )}
                </td>
                {!isPreviewLayer && (
                  <>
                    <th scope="row">놀이 연령</th>
                    <td>
                      {editMode ? (
                        <FormField
                          control={control}
                          name="studentAge"
                          render={({ field }) => (
                            <Select
                              {...field}
                              size="small"
                              id="studentAgeContent"
                              style={{ width: '200px' }}
                              options={AGE_OPTIONS}
                              value={selectedAge}
                              onChange={handleSelectAge}
                              isError={!!errors.studentAge}
                            />
                          )}
                        />
                      ) : (
                        <span>{localPreviewData.studentAge}세</span>
                      )}
                    </td>
                  </>
                )}
                <th scope="row">놀이 기간</th>
                <td>
                  {editMode ? (
                    <RangeCalendar
                      value={{
                        startDate: watch('startsAt'),
                        endDate: watch('endsAt'),
                      }}
                      onChange={handlePeriodChange}
                    />
                  ) : (
                    `${selectedPeriod.startDate} ~ ${selectedPeriod.endDate}`
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">놀이 속 배움</th>
                <td colSpan={isPreviewLayer ? 4 : 5}>
                  {editMode ? (
                    <FormField
                      control={control}
                      name="objective"
                      render={({ field }) => <Textarea id="studyContent" {...field} maxLength={300} />}
                    />
                  ) : (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: sanitizeAndFormat(localPreviewData.objective),
                      }}
                    />
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">교사 지원</th>
                <td colSpan={isPreviewLayer ? 4 : 5}>
                  {editMode ? (
                    <FormField
                      control={control}
                      name="support"
                      render={({ field }) => <Textarea id="teacherContent" {...field} maxLength={200} />}
                    />
                  ) : (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: sanitizeAndFormat(localPreviewData.support),
                      }}
                    />
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="body-content body-detail" style={{ paddingTop: isPreviewLayer ? 0 : undefined }}>
          <ul className="list-thumbnail">{cardItems}</ul>
        </div>
      </div>
      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          itemData={[currentActionItem?.smartFolderItem as SmartFolderItemResult]}
          onCancel={() => setIsDownloadModalOpen(false)}
          onConfirm={handleConfirmSaveElsewhere}
          onSaveToImage={handleSaveToImage}
          action="SAVE"
        />
      )}
      {isLoading && <Loader isAbsolute hasOverlay scrollContainerSelector=".doc-playreport" loadingMessage={message} />}
      {isisPrintLoading && <Loader hasOverlay loadingMessage={isLoadingMessage} />}
    </Form>
  );
};

export default React.memo(PreviewReportClient);
