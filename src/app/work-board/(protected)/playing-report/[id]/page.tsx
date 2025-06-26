'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Button, Input, Form, FormField, Loader } from '@/components/common';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useReportStore } from '@/hooks/store/useReportStore';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LecturePlanResult, SmartFolderItemResult, SmartFolderItemResultFileType } from '@/service/file/schemas';
import { getLecturePlanList, getLectureReport, getMobileUploadedFiles } from '@/service/file/fileStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { createReport } from '@/service/aiAndProxy/aiAndProxyStore';
import useUserStore from '@/hooks/store/useUserStore';
import { useToast } from '@/hooks/store/useToastStore';
import PreviewReportClient from '@/app/work-board/(protected)/playing-report/_components/PreviewReport';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { UploadModal } from '@/components/modal';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useLoadingState } from '@/hooks/useLoadingState';
import useImagesLoaded from '@/hooks/useImamgesLoaded';
import DraggableMemo from '@/app/work-board/(protected)/playing-report/_components/DraggableMemo';
import { useBeforeLeavePagePrevent } from '@/hooks/useBeforeLeavePagePrevent';
import DraggablePlayCard from '../_components/DragablePlayCard';
import ReportCard, { ReportCardHandle, CardData } from '../_components/ReportCard';
import 'swiper/css';
import 'swiper/css/navigation';

const formSchema = z.object({
  subject: z.string().min(1, '놀이주제를 입력해 주세요.'),
  cards: z
    .array(
      z.object({
        id: z.number().optional(),
        cardOrder: z.number().optional(),
        photoDriveItemId: z.number().optional(),
        title: z.string().optional(),
        contents: z.string().optional(),
        isUserEdited: z.boolean().optional(),
        referencePlanCardId: z.number().optional(),
        playCardName: z.string().optional(),
        referenceMemoKey: z.string().optional(),
        playCardId: z.number().optional(),
        memoCardId: z.number().optional(),
        isDetailMode: z.boolean().optional(),
        isEditMode: z.boolean().optional(), // 편집 모드 필드 추가
        photoDriveItemResult: z
          .object({
            id: z.union([z.number(), z.string()]).optional(),
            name: z.string().optional(),
            fileType: z.string().optional(),
            thumbUrl: z.string().optional(),
            originalFile: z.any().optional(),
            driveItemKey: z.string().optional(),
            referencePlanCardId: z.number().optional(),
            referenceMemoKey: z.string().optional(),
          })
          .optional(),
        driveItemKey: z.string().optional(),
        uniqueKey: z.string().optional(),
        isCardFold: z.boolean().optional(),
      }),
    )
    .min(1, '최소 하나 이상의 놀이카드가 필요합니다.'),
});

type FormData = z.infer<typeof formSchema>;

const PlayingReportDetail: React.FC = () => {
  const params = useParams();
  const pathname = usePathname();
  const paramsId = params.id as string;
  const router = useRouter();
  const { reportData, setReportData } = useReportStore((state) => ({
    reportData: state.reportData,
    setReportData: state.setReportData,
  }));
  const { userInfo } = useUserStore();
  const addToast = useToast((state) => state.add);
  const { showAlert } = useAlertStore();

  const [playCardList, setPlayCardList] = useState<LecturePlanResult[]>([]);
  const [recordCardList, setRecordCardList] = useState<SmartFolderItemResult[]>([]);
  const [isReportCreated, setIsReportCreated] = useState(true);
  const [previewData, setPreviewData] = useState<any>();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const hasFetchedRef = useRef(false);
  const initialRenderRef = useRef(true);
  // 편집 모드인 카드가 있는지 확인하기 위한 상태
  const [hasEditModeCards, setHasEditModeCards] = useState(false);

  // ID 기반으로 카드 참조를 관리하도록 변경 - 인덱스가 아닌 카드 ID로 참조
  const cardRefs = useRef<Record<string | number, ReportCardHandle | null>>({});

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: '', cards: [] },
  });
  const {
    control,
    formState: { errors },
    setValue,
    watch,
    getValues,
    clearErrors,
  } = form;

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [isNotMyReport, setIsNotMyReport] = useState(false);
  const { isLoading: loadingState, message: loadingMessage } = useLoadingState([
    {
      isLoading: isFetching,
      name: '로딩',
      message: '로딩 중입니다.',
      priority: 0,
    },
    {
      isLoading,
      name: '생성',
      message: '보고서를 생성중입니다.',
      priority: 0,
    },
  ]);

  // … 기존 상태 선언
  const [skipGuard, setSkipGuard] = useState(false);
  const [originalReportData, setOriginalReportData] = useState<any>(null);
  const [dataModified, setDataModified] = useState(false);

  // 수정 중인 카드 ID를 추적하는 상태 추가
  const [editingCardIds, setEditingCardIds] = useState<Set<number>>(new Set());

  // 수정 모드 변경
  const handleCardEditModeChange = useCallback((cardId: number | undefined, isEditMode: boolean) => {
    setEditingCardIds((prev) => {
      const newSet = new Set(prev);
      if (cardId === undefined) return newSet;

      if (isEditMode) {
        newSet.add(cardId);
      } else {
        newSet.delete(cardId);
      }
      return newSet;
    });
  }, []);

  // PreviewReportClient에 전달할 콜백 함수
  const handleEditModeChange = useCallback(
    (modifiedData: any) => {
      // 원본 데이터와 달라졌는지 확인 (간단한 비교)
      if (originalReportData && JSON.stringify(originalReportData) !== JSON.stringify(modifiedData)) {
        setDataModified(true);
      }
    },
    [originalReportData],
  );

  // URL이 /preview 로 시작하지 않으면 가드 다시 켜기
  useEffect(() => {
    if (!pathname.startsWith('/preview')) {
      setSkipGuard(false);
      setIsPreview(false);
    }
  }, [pathname]);
  const isAllowedPage = paramsId === 'create' || Boolean(reportData?.studentAge);
  const shouldGuard = isAllowedPage && !skipGuard && (paramsId === 'create' || dataModified);

  useBeforeLeavePagePrevent(shouldGuard, isPreview);

  // 보고서 상세 정보 가져오기
  const fetchReportDetail = useCallback(async () => {
    try {
      setIsReportCreated(false);
      const { result, status } = await getLectureReport(+paramsId, { includes: 'photoItems' });
      if (status !== 200 || !result) {
        showAlert({
          message: '데이터를 불러오지 못하였습니다. 다시 시도해주세요.',
        });
        return;
      }
      if (!hasFetchedRef.current) {
        setReportData({ ...result, studentAge: result.studentAge });
        hasFetchedRef.current = true;
      }

      // 내 계정의 정보가 아니면 이건 못본다! profileId기준!
      if (result.ownerAccountId !== userInfo?.accountId || result.ownerProfileId !== userInfo?.id) {
        showAlert({
          message: '조회 권한이 없습니다.',
          onConfirm: () => {
            setIsPreview(true);
            setIsNotMyReport(true);
            router.back();
          },
        });
        return;
      }

      const formattedCards =
        result.lectureReportCards?.map((card, index) => {
          const cardData = {
            id: card.id ?? 0,
            cardOrder: card.cardOrder ?? index,
            photoDriveItemId: card.photoDriveItemId ?? 0,
            title: card.title ?? '',
            contents: card.contents ?? '',
            isUserEdited: card.isUserEdited ?? false,
            playCardId: 0,
            memoCardId: 0,
            photoDriveItemResult: {
              id: card.photoDriveItemId ?? 0,
              name: card.title ?? '',
              fileType: 'IMAGE',
              thumbUrl: card.photoDriveItemResult?.thumbUrl ?? '',
              driveItemKey: card.photoDriveItemResult?.key,
            },
            isDetailMode: false, // 상세 진입 시 바로 수정 모드로 표시하기 위해 false로 설정
            isEditMode: true, // 상세 진입 시 바로 수정 모드로 표시
            uniqueKey:
              card.id && card.id !== 0
                ? card.id.toString()
                : `new-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            isCardFold: !(card.title && card.contents),
          };
          return cardData;
        }) ?? [];

      // 원본 데이터 저장 - 깊은 복사로 참조 끊기
      setOriginalReportData(JSON.parse(JSON.stringify(result)));

      // 초기에는 수정되지 않음으로 설정
      setDataModified(false);

      setValue('cards', formattedCards);
      setValue('subject', result.subject);
      const onLoadPreviewData = {
        id: result.id,
        subject: result.subject,
        startsAt: result.startsAt,
        endsAt: result.endsAt,
        objective: result.learningPoint,
        support: result.teacherSupport,
        studentAge: result.studentAge,
      };
      setPreviewData({ ...onLoadPreviewData, cards: formattedCards });
    } catch (error) {
      showAlert({
        message: '등록된 보고서를 찾을 수 없습니다. 다시 확인해주세요.',
        onConfirm: () => {
          router.back();
        },
      });
    }
  }, [paramsId, setValue, showAlert, userInfo, router, setReportData]);

  const allImagesLoaded = useImagesLoaded({ containerId: 'lecture-plan-report', watchTrigger: previewData });
  // 리포트 데이터가 준비된 이후 첫 번째 변화는 무시하기 위한 플래그
  const didReportArrive = useRef(false);

  useEffect(() => {
    if (!previewData) {
      didReportArrive.current = false;
      return;
    }

    if (!didReportArrive.current) {
      didReportArrive.current = true; // watchTrigger 가 true 된 직후 한 번만 무시
      return;
    }
    setIsFetching(!allImagesLoaded);
  }, [allImagesLoaded, isReportCreated, paramsId, previewData, reportData]);

  // 놀이 카드 가져오기
  const fetchPlayCards = useCallback(async () => {
    try {
      const { result } = await getLecturePlanList({ sorts: 'createdAt.desc', includes: 'smartFolderItem' });

      if (result) {
        setPlayCardList(result);
      }
    } catch (error) {
      console.error('놀이 카드 불러오기 실패:', error);
    }
  }, [setPlayCardList]);

  // 메모 가져오기
  const fetchRecordCards = useCallback(async () => {
    try {
      const { result } = await getMobileUploadedFiles({ fileTypes: 'AUDIO,TEXT_MEMO', sorts: 'createdAt.desc' });
      if (result) {
        setRecordCardList(result);
      }
    } catch (error) {
      console.error('메모 불러오기 실패:', error);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (!userInfo) return;

    // 한 번만 실행되도록 상태를 체크
    if (!initialRenderRef.current) return;
    initialRenderRef.current = false;

    if (paramsId && paramsId !== 'create') {
      fetchReportDetail();
    } else if (reportData) {
      setValue('subject', reportData.subject ?? '');
      if (reportData.lectureReportCards?.length > 0) {
        const formattedCards = reportData.lectureReportCards.map((card: CardData, index: number) => {
          const cardData = {
            cardOrder: index,
            photoDriveItemId: card.photoDriveItemResult?.id ?? 0,
            title: '',
            contents: '',
            isUserEdited: false,
            referencePlanCardId: card.referencePlanCardId || 0,
            referenceMemoKey: card.referenceMemoKey || '',
            isEditMode: true, // 편집 모드 초기값 추가
            photoDriveItemResult: card,
          };
          return cardData;
        });
        setValue('cards', formattedCards);
      } else {
        const defaultCard = [
          {
            id: 0,
            cardOrder: 0,
            photoDriveItemId: 0,
            title: '',
            contents: '',
            isUserEdited: false,
            playCardId: 0,
            memoCardId: 0,
            isEditMode: false, // 편집 모드 초기값 추가
            photoDriveItemResult: { thumbUrl: '', name: '', fileType: 'IMAGE' },
            isCardFold: true,
          },
        ];
        setValue('cards', defaultCard);
      }
    } else {
      showAlert({ message: '잘못된 접근입니다.' });
      router.push('/work-board/playing-report');
      return;
    }

    // 카드 및 메모 데이터 로드
    fetchPlayCards();
    fetchRecordCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, paramsId, reportData, fetchReportDetail, fetchPlayCards, fetchRecordCards]); // us

  // 이미지 설정 핸들러
  const handleSetImage = useCallback(
    (items: (File | SmartFolderItemResult)[]) => {
      const currentCards = getValues('cards');
      console.log('만약 당신이 이 콘솔을 본다면 그때는 도망쳐야 할것이다...');

      // 중복 항목 확인
      const isItemDuplicate = (item: File | SmartFolderItemResult, existingCards: CardData[]) => {
        if (item instanceof File) {
          return existingCards.some(
            (card) =>
              card.photoDriveItemResult?.name === item.name &&
              (card.photoDriveItemResult as any)?.originalFile?.size === item.size &&
              (card.photoDriveItemResult as any)?.originalFile?.lastModified === item.lastModified,
          );
        }
        return existingCards.some(
          (card) =>
            (card.photoDriveItemResult?.id && card.photoDriveItemResult.id === item.id) ||
            (card.photoDriveItemResult?.driveItemKey && card.photoDriveItemResult.driveItemKey === item.driveItemKey),
        );
      };

      const uniqueItems = items.filter((item) => !isItemDuplicate(item, currentCards));

      if (uniqueItems.length === 0) {
        addToast({ message: '이미 등록된 이미지입니다.' });
        return;
      }

      const newCards = uniqueItems.map((item, index) => {
        const isFile = item instanceof File;
        const photoDriveItemResult = isFile
          ? {
              id: Date.now() + index,
              name: item.name,
              fileType: 'IMAGE' as SmartFolderItemResultFileType,
              thumbUrl: URL.createObjectURL(item),
              originalFile: item,
              driveItemKey: `local_${Date.now()}_${index}`,
            }
          : {
              id: item.id,
              name: item.name,
              fileType: item.fileType,
              thumbUrl: item.thumbUrl ?? '',
              originalFile: null,
              driveItemKey: item.driveItemKey,
              referencePlanCardId: item.lecturePlan?.id,
              referenceMemoKey: item.memoContents?.id?.toString() || '',
            };

        return {
          id: photoDriveItemResult.id,
          cardOrder: currentCards.length + index,
          photoDriveItemId: isFile ? photoDriveItemResult.id : (item.driveItemResult && item?.driveItemResult.id) || 0,
          title: '',
          contents: '',
          isUserEdited: false,
          isEditMode: false, // 편집 모드 초기값 추가
          photoDriveItemResult,
          isCardFold: true,
        };
      });

      setValue('cards', [...currentCards, ...newCards]);
      addToast({ message: `${newCards.length}개의 이미지가 추가되었습니다.` });
    },
    [getValues, setValue, addToast],
  );

  const [fileData, setFileData] = useState<File[]>([]);

  // 이미지 업로드 커스텀 훅 사용
  const { isUploadModalOpen, handleOpenUploadModal, handleCloseUploadModal, handleSetItemData } = useImageUpload({
    uploadedFiles,
    onFilesUpload: (items) => {
      handleSetImage(items);
    },
    maxDataLength: 20, // 최대 20개 이미지 제한 설정
  });

  // 컴퓨터 이미지 업로드 처리
  const handleUploadComputerImage = useCallback(
    (data: File[] | SmartFolderItemResult[]) => {
      const currentCards = getValues('cards');
      const remainingSlots = 20 - currentCards.length; // 남은 슬롯 계산
      const exceedsLimit = data.length > remainingSlots;
      console.log('몇개니?', remainingSlots, data.length);

      if (exceedsLimit || data.length > 20) {
        showAlert({
          message: '사진 추가는 최대 20장까지만 가능합니다.',
          onConfirm: async () => {
            // '+1' 제거하고 정확히 남은 슬롯만큼만 자르기
            const sliceFileData = data.slice(0, remainingSlots);
            await setFileData((prevState) => ({
              ...prevState,
              sliceFileData,
            }));
            handleSetImage(sliceFileData);
            handleCloseUploadModal();
          },
        });
      } else {
        handleSetImage(data);
        handleCloseUploadModal();
      }
    },
    [getValues, handleSetImage, setFileData, showAlert, handleCloseUploadModal],
  );

  const [hasAIGenerating, setHasAIGenerating] = useState<boolean>(false);
  // 카드 ID를 키로 사용하여 AI 생성 상태 관리
  const [aiGeneratingCards, setAiGeneratingCards] = useState<Record<string | number, boolean>>({});
  // 카드 ID를 키로 사용하여 AI 로딩 상태 관리 (생성 중인지 여부)
  const [aiLoadingCards, setAiLoadingCards] = useState<Record<string | number, boolean>>({});

  // 카드 ID 기반 AI 생성 상태 추적 함수
  const updateCardAIStatus = useCallback((cardId: string | number, isGenerating: boolean) => {
    console.log(`카드 ID ${cardId} AI 생성 상태 변경:`, isGenerating);
    setAiGeneratingCards((prev) => {
      const newState = {
        ...prev,
        [cardId]: isGenerating,
      };
      console.log('새로운 AI 생성 상태:', newState);
      return newState;
    });
  }, []);

  // 카드 ID 기반 AI 로딩 상태 추적 함수
  const updateCardAILoading = useCallback((cardId: string | number, isLoadingUpdateState: boolean) => {
    console.log(`카드 ID ${cardId} AI 로딩 상태 변경:`, isLoadingUpdateState);
    setAiLoadingCards((prev) => {
      const newState = {
        ...prev,
        [cardId]: isLoadingUpdateState,
      };
      return newState;
    });
  }, []);

  // AI 로딩 상태 확인 함수 (특정 카드가 로딩 중인지 확인)
  const isCardAILoading = useCallback(
    (cardId: string | number) => {
      return !!aiLoadingCards[cardId];
    },
    [aiLoadingCards],
  );

  // 전체 AI 생성 상태 계산 (어느 하나라도 생성 중이면 true)
  useEffect(() => {
    const isAnyCardGenerating = Object.values(aiGeneratingCards).some((status) => status);
    console.log('AI 생성 상태 확인:', aiGeneratingCards);
    console.log('AI 생성 중인 카드가 있음:', isAnyCardGenerating);
    setHasAIGenerating(isAnyCardGenerating);
  }, [aiGeneratingCards]);

  // 카드 목록 감시
  const reportCard = watch('cards');

  // 편집 모드인 카드가 있는지 확인
  useEffect(() => {
    const filterCard = reportCard.map((e: any) => {
      return { ...e, isEditMode: e.title && e.contents, isCardFold: !(e.title && e.contents) };
    });
    const hasEditCard = filterCard.some((card) => card.isEditMode);
    setHasEditModeCards(hasEditCard);
  }, [reportCard]); // 의존성 배열에 reportCard 추가

  const submitFormData = useCallback(
    async (formData: any) => {
      try {
        // 1. S3에 올려야 할 카드만 추려서 업로드
        const cards = getValues('cards');
        const cardsToUpload = cards.filter(
          (card) =>
            card.id &&
            cardRefs.current[card.id] &&
            Boolean(card?.photoDriveItemResult?.originalFile) &&
            !card.title &&
            !card.contents,
        );

        // for...of 루프를 forEach로 변경
        const uploadPromises: Promise<any>[] = [];

        cardsToUpload.forEach((card) => {
          // ID가 있는지 확인
          if (!card.id) return;

          // cardRefs에 유효한 참조가 있는지 확인
          const cardRef = cardRefs.current[card.id];
          if (!cardRef) return;

          // postS3Image 함수가 존재하는지 확인
          if (typeof cardRef.postS3Image !== 'function') return;

          try {
            // 함수 호출
            const result = cardRef.postS3Image();
            uploadPromises.push(Promise.resolve(result));
          } catch (e) {
            console.error(`Error in postS3Image for card ${card.id}:`, e);
          }
        });

        if (uploadPromises.length) {
          await Promise.all(uploadPromises);
        }

        // 나머지 코드는 동일...
        setIsLoading(true);

        let updatedCards = getValues('cards');
        updatedCards = updatedCards.map((card) => {
          if (!card.photoDriveItemResult?.originalFile) {
            const driveId = (card.photoDriveItemResult as any)?.driveItemResult?.id as number;
            return { ...card, photoDriveItemId: driveId ?? card.photoDriveItemId };
          }
          return card;
        });

        setValue('cards', updatedCards);

        const reportCaptions = updatedCards.map(({ title, contents, isUserEdited }) => ({
          title: title ?? '',
          contents: contents ?? '',
          isUserEdited: isUserEdited ?? false,
        }));

        const { result } = await createReport({
          // @ts-expect-error 프로필아이디 에러 나면 안되는데 에러나서 처리
          profileId: userInfo?.id,
          subject: formData.subject,
          age: reportData?.studentAge,
          reportCaptions,
        });

        const previewCards = updatedCards.map((card) => ({
          ...card,
          isDetailMode: true,
          isEditMode: false,
        }));

        setIsReportCreated(false);
        setPreviewData({ ...result, cards: previewCards });
      } catch (error) {
        console.error('보고서 생성 오류:', error);
        addToast({ message: '보고서 생성에 실패했습니다. 다시 시도해주세요.' });
      } finally {
        setIsLoading(false);
      }
    },
    [getValues, setValue, setIsLoading, userInfo, reportData, addToast],
  );

  // 폼 제출 전 확인
  const checkEditModesBeforeSubmit = useCallback(() => {
    // AI 생성 중인지 확인
    if (hasAIGenerating) {
      return false;
    }

    // paramsId가 있고 create가 아닌 경우(상세 조회)에는 수정 모드 체크를 건너뜀
    if (paramsId && paramsId !== 'create') {
      return true;
    }

    // 수정 중인 카드가 있는지 확인
    if (editingCardIds.size > 0) {
      showAlert({
        message: '반영되지 않은 놀이카드가 있습니다. 보고서를 생성하시겠습니까?',
        onCancel: () => {},
        onConfirm: () => {
          // 중요: 실제 폼 제출 로직 호출
          const formData = getValues();
          submitFormData(formData);
        },
      });
      return false;
    }
    return true;
  }, [editingCardIds, showAlert, paramsId, hasAIGenerating, getValues, submitFormData]);

  // 폼 제출 처리
  const onSubmit: SubmitHandler<FormData> = useCallback(
    async (data) => {
      // 수정 모드인 카드가 있는지 확인
      if (!checkEditModesBeforeSubmit()) {
        return;
      }

      // checkEditModesBeforeSubmit에서 true 반환 시 바로 제출
      await submitFormData(data);
    },
    [checkEditModesBeforeSubmit, submitFormData],
  );

  // 파일 제거 핸들러
  const handleRemoveFile = useCallback(
    (cardIndex: number) => {
      const cards = getValues('cards');
      const updatedCards = [...cards];
      updatedCards[cardIndex] = {
        ...updatedCards[cardIndex],
        referencePlanCardId: 0,
        playCardName: '',
        title: '',
        playCardId: 0,
      };
      setValue('cards', updatedCards);
    },
    [getValues, setValue],
  );

  // 폼 오류 처리
  const onError = useCallback(
    (formErrors: any) => {
      if (formErrors.subject) {
        showAlert({ message: '놀이주제를 입력해주세요.' });
      }
    },
    [showAlert],
  );

  // 프리뷰에서 편집 모드로 돌아가기
  const handleBackEdit = useCallback(
    (updatedData: any, isOverPreview = true) => {
      setIsReportCreated(isOverPreview);
      setValue('subject', updatedData.subject);

      const cardsWithDetailData =
        updatedData.cards?.map((card: any) => {
          const hasContent = card.title && card.contents;
          return {
            ...card,
            isDetailMode: !!hasContent,
            isEditMode: false, // 내용이 있으면 편집 모드 해제
            isCardFold: !hasContent, // 내용이 없으면 접힘
            playCardId: 0,
          };
        }) ?? [];

      setValue('cards', cardsWithDetailData);
      setPreviewData(cardsWithDetailData);
    },
    [setValue, setPreviewData, setIsReportCreated],
  );
  // 1) ref에 방금 들어온 파일만 잠시 저장
  const fileDataRef = useRef<File[]>([]);

  // 2) 파일 입력(setFileData)이 호출되면
  //    - ref에 저장
  //    - 기존 handleUploadComputerImage 로 실제 카드 추가
  const setUploadedFileData: React.Dispatch<React.SetStateAction<File[]>> = useCallback((value) => {
    // value가 함수 형태로 올 수도 있으니 검사
    const files: File[] =
      typeof value === 'function' ? (value as (prev: File[]) => File[])(fileDataRef.current) : value;

    // 파일만 저장하고 uploadComputerImage는 호출하지 않음
    // customOnConfirm에서 처리하도록 변경
    fileDataRef.current = files;
  }, []);

  // 3) onConfirm(wrapper)
  //    - ref에 파일이 남아 있으면(=파일 업로드 브랜치) → 스킵 & ref 초기
  const customOnConfirm = useCallback(
    (items?: SmartFolderItemResult[]) => {
      // 1. 내 컴퓨터에서 파일 업로드한 경우
      if (fileDataRef.current.length > 0) {
        const files = [...fileDataRef.current];
        fileDataRef.current = []; // 초기화
        handleUploadComputerImage(files);
        return;
      }

      // 2. 내컴퓨터 아닌 자료에서 업로드 한 경우
      if (items && items.length > 0) {
        handleUploadComputerImage(items);
      } else {
        handleCloseUploadModal();
      }
    },
    [handleUploadComputerImage, handleCloseUploadModal],
  );

  const handleOpenItemLayer = (id: number, type: string) => {
    setIsPreview(true);
    setTimeout(() => {
      router.push(`/preview?smartFolderItemId=${id}&smartFolderApiType=${type}`);
    }, 1);
  };

  useEffect(() => {
    const cardStates = Object.entries(aiGeneratingCards);
    if (cardStates.length > 0) {
      const isAnyCardGenerating = cardStates.some(([_, status]) => status);
      // 기존 상태와 다를 때만 업데이트
      if (isAnyCardGenerating !== hasAIGenerating) {
        setHasAIGenerating(isAnyCardGenerating);
      }
    } else if (hasAIGenerating) {
      // 이 조건 추가
      setHasAIGenerating(false);
    }
  }, [aiGeneratingCards, hasAIGenerating]);

  if (isNotMyReport) return null;

  return (
    <AppLayout isSnb={false} bgColor="type1" customDocClass="doc-playreport" customContainerClass="none">
      {isReportCreated && (
        <Form
          form={form}
          style={{ display: 'block' }}
          className="type-vertical"
          onSubmit={onSubmit}
          onError={onError}
          id="lecture-plan-report"
        >
          <div className="head-content head-list">
            <div className="util-head util-left">
              <h3 className="screen_out">놀이보고서 기본 정보</h3>
              <dl className="info-util">
                <dt>놀이주제</dt>
                <dd>
                  <FormField
                    control={control}
                    name="subject"
                    render={({ field }) => (
                      <Input
                        id="titleContent"
                        placeholder="놀이주제를 입력해 주세요."
                        className="w-465"
                        isError={!!errors.subject}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value) {
                            clearErrors('subject');
                          }
                        }}
                      />
                    )}
                  />
                </dd>
              </dl>
              <p className="notice-util">놀이 주제와 메모를 입력한 후, 보고서 생성하기 버튼을 누르세요.</p>
            </div>
            <div className="util-head util-right">
              <Button type="submit" icon="wand-18-w" disabled={hasAIGenerating}>
                {hasAIGenerating
                  ? 'AI 내용 생성중입니다'
                  : paramsId && paramsId !== 'create'
                    ? '보고서 저장하기'
                    : '보고서 생성하기'}
              </Button>
            </div>
          </div>
          <div className="body-content" id="reportPrintWrap">
            <div className="util-body">
              <Button
                size="small"
                color="line"
                icon="camera-14"
                className="btn-find"
                disabled={reportCard.length >= 20}
                onClick={handleOpenUploadModal}
              >
                찾아보기
              </Button>
              <Button size="small" color="line" icon="arrow-prev" className="btn_main_slide_prev btn-util btn-prev">
                <span className="screen_out">목록 왼쪽으로 넘기기</span>
              </Button>
              <Button size="small" color="line" icon="arrow-next" className="btn_main_slide_next btn-util btn-next">
                <span className="screen_out">목록 오른쪽으로 넘기기</span>
              </Button>
            </div>
            <Swiper
              modules={[Navigation]}
              navigation={{ nextEl: '.btn_main_slide_next', prevEl: '.btn_main_slide_prev' }}
              className="list-thumbnail"
              spaceBetween={14}
              slidesPerView={reportCard.length < 6 ? 5 : 6}
            >
              {reportCard?.map((card, index) => (
                <SwiperSlide key={card.photoDriveItemResult?.id || card.id || `${index}-${card.photoDriveItemId}`}>
                  <ReportCard
                    ref={(instance: any) => {
                      // 카드 ID를 키로 사용하여 참조 관리 (인덱스 대신)
                      if (instance && card.id) {
                        // ID를 키로 사용하여 참조 저장
                        cardRefs.current[card.id] = instance;
                      }
                    }}
                    isCardFold={card.isCardFold ?? true}
                    card={card}
                    index={index}
                    control={control}
                    getValues={getValues}
                    mainSubject={getValues('subject')}
                    setValue={setValue}
                    handleRemoveFile={handleRemoveFile}
                    onEditModeChange={handleCardEditModeChange}
                    updateAIGeneratingStatus={(cardIdOrIndex, isGenerating) =>
                      updateCardAIStatus(card.id || cardIdOrIndex, isGenerating)
                    }
                    updateCardAILoading={(cardId, loadingStateUpdate) =>
                      updateCardAILoading(cardId, loadingStateUpdate)
                    }
                    isCardAILoading={(cardId) => isCardAILoading(cardId)}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="body-content">
            <div className="util-body">
              <h3 className="tit-content">최근 나의 놀이카드</h3>
              <Button size="small" color="line" icon="arrow-prev" className="btn-prev btn-util btn_prev_playCard">
                <span className="screen_out">목록 왼쪽으로 넘기기</span>
              </Button>
              <Button size="small" color="line" icon="arrow-next" className="btn-next btn-util btn_next_playCard">
                <span className="screen_out">목록 오른쪽으로 넘기기</span>
              </Button>
            </div>
            {playCardList.length > 0 ? (
              <DraggablePlayCard
                onUpdate={fetchPlayCards}
                prev="btn_prev_playCard"
                next="btn_next_playCard"
                playCardList={playCardList}
                openPreviewLayer={handleOpenItemLayer}
              />
            ) : (
              <div className="item-empty">
                <span className="ico-comm ico-empty" />
                <strong className="tit-empty">최근 나의 놀이카드가 없습니다.</strong>
              </div>
            )}
          </div>
          <div className="body-content">
            <div className="util-body">
              <h3 className="tit-content">최근 나의 메모</h3>
              <Button size="small" color="line" icon="arrow-prev" className="btn-record-prev btn-util btn-prev">
                <span className="screen_out">목록 왼쪽으로 넘기기</span>
              </Button>
              <Button size="small" color="line" icon="arrow-next" className="btn-record-next btn-util btn-next">
                <span className="screen_out">목록 오른쪽으로 넘기기</span>
              </Button>
            </div>
            {recordCardList.length > 0 ? (
              <Swiper
                modules={[Navigation]}
                navigation={{ nextEl: '.btn-record-next', prevEl: '.btn-record-prev' }}
                spaceBetween={10}
                slidesPerView={5}
                allowTouchMove={false}
              >
                {recordCardList.map((item, index) => {
                  const hasMemoText = item.sttFullString || item?.memoContents?.memo;
                  // 메모가 없을경우에는 없는 케이스 미노출이었는데 06.04 일단 그냥 노출해달라고 해서 주석처리
                  // if (!hasMemoText) return null;
                  return (
                    <SwiperSlide
                      key={`play_${item?.id ?? index}`}
                      className={recordCardList.length === index + 1 ? 'slide-last' : ''}
                    >
                      <DraggableMemo onUpdate={fetchRecordCards} item={item} index={index} />
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            ) : (
              <div className="item-empty">
                <span className="ico-comm ico-empty" />
                <strong className="tit-empty">최근 나의 메모가 없습니다.</strong>
                <Link href="/introduce" prefetch={false} target="_blank" className="btn btn-small btn-line">
                  서비스 소개
                </Link>
              </div>
            )}
          </div>
        </Form>
      )}
      {!isReportCreated && previewData && (
        <PreviewReportClient
          previewData={previewData}
          onBackEdit={handleBackEdit}
          onEditModeChange={handleEditModeChange}
        />
      )}
      {loadingState && <Loader hasOverlay loadingMessage={loadingMessage} />}
      {isUploadModalOpen && (
        <UploadModal
          key={`${uploadedFiles.length}-${fileData.length}`}
          isOpen={isUploadModalOpen}
          onCancel={handleCloseUploadModal}
          onConfirm={customOnConfirm}
          setItemData={handleSetItemData}
          setFileData={setUploadedFileData}
          isMultiUpload
          allowsFileTypes={['IMAGE']}
          taskType="LECTURE_PLAN_REPORT"
        />
      )}
    </AppLayout>
  );
};

export default PlayingReportDetail;
