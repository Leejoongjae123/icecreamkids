'use client';

import type React from 'react';
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { IPopupLayer, IReportModalInfo } from '@/components/common/PreviewLayer/types';
import { Button, Input, Loader, ModalBase, Textarea, Thumbnail, Tag, TooltipContent } from '@/components/common';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import {
  floatingType,
  formatCompactNumber,
  formatFileSize,
  getFileExtension,
  isEmpty,
  removeFileExtension,
} from '@/utils';
import { EXTENSIONS, fileTypeMap, IP_ADDRESS, type SaveToImageFileType } from '@/const';

import 'swiper/css';
import 'swiper/css/navigation';
import dayjs from 'dayjs';
import { dateFormat } from '@/lib/dayjs';
import Image from 'next/image';
import {
  getDocsFolderTree,
  getIncludedDocsItems,
  useAddMemoToFile,
  useAddReply,
  useAddViewCount,
  useDeleteReply,
  useGetCdnFilesForDownloadV2,
  useGetPublicItem,
  useGetReplyAndAttachedItemList,
  useGetSmartFolderItem,
  useGetSmartFolderItemsRecommendPublicItemList,
  useGetSmartFolderItemsRecommendPublicItemList1,
  useLikeDriveItem,
  useRejectRecommendationItem,
  useRenameItem2,
  useStarred,
  useUpdateDriveItemMemo,
  useUpdateReply,
} from '@/service/file/fileStore';
import {
  type AddReplyRequest,
  type CdnFileResult,
  type CommonRenameRequestTargetSmartFolderApiType,
  type SmartFolderItemResult,
  type ReplyResult,
  type SmartFolderTreeResult,
  type SmartFolderItemResultSmartFolderApiType,
  type SmartFolderItemDetailedResult,
  type ApiResponseSmartFolderItemDetailedResult,
  type ApiResponsePublicUrlItemDetailedResult,
  type ApiResponseListSmartFolderItemResult,
  SmartFolderItemResultFileType,
} from '@/service/file/schemas';
import useUserStore from '@/hooks/store/useUserStore';
import Error from 'next/error';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import { DownloadModal, ReportModal, TagModal } from '@/components/modal';
import cx from 'clsx';
import { BreadCrumb, type IBreadcrumbProps } from '@/components/common/Breadcrumb';
import { getSmartFolderPath } from '@/const/smartFolderApiType';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { ShareLinkModal } from '@/components/modal/share-link';
import { useHandleFile } from '@/hooks/useHandleFile';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { IDropDownMenu } from '@/components/common/Thumbnail/_components/DropDownMenu/types';
import type { IDetailtoItem } from '@/components/modal/share-link/type';
import { useGetCdnFile } from '@/hooks/useGetCdnFile';
import useCaptureImage from '@/hooks/useCaptureImage';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useToast } from '@/hooks/store/useToastStore';
import { useValidateFileName } from '@/hooks/useValidateFileName';
import { useGetByIdOrCode1 } from '@/service/member/memberStore';
import { useFileContext } from '@/context/fileContext';
import FileViewer from './fileViewer';

const publicState = {
  PRIVATE: '비공개',
  PUBLIC: '공개',
  PRIVATE_AND_URL_SHARE: '비공개',
  PUBLIC_AND_URL_SHARE: '공개',
};

/**
 * PopupLayer 컴포넌트
 * smartFolderApiType (Photo:사진스마트폴더, EducationalData:자료스마트폴더, UserFolder:내폴더)
 * @param {boolean} isDirect 다이렉트 링크 진입 여부 (현재 사용 X)
 */
const PreviewLayer: React.FC<IPopupLayer> = ({ isDirect }) => {
  // const { setMenuPosition, calculateMenuPosition, clearAllTooltips } = useTooltipStore();
  const { userInfo } = useUserStore();
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);
  const queryClient = useQueryClient();
  const { getImageAndUploadToS3 } = useCaptureImage();
  const validateFileName = useValidateFileName();

  // LNB를 통해서 preview open 여부 관련 설정
  const { handleIsPreviewOpen } = useFileContext();
  useEffect(() => {
    handleIsPreviewOpen(true);

    return () => {
      handleIsPreviewOpen(false);
    };
  }, [handleIsPreviewOpen]);

  /** 파일 정보 */
  const router = useRouter();
  const params = useSearchParams();
  const smartFolderItemId = params.get('smartFolderItemId') as string;
  const smartFolderApiType = params.get('smartFolderApiType') as SmartFolderItemResultSmartFolderApiType;
  const publicBoardItemIdOrCode = params.get('publicBoardItemIdOrCode') as string;

  const isSmartFolderParamReady = !!smartFolderItemId && !!smartFolderApiType;
  const isPublicParamReady = !!publicBoardItemIdOrCode;

  const isSmartFolderMode = isSmartFolderParamReady && !isPublicParamReady;
  const isPublicMode = isPublicParamReady;

  const myProfileId = userInfo?.id || 0;
  const profileId = myProfileId.toString();

  const {
    data: smartFolderItem,
    refetch: smartFolderItemRefetch,
    isError: smartFolderItemError,
    isLoading: smartFolderItemIsLoading,
    isFetching: smartFolderItemIsFetching,
  } = useGetSmartFolderItem(
    {
      smartFolderItemId: smartFolderItemId!,
      smartFolderApiType: smartFolderApiType!,
    },
    {
      query: { enabled: isSmartFolderMode },
    },
  );

  // 추천 자료
  const { data: smartFolderRecommendItems, isLoading: smartFolderRecommendItemIsLoading } =
    useGetSmartFolderItemsRecommendPublicItemList1(
      {
        smartFolderItemId: smartFolderItemId!,
        smartFolderApiType: smartFolderApiType!,
      },
      {
        query: { enabled: isSmartFolderMode },
      },
    );

  // 공개 자료
  const {
    data: smartFolderPublicItem,
    refetch: smartFolderPublicItemRefetch,
    isError: smartFolderPublicItemError,
    isLoading: smartFolderPublicItemIsLoading,
    isFetching: smartFolderPublicItemIsFetching,
  } = useGetPublicItem(
    {
      publicBoardItemIdOrCode: publicBoardItemIdOrCode!,
    },
    {
      query: {
        enabled: isPublicMode,
      },
    },
  );

  // 공개 자료 추천 자료
  const { data: smartFolderPublicRecommendItems, isLoading: smartFolderPublicRecommendItemIsLoading } =
    useGetSmartFolderItemsRecommendPublicItemList(
      {
        publicBoardItemIdOrCode: publicBoardItemIdOrCode!,
      },
      {
        query: { enabled: isPublicMode },
      },
    );

  const file = useMemo(() => {
    if (!isEmpty(publicBoardItemIdOrCode)) {
      return smartFolderPublicItem?.result;
    }
    return smartFolderItem?.result;
  }, [publicBoardItemIdOrCode, smartFolderItem, smartFolderPublicItem]);

  // 댓글 자료, 댓글
  const { data: replyAndAttachedItem, refetch: replyAndAttachedItemRefetch } = useGetReplyAndAttachedItemList(
    {
      driveItemKey: file?.driveItemKey as string,
    },
    {
      query: { enabled: (file?.replyCount as number) > 0 },
    },
  );

  const isParamsReady = isSmartFolderMode || isPublicMode;

  if (isParamsReady && (smartFolderItemError || smartFolderPublicItemError)) {
    notFound();
  }

  const refetch = isSmartFolderMode ? smartFolderItemRefetch : smartFolderPublicItemRefetch;

  /** 댓글 영역 */
  const [isCommentOpen, setIsCommentOpen] = useState<boolean>(false);

  const [newComment, setNewComment] = useState<{
    comment: string;
    attachedDriveItemList: SmartFolderItemResult[];
  }>({
    comment: '',
    attachedDriveItemList: [],
  });
  const [replyInputs, setReplyInputs] = useState<{
    [key: number]: {
      isEditing: boolean; // 댓글 수정 여부
      content: string; // 댓글 내용
      attachedDriveItemList: SmartFolderItemResult[]; // 사진 리스트
    };
  }>({});

  // 이미지를 업로드 하는 곳이 어디인지? 댓글 or 답글
  const [uploadContext, setUploadContext] = useState<{
    type: 'sub' | 'reply';
    parentId?: number;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const { mutate: addReply, isSuccess: addApplySuccess } = useAddReply({
    mutation: {
      onMutate: async (request) => {
        const driveItemKey = file?.driveItemKey as string;
        const queryKey = '/file/v2/common-smart-folder/replies-for-detailed-info';
        const prevData = queryClient.getQueryData<
          ApiResponseSmartFolderItemDetailedResult | ApiResponsePublicUrlItemDetailedResult
        >([queryKey, { driveItemKey }]);
        const prevReplyList = prevData?.result?.replyList ?? [];

        const newReply = {
          id: Date.now(),
          writerProfileName: userInfo?.name,
          writerProfileThumbUrl: userInfo?.photoUrl,
          contents: request.data.contents,
          attachedFiles: newComment.attachedDriveItemList,
        };
        let updatedReplyList;

        if (request.data.parentId) {
          const parentId = Number(request.data.parentId);

          updatedReplyList = prevReplyList?.map((reply) => {
            if (reply?.id === parentId) {
              const newSubReply = {
                ...newReply,
                attachedFiles: replyInputs[parentId].attachedDriveItemList,
              };
              const updatedSubReplies = [newSubReply, ...(reply?.subReplies ?? [])];
              return {
                ...reply,
                subReplies: updatedSubReplies,
              };
            }
            return reply;
          });
        } else {
          updatedReplyList = [newReply, ...prevReplyList];
        }

        const next = {
          ...prevData,
          result: {
            ...prevData?.result,
            replyList: updatedReplyList,
          },
        };

        queryClient.setQueryData([queryKey, { driveItemKey: file?.driveItemKey }], next);

        return { prevData };
      },
      onError: (err, _, context) => {
        const driveItemKey = file?.driveItemKey as string;
        const queryKey = '/file/v2/common-smart-folder/replies-for-detailed-info';
        queryClient.setQueryData([queryKey, { driveItemKey }], context?.prevData);
      },
    },
  });
  const { mutate: deleteReply, isSuccess: deleteApplySuccess } = useDeleteReply({
    mutation: {
      onMutate: async (request) => {
        const queryKey = '/file/v2/common-smart-folder/replies-for-detailed-info';
        const driveItemKey = file?.driveItemKey as string;
        const prevData = queryClient.getQueryData<
          ApiResponseSmartFolderItemDetailedResult | ApiResponsePublicUrlItemDetailedResult
        >([queryKey, { driveItemKey }]);

        const prevReplyList = prevData?.result?.replyList ?? [];
        const updatedReplyList = prevReplyList.map((reply) => {
          const replyId = Number(request.replyId);

          if (reply?.id === replyId) {
            return {
              ...reply,
              state: 1,
              contents: '삭제된 댓글 입니다.',
              attachedFiles: [],
            };
          }

          const updatedSubReplies = reply?.subReplies?.map((subReply) =>
            subReply?.id === Number(request.replyId)
              ? {
                  ...subReply,
                  state: 1,
                  contents: '삭제된 댓글입니다.',
                  attachedFiles: [],
                }
              : subReply,
          );

          return {
            ...reply,
            subReplies: updatedSubReplies,
          };
        });

        const next = {
          ...prevData,
          result: {
            ...prevData?.result,
            replyList: updatedReplyList,
          },
        };

        queryClient.setQueryData([queryKey, { driveItemKey: file?.driveItemKey }], next);

        return { prevData };
      },
      onError: (err, _, context) => {
        const queryKey = '/file/v2/common-smart-folder/replies-for-detailed-info';
        const driveItemKey = file?.driveItemKey as string;

        queryClient.setQueryData([queryKey, { driveItemKey }], context?.prevData);
      },
    },
  });
  const { mutate: updateReply, isSuccess: updateApplySuccess } = useUpdateReply({
    mutation: {
      onMutate: async (request) => {
        const queryKey = '/file/v2/common-smart-folder/replies-for-detailed-info';
        const driveItemKey = file?.driveItemKey as string;

        const prevData = queryClient.getQueryData<
          ApiResponseSmartFolderItemDetailedResult | ApiResponsePublicUrlItemDetailedResult
        >([queryKey, { driveItemKey }]);

        const prevReplyList = prevData?.result?.replyList ?? [];
        const updatedReplyList = prevReplyList.map((reply) => {
          const replyId = Number(request.replyId);

          if (reply?.id === replyId) {
            return {
              ...reply,
              contents: request.data.contents,
              attachedFiles: replyInputs[reply?.id].attachedDriveItemList,
            };
          }

          const updatedSubReplies = reply?.subReplies?.map((subReply) =>
            subReply?.id === replyId
              ? {
                  ...subReply,
                  contents: request.data.contents,
                  attachedFiles: replyInputs[replyId].attachedDriveItemList,
                }
              : subReply,
          );

          return {
            ...reply,
            subReplies: updatedSubReplies,
          };
        });

        const next = {
          ...prevData,
          result: {
            ...prevData?.result,
            replyList: updatedReplyList,
          },
        };

        queryClient.setQueryData([queryKey, { driveItemKey: file?.driveItemKey }], next);

        return { prevData };
      },
      onError: (err, _, context) => {
        const queryKey = '/file/v2/common-smart-folder/replies-for-detailed-info';
        const driveItemKey = file?.driveItemKey as string;

        queryClient.setQueryData([queryKey, { driveItemKey }], context?.prevData);
      },
    },
  });
  const { mutateAsync: renameItem, isSuccess: renameItemSuccess, isPending: isPendingRenameItem } = useRenameItem2();
  const { mutate: likeDriveItem } = useLikeDriveItem({
    mutation: {
      onMutate: async () => {
        const queryKey = isSmartFolderMode
          ? '/file/v2/common-smart-folder/detailed-info'
          : '/file/v2/public-url-item/detailed-info';
        const prevData = isSmartFolderMode
          ? queryClient.getQueryData<ApiResponseSmartFolderItemDetailedResult>([
              queryKey,
              { smartFolderItemId, smartFolderApiType },
            ])
          : queryClient.getQueryData<ApiResponsePublicUrlItemDetailedResult>([queryKey, { publicBoardItemIdOrCode }]);

        const hasLiked = prevData?.result?.hasLiked;
        const likeCount = prevData?.result?.likeCount ?? 0;

        const next = {
          ...prevData,
          result: {
            ...prevData?.result,
            hasLiked: !hasLiked,
            likeCount: hasLiked ? Math.max(0, likeCount - 1) : likeCount + 1,
          },
        };

        if (isSmartFolderMode) {
          queryClient.setQueryData([queryKey, { smartFolderItemId, smartFolderApiType }], next);
        } else {
          queryClient.setQueryData([queryKey, { publicBoardItemIdOrCode }], next);
        }

        return { prevData };
      },
      onError: (err, _, context) => {
        const queryKey = isSmartFolderMode
          ? '/file/v2/common-smart-folder/detailed-info'
          : '/file/v2/public-url-item/detailed-info';

        if (isSmartFolderMode) {
          queryClient.setQueryData([queryKey, { smartFolderItemId, smartFolderApiType }], context?.prevData);
        } else {
          queryClient.setQueryData([queryKey, { publicBoardItemIdOrCode }], context?.prevData);
        }
      },
    },
  });
  const { mutate: starred } = useStarred({
    mutation: {
      onMutate: async ({ data }) => {
        const { driveItemKey } = data;
        const isTargetFile = driveItemKey === file?.driveItemKey;

        const getQuery = (type: 'detail' | 'recommend') => {
          if (type === 'recommend') {
            return isSmartFolderMode
              ? '/file/v2/common-smart-folder/recommand-items-for-detailed-info'
              : '"/file/v2/public-url-item/recommand-items-for-detailed-info"';
          }
          return isSmartFolderMode
            ? '/file/v2/common-smart-folder/detailed-info'
            : '/file/v2/public-url-item/detailed-info';
        };

        const getQueryParams = () =>
          isSmartFolderMode ? { smartFolderItemId, smartFolderApiType } : { publicBoardItemIdOrCode };

        const queryDetailKey = getQuery('detail');
        const prevDetailData = queryClient.getQueryData<
          ApiResponseSmartFolderItemDetailedResult | ApiResponsePublicUrlItemDetailedResult
        >([queryDetailKey, getQueryParams()]);

        if (isTargetFile) {
          const isFavorite = prevDetailData?.result?.isFavorite;

          const next = {
            ...prevDetailData,
            result: {
              ...prevDetailData?.result,
              isFavorite: !isFavorite,
            },
          };

          queryClient.setQueryData([queryDetailKey, getQueryParams()], next);
        }

        const queryKey = getQuery('recommend');
        const prevRecommendData = queryClient.getQueryData<ApiResponseListSmartFolderItemResult>([
          queryKey,
          getQueryParams(),
        ]);

        const updateRecommendItems = prevRecommendData?.result?.map((item) => {
          if (driveItemKey === item.driveItemKey) {
            return {
              ...item,
              isFavorite: !item.isFavorite,
            };
          }
          return item;
        });

        const next = {
          ...prevRecommendData,
          result: updateRecommendItems,
        };

        queryClient.setQueryData([queryKey, getQueryParams()], next);

        return {
          prevDetailData,
          prevRecommendData,
        };
      },
      onError: (err, _, context) => {
        const getQueryKey = (type: 'detail' | 'recommend') => {
          if (type === 'recommend') {
            return isSmartFolderMode
              ? '/file/v2/common-smart-folder/recommand-items-for-detailed-info'
              : '"/file/v2/public-url-item/recommand-items-for-detailed-info"';
          }
          return isSmartFolderMode
            ? '/file/v2/common-smart-folder/detailed-info'
            : '/file/v2/public-url-item/detailed-info';
        };

        const getQueryParams = () =>
          isSmartFolderMode ? { smartFolderItemId, smartFolderApiType } : { publicBoardItemIdOrCode };

        queryClient.setQueryData([getQueryKey('detail'), getQueryParams()], context?.prevDetailData);
        queryClient.setQueryData([getQueryKey('recommend'), getQueryParams()], context?.prevRecommendData);
      },
    },
  });
  const { mutate: addViewCount } = useAddViewCount();

  const { mutateAsync: addMemo, isSuccess: addMemeoSuccess } = useAddMemoToFile();
  const { mutateAsync: updateMemo, isSuccess: updateMemeoSuccess } = useUpdateDriveItemMemo();

  const { mutateAsync: getCdnFilesForDownload } = useGetCdnFilesForDownloadV2();

  const { mutateAsync: rejectRecommendationItem } = useRejectRecommendationItem();
  const { getPublicCdnFile, saveBlobToFile } = useGetCdnFile();

  const { postFile } = useS3FileUpload();

  const containerRef = useRef<HTMLDivElement>(null);

  const recommendItemList = useMemo(() => {
    if (!isEmpty(publicBoardItemIdOrCode)) {
      return smartFolderPublicRecommendItems?.result;
    }
    return smartFolderRecommendItems?.result;
  }, [publicBoardItemIdOrCode, smartFolderPublicRecommendItems, smartFolderRecommendItems]);

  const replyAttachedFileList = useMemo(() => {
    return replyAndAttachedItem?.result?.replyAttachedFileList;
  }, [replyAndAttachedItem]);

  const replyList = useMemo(() => {
    return replyAndAttachedItem?.result?.replyList;
  }, [replyAndAttachedItem]);

  // refetch 메모이제이션
  const refetchSmartFolderItem = useCallback(async () => {
    if ((smartFolderItemId && smartFolderApiType) || publicBoardItemIdOrCode) {
      await refetch();
    }
  }, [smartFolderItemId, smartFolderApiType, publicBoardItemIdOrCode, refetch]);

  const fetchCdnFile = useCallback(
    async (isForDownload: boolean) => {
      const excludedFileTypes = ['STORY_BOARD', 'LECTURE_PLAN_REPORT', 'LECTURE_PLAN', 'STUDENT_RECORD'];
      const isExcludedFileType = excludedFileTypes.includes(file?.fileType as string);

      if (isExcludedFileType && !isForDownload) {
        return undefined;
      }
      const { result } = await getCdnFilesForDownload({
        data: {
          driveItemKeys: [file?.driveItemKey || ''],
          period: 360,
          ip: IP_ADDRESS,
          isForDownload,
        },
      });
      return result?.[0];
    },
    [file, getCdnFilesForDownload],
  );

  const [memo, setMemo] = useState<{ title: string; content: string }>({
    title: '',
    content: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  const fileExtension = file?.name ? getFileExtension(file.name) : null;
  // const fileIdNumber = smartFolderItemId ? Number(smartFolderItemId) : null; 공개 자료는 id가 없음

  /** 정보 영역 */
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  // 공유 관리 모달
  const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState(false);
  const [shareLinkItem, setShareLinkItem] = useState<SmartFolderItemResult | IDetailtoItem | null>(null);

  /** 파일 영역 */
  // 파일 뷰어 풀스크린 모드 상태
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [cdnFile, setCdnFile] = useState<CdnFileResult | undefined>(undefined);
  const [isFailCdnFile, setIsFailCdnFile] = useState<boolean>();

  // 추천, 댓글 자료 드롭다운 id
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  /** 프로필 영역 */
  // const [showButton, setShowButton] = useState(false);
  const [isEditFileName, setEditFileName] = useState(false);
  const [fileName, setFileName] = useState('');

  const [isTagModal, setTagModal] = useState(false);

  /** 다운로드 모달  */
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const { handleSave, handleCopy } = useHandleFile();
  /* 선택한 폴더에 저장 & 이동 & 복사 */
  const [currentAction, setCurrentAction] = useState<'save' | 'copy' | null>(null);
  const [currentActionItem, setCurrentActionItem] = useState<
    SmartFolderItemResult | SmartFolderItemDetailedResult | IDetailtoItem | null
  >(null);

  const initCurrentAction = useCallback(async () => {
    // 쿼리 재호출
    await queryClient.refetchQueries({
      queryKey: ['publics'],
      type: 'active', // 활성 상태인 쿼리만
    });
    // 쿼리 재호출
    await queryClient.refetchQueries({
      queryKey: ['itemLists'],
      type: 'active', // 활성 상태인 쿼리만
    });
    // 쿼리 재호출
    await queryClient.refetchQueries({
      queryKey: [`/file/v1/my-board/${profileId}/list`],
      type: 'active',
    });
  }, [queryClient, profileId]);

  // 신고하기 모달
  const [isReportModal, setIsReportModal] = useState(false);

  const handleReportModalOpen = () => {
    setIsReportModal(true);
  };
  const handleReportModalClose = () => {
    setIsReportModal(false);
  };

  // 댓글 신고하기 모달
  const [commentReportModalInfo, setCommentReportModalInfo] = useState<IReportModalInfo>();

  const handleCommentReportModalOpen = (replyId: number, targetProfileName: string) => {
    setCommentReportModalInfo({
      isShow: true,
      id: replyId,
      targetProfileName,
    });
  };
  const handleCommentReportModalClose = () => {
    setCommentReportModalInfo({
      isShow: false,
    });
  };

  // useEffect(() => {
  //   document.body.style.overflow = 'hidden';
  //   return () => {
  //     // 모달이 닫힐 때 원래 상태로 복원
  //     document.body.style.overflow = 'auto';
  //   };
  // }, []);

  useEffect(() => {
    // 이전 URL 가져오기 (document.referrer 사용)
    // const prevUrl = document.referrer;

    // 이전 URL이 특정 prefix로 시작하면 버튼 보이기
    // if (prevUrl.includes('/work-board')) {
    //   setShowButton(true);
    // } else {
    //   setShowButton(false);
    // }
    if (file?.memos) {
      setMemo({
        title: file.memos[0]?.title || '',
        content: file.memos[0]?.memo || '',
      });
    }
  }, [smartFolderItemId, smartFolderApiType, profileId, publicBoardItemIdOrCode, file]);

  useEffect(() => {
    if (!file?.driveItemKey) return;
    fetchCdnFile(false)
      .then((response) => {
        setCdnFile(response);
        if (isSmartFolderMode) {
          addViewCount({
            data: {
              requestIp: IP_ADDRESS,
            },
            idOrKey: file.driveItemKey,
          });
        }
      })
      .catch(() => {
        setIsFailCdnFile(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.driveItemKey]);

  useEffect(() => {
    refetchSmartFolderItem();
  }, [renameItemSuccess, addMemeoSuccess, updateMemeoSuccess, refetchSmartFolderItem]);

  useEffect(() => {
    if (file) {
      replyAndAttachedItemRefetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addApplySuccess, deleteApplySuccess, updateApplySuccess, replyAndAttachedItemRefetch]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (type: 'sub' | 'reply', parentId?: number) => {
    setUploadContext({ type, parentId });
    fileInputRef.current?.click();
  };

  // 메모 변경 핸들러
  const handleMemoChange = (field: 'title' | 'content', value: string) => {
    setMemo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveMemo = async () => {
    setIsEditing(false);
    if (file?.memos) {
      updateMemo({
        data: {
          title: memo.title,
          memo: memo.content,
          ownerAccountId: userInfo?.accountId || 0,
          ownerProfileId: userInfo?.id || 0,
        },
        idOrKey: file!.driveItemKey!,
        memoId: file?.memos[0]?.id.toString() || '0', // 삭제 예정
      }).then(() => {
        initCurrentAction();
      });
      return;
    }
    addMemo({
      data: {
        title: memo.title,
        memo: memo.content,
        ownerAccountId: userInfo?.accountId || 0,
        ownerProfileId: userInfo?.id || 0,
      },
      idOrKey: file!.driveItemKey!,
    }).then(() => {
      initCurrentAction();
    });
  };

  const handleDeleteReply = async (id: number) => {
    deleteReply({
      driveItemIdOrKey: file!.driveItemKey,
      replyId: id.toString(),
    });
  };

  const handleAddReply = (type: 'sub' | 'reply', contents: string, parentId?: number) => {
    const attachedDriveItemKeyList =
      type === 'reply'
        ? newComment.attachedDriveItemList.map((driveItem) => driveItem.driveItemKey)
        : replyInputs[parentId as number].attachedDriveItemList.map((driveItem) => driveItem.driveItemKey);
    const request: AddReplyRequest = {
      contents,
      createdIp: '127.0.0.1',
      writerProfileId: myProfileId,
      attachedDriveItemKeyList,
    };

    if (type === 'sub') {
      request.parentId = parentId;
    }

    addReply({
      data: request,
      driveItemIdOrKey: file!.driveItemKey,
    });

    if (parentId) {
      setReplyInputs((prev) => ({
        ...prev,
        [parentId]: {
          isEditing: false,
          content: '',
          attachedDriveItemList: [],
        },
      }));
      setReplyingTo(null); // 입력 후 대댓글 창 닫기
    } else {
      setNewComment({
        comment: '',
        attachedDriveItemList: [],
      });
    }
  };

  const handleUpdateReply = (replyInput: (typeof replyInputs)[0], reply: ReplyResult) => {
    const prevFiles = reply?.attachedFiles ?? [];
    const nextFiles = replyInput.attachedDriveItemList;

    const getDiffById = (base: { driveItemKey: string }[], compare: { driveItemKey: string }[]) =>
      base.filter((item) => !compare.some((c) => c.driveItemKey === item.driveItemKey));

    const driveItemKeysToAdd = getDiffById(nextFiles, prevFiles).map((keysToAdd) => keysToAdd.driveItemKey);
    const driveItemKeysToRemove = getDiffById(prevFiles, nextFiles).map((keysToRemove) => keysToRemove.driveItemKey);

    updateReply({
      data: {
        contents: replyInput.content.trim(),
        driveItemKeysToAdd,
        driveItemKeysToRemove,
      },
      replyId: reply?.id.toString() || '0',
      driveItemIdOrKey: file?.driveItemKey || '',
    });

    setReplyInputs((prev) => ({
      ...prev,
      [reply?.id || 0]: {
        isEditing: false,
        content: '',
        attachedDriveItemList: [],
      },
    }));

    setReplyingTo(null); // 입력 후 대댓글 창 닫기
  };

  // 댓글 이미지 사진 제거
  const handleRemoveUploadedFile = (fileId: number, type: 'reply' | 'sub', replyId?: number) => {
    if (type === 'reply') {
      setNewComment((prev) => ({
        ...prev,
        attachedDriveItemList: prev.attachedDriveItemList?.filter((attachedFile) => attachedFile.id !== fileId) ?? [],
      }));
    }

    if (type === 'sub') {
      const subReplyId = replyId as number;
      setReplyInputs((prev) => ({
        ...prev,
        [subReplyId]: {
          ...prev[subReplyId],
          attachedDriveItemList:
            prev[subReplyId]?.attachedDriveItemList?.filter((attachedFile) => attachedFile.id !== fileId) ?? [],
        },
      }));
    }
  };

  const toggleFullscreen = () => {
    if (fileExtension && (EXTENSIONS.IMAGE.includes(fileExtension) || ['pdf'].includes(fileExtension))) {
      setIsFullscreen((prev) => !prev);
    }
  };

  // router 업데이트가 아닌 window의 history 업데이트
  const handleNextPrev = ({
    type,
    id, // 자료 id
    apiType, // 자료 api type
  }: {
    type?: 'next' | 'prev';
    id?: number;
    apiType: string;
  }) => {
    // const currentId = fileIdNumber ?? 0;

    // const moveId = id ?? (type === 'prev' ? currentId - 1 : currentId + 1);

    if (!userInfo) {
      router.replace('/introduce');
      return;
    }

    const newParams = new URLSearchParams(window.location.search);
    // newParams.set('smartFolderItemId', moveId.toString()); 화살표로 이동 기능은 비활성화
    newParams.delete('publicBoardItemIdOrCode');
    newParams.set('smartFolderItemId', id?.toString() || '');
    newParams.set('smartFolderApiType', apiType);
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;

    window.history.replaceState(null, '', newUrl);

    if (isFullscreen) {
      setIsFullscreen(false);
    }
  };

  // 로그인 유무
  const isAuthenticated = useMemo(() => {
    return !!userInfo;
  }, [userInfo]);

  // const dropDownHandler = (e: React.MouseEvent, type: 'recommendation' | 'comment', id: number) => {
  //   e.stopPropagation();
  //   const itemId = type === 'recommendation' ? `recommendations_${id}` : `comments_${id}`;
  //   clearAllTooltips();
  //   const newPosition = calculateMenuPosition(e, {
  //     id: itemId,
  //     parentRef: containerRef,
  //   });
  //   if (newPosition) setMenuPosition(itemId, newPosition);

  //   setOpenTooltipId(openTooltipId === itemId ? null : itemId);
  // };

  const handleDownload = async () => {
    try {
      if (file) {
        const cdnFiles = await getPublicCdnFile(file);
        const fileItem = cdnFiles?.[0];

        if (!fileItem?.url) {
          showAlert({ message: '저장에 실패했습니다.' });
          return;
        }

        const response = await fetch(fileItem.url);

        if (!response.ok) throw new Error({ statusCode: 500, title: '파일 저장 실패' });
        const blob = await response.blob();

        await saveBlobToFile(blob, file.name, fileItem.mediaType || 'application/octet-stream');
      }
    } catch (err) {
      console.error('파일 저장 실패:', err);
      showAlert({ message: '저장에 실패했습니다.' });
    }
  };

  const [loading, setLoading] = useState<boolean>(false);
  // 이미지로 저장 대응
  const [saving, setSaving] = useState<boolean>(false);
  const loadingState = useMemo(() => {
    return [
      {
        isLoading: loading,
        name: '로딩',
        message: '로딩 중...',
        priority: 0, // 가장 높은 우선순위
      },
    ];
  }, [loading]);

  const savingState = useMemo(() => {
    return [
      {
        isLoading: saving,
        name: '저장',
        message: '이미지로 저장 중입니다.',
        priority: 0,
      },
    ];
  }, [saving]);

  const { isLoading, message } = useLoadingState(loadingState);
  const { isLoading: isSaving, message: savingMessage } = useLoadingState(savingState);

  const isLoadingOrFetching = useMemo(() => {
    return (
      smartFolderItemIsLoading ||
      smartFolderItemIsFetching ||
      smartFolderPublicItemIsLoading ||
      smartFolderPublicItemIsFetching
    );
  }, [
    smartFolderItemIsFetching,
    smartFolderItemIsLoading,
    smartFolderPublicItemIsFetching,
    smartFolderPublicItemIsLoading,
  ]);

  useEffect(() => {
    setLoading(isLoadingOrFetching);
  }, [isLoadingOrFetching]);

  const handleSaveToImage = async (folderItem: SmartFolderItemResult | null, path?: string) => {
    if (!folderItem || !folderItem.id) {
      showAlert({ message: '폴더를 선택해 주세요.' });
      return;
    }

    setSaving(true);

    const elementId = fileTypeMap[file?.fileType as SaveToImageFileType] ?? '';
    const imageFileName = `${removeFileExtension(file?.name ?? '')}.png`;
    const uploadedFile: SmartFolderItemResult | undefined = await getImageAndUploadToS3({
      elementId,
      fileName: imageFileName,
      taskType: file?.fileType as SaveToImageFileType,
      smartFolderApiType: folderItem.smartFolderApiType,
      targetFolderId: folderItem.id,
    });

    if (uploadedFile) {
      addToast({ message: `이미지로 저장되었습니다. ${path && `<br />${path}`}` });
      setIsDownloadModalOpen(false);
    } else {
      showAlert({ message: '이미지로 저장 중 오류가 발생했습니다.' });
    }

    setSaving(false);
    setIsDownloadModalOpen(false);
  };

  const btnHandler = (
    type: 'info' | 'comment' | 'like' | 'star' | 'download' | 'share' | 'report' | 'copy' | 'noRecommendataion',
    item: SmartFolderItemResult | IDetailtoItem = file as SmartFolderItemResult | IDetailtoItem,
  ) => {
    if (!userInfo) {
      router.replace('/introduce');
      return;
    }
    const action: Record<typeof type, () => void> = {
      info: () => {
        setIsCommentOpen(false);
        setIsInfoOpen((prev) => !prev);
      },
      comment: () => {
        setIsInfoOpen(false);
        setIsCommentOpen((prev) => !prev);
      },
      like: () => {
        likeDriveItem({
          idOrKey: file!.driveItemKey,
          profileId,
        });
      },
      star: () => {
        starred({
          data: {
            driveItemKey: item!.driveItemKey,
          },
        });
      },
      download: () => {
        setCurrentAction('save');
        setCurrentActionItem(file as SmartFolderItemDetailedResult);
        setIsDownloadModalOpen(true);
      },
      share: () => {
        if (item) {
          setShareLinkItem(item);
        }
        setIsShareLinkModalOpen(true);
      },
      report: handleReportModalOpen,
      copy: () => {
        if (!item) {
          showAlert({ message: '파일 다운로드를 실패했습니다.' });
          return;
        }
        setCurrentAction('copy');
        const target = { ...item, smartFolderApiType };
        setCurrentActionItem(target);
        setIsDownloadModalOpen(true);
      },
      noRecommendataion: () => {
        rejectRecommendationItem({
          data: {
            driveItemKey: file!.driveItemKey,
          },
        }).then(() => {
          refetch();
        });
      },
    };
    action[type]();
  };
  const [openDropDown, setOpenDropDown] = useState<boolean>(false);
  const dropDownMenu = (item: SmartFolderItemResult): IDropDownMenu => {
    return {
      list: [
        ...(item.fileType !== 'STUDENT_RECORD' && item.fileType !== 'LECTURE_PLAN_REPORT'
          ? [
              {
                key: 'share',
                text: '공유 관리',
                action: () => btnHandler('share', item),
              },
            ]
          : []),
        {
          key: 'noRecommend',
          text: '다시 추천받지 않기',
          action: () => btnHandler('noRecommendataion', item),
        },
        { key: 'copy', text: '복사', action: () => btnHandler('copy', item) },
        {
          key: 'save',
          text: '저장',
          action: () => btnHandler('download', item),
        },
        // { key: 'delete', text: '삭제', action: () => dropDownActions('DELETE', dropDownItem) },
      ],
    };
  };
  const onDropDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpenDropDown((prev) => !prev);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !uploadContext) {
      setUploadContext(null);
      showAlert({
        message: '자료 업로드에 실패했습니다.',
      });
      return;
    }
    // 파일 업로드는 최대 5개임
    let existingFilesCount = 0;

    if (uploadContext.type === 'reply') existingFilesCount = newComment.attachedDriveItemList?.length ?? 0;

    if (uploadContext.type === 'sub' && uploadContext.parentId !== undefined)
      existingFilesCount = replyInputs[uploadContext.parentId]?.attachedDriveItemList?.length ?? 0;

    if (existingFilesCount + files.length > 5) {
      setUploadContext(null);
      showAlert({
        message: '파일은 최대 5개 까지 업로드가 가능합니다.',
      });
      return;
    }

    try {
      const filesArray: File[] = Array.from(files);
      const uploadedItemsRaw = await Promise.all(
        filesArray.map(async (uploadFile: File) => {
          const uploadFileName = uploadFile.name || '';
          const extension = getFileExtension(uploadFileName);
          const allowed = EXTENSIONS.IMAGE.includes(extension || '');

          if (allowed) {
            return (await postFile({
              file: uploadFile,
              fileType: 'IMAGE',
              taskType: 'ETC',
              source: 'FILE',
              thumbFile: uploadFile,
            })) as SmartFolderItemResult;
          }

          return null; // 조건에 안 맞으면 null 반환
        }),
      );

      // null 제거 + 타입 보정
      const uploadedItems = uploadedItemsRaw.flat().filter((item): item is SmartFolderItemResult => item !== null);

      if (uploadContext.type === 'reply') {
        setNewComment((prev) => ({
          ...prev,
          attachedDriveItemList: [...(prev.attachedDriveItemList || []), ...uploadedItems], // 기존 파일 + 새 파일
        }));
      }
      if (uploadContext.type === 'sub' && uploadContext.parentId !== undefined) {
        setReplyInputs((prev) => ({
          ...prev,
          [uploadContext.parentId!]: {
            ...prev[uploadContext.parentId!],
            attachedDriveItemList: [...(prev[uploadContext.parentId!]?.attachedDriveItemList || []), ...uploadedItems],
          },
        }));
      }
    } catch (e) {
      showAlert({
        message: '자료 업로드에 실패했습니다.',
      });
    } finally {
      setUploadContext(null); // 무조건 초기화
    }
  };

  const renderComments = (reply: ReplyResult, isReply = true) => {
    if (!reply) {
      return <div />;
    }
    const hasSubReply = Array.isArray(reply.subReplies) && reply.subReplies.length > 0;
    const isMine = userInfo?.id === reply.writerProfileId;
    return (
      <li key={reply.id}>
        <div className="item-profile">
          <Image
            width={48}
            height={48}
            alt="게시자 프로필"
            className="thumb-profile"
            src={reply.writerProfileThumbUrl}
          />
          <em className="name-profile">{reply.writerProfileName}</em>
        </div>
        <ul className="list-picture">
          {reply.attachedFiles &&
            reply.attachedFiles.length > 0 &&
            reply.attachedFiles.map((attachedFile) => (
              <li key={`attached_file_${attachedFile.id}`}>
                <Image
                  src={attachedFile.thumbUrl || ''}
                  className="img-picture"
                  width={54}
                  height={54}
                  alt={`${attachedFile.name}`}
                />
              </li>
            ))}
        </ul>
        <p className={cx('txt-reply', reply.state === 1 && 'type-delete')}>{reply.contents}</p>
        <div className="util-reply">
          <span className="txt-util">{dayjs(reply.modifiedAt).format(dateFormat.second)}</span>
          {isReply && reply.state === 0 && (
            <button
              type="button"
              className="btn-util"
              onClick={() => {
                setReplyInputs((prev) => ({
                  ...prev,
                  [reply.id]: {
                    isEditing: false,
                    content: '',
                    attachedDriveItemList: [],
                  },
                }));
                setReplyingTo(replyingTo === reply.id ? null : reply.id);
              }}
              disabled={!isReply}
            >
              댓글달기
            </button>
          )}
          {isMine && reply.state === 0 && (
            <>
              <button
                type="button"
                className="btn-util"
                onClick={() => {
                  setReplyInputs((prev) => ({
                    ...prev,
                    [reply.id]: {
                      isEditing: true,
                      content: reply.contents,
                      attachedDriveItemList: reply.attachedFiles || [],
                    },
                  }));
                  setReplyingTo(reply.id);
                }}
              >
                수정
              </button>
              <button type="button" className="btn-util" onClick={() => handleDeleteReply(reply.id)}>
                삭제
              </button>
            </>
          )}
          {!isMine && reply.state === 0 && (
            <button
              type="button"
              className="btn-util"
              onClick={() => handleCommentReportModalOpen(reply.id, reply.writerProfileName)}
            >
              신고
            </button>
          )}
        </div>

        {/* 대댓글 입력창 */}
        {replyingTo === reply.id && (
          <div className="item-reply">
            <ul className="list-picture">
              {replyInputs[reply.id].attachedDriveItemList &&
                replyInputs[reply.id].attachedDriveItemList.length > 0 &&
                replyInputs[reply.id].attachedDriveItemList.map((subAttachedDriveItem) => (
                  <li key={`reply_file_sub_${subAttachedDriveItem.id}`}>
                    <Image
                      src={`${subAttachedDriveItem?.driveItemResult?.thumbUrl}`}
                      className="img-picture"
                      alt={`${subAttachedDriveItem?.driveItemResult?.name}`}
                      width={54}
                      height={54}
                    />
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => handleRemoveUploadedFile(subAttachedDriveItem.id, 'sub', reply.id)}
                    >
                      <span className="ico-comm ico-close-solid-20-b">삭제</span>
                    </button>
                  </li>
                ))}
            </ul>
            <Textarea
              value={replyInputs[reply.id].content || ''}
              onChange={(value) =>
                setReplyInputs((prev) => ({
                  ...prev,
                  [reply.id]: {
                    ...prev[reply.id],
                    isEditing: prev[reply.id].isEditing,
                    content: value,
                  },
                }))
              }
              placeholder="댓글을 남겨보세요."
              maxLength={300}
            />
            <div className="group-btn">
              <Button size="small" color="line" icon="camera-14" onClick={() => handleUploadClick('sub', reply.id)}>
                사진올리기
              </Button>
              <Button
                size="small"
                color="primary"
                disabled={
                  replyInputs[reply.id].content.length === 0 && replyInputs[reply.id].attachedDriveItemList.length === 0
                }
                onClick={() =>
                  replyInputs[reply.id].isEditing
                    ? handleUpdateReply(replyInputs[reply.id], reply)
                    : handleAddReply('sub', replyInputs[reply.id].content.trim(), reply.id)
                }
              >
                등록
              </Button>
            </div>
          </div>
        )}
        {/* 댓글 재귀적으로 렌더링 */}
        {hasSubReply && (
          <ul className="list-reply">{reply.subReplies?.map((subReply) => renderComments(subReply, false))}</ul>
        )}
      </li>
    );
  };
  const makeBreadcrumbs = (folder: SmartFolderTreeResult | undefined): IBreadcrumbProps['items'] => {
    if (!folder) return [];

    const breadcrumbs: IBreadcrumbProps['items'] = [];

    // 현재 폴더 추가
    breadcrumbs.push({
      label: folder.name,
      href: `material-board/${getSmartFolderPath[folder.smartFolderApiType as keyof typeof getSmartFolderPath]}/${folder.id}`,
    });

    // 하위 폴더가 존재하면 재귀적으로 탐색하여 추가
    if (folder.subFolders && folder.subFolders.length > 0) {
      const sortedSubFolders = [...folder.subFolders].sort((a, b) => (a?.depth as number) - (b?.depth as number));
      sortedSubFolders.forEach((subFolder) => {
        breadcrumbs.push(...makeBreadcrumbs(subFolder));
      });
    }
    // 마지막 아이템에만 href가 있음
    return breadcrumbs.map((item, index, array) => {
      if (index === array.length - 1) {
        return item;
      }
      const { href, ...rest } = item;
      return rest;
    });
  };

  // 브레드크럼 컴포넌트
  const breadcrumbs = makeBreadcrumbs(
    file && typeof file === 'object' && 'itemPath' in file ? file.itemPath : undefined,
  );

  const handleRename = async () => {
    if (validateFileName(fileName, () => {})) return;

    await renameItem({
      data: {
        itemOwnerProfileId: file?.ownerProfileId as number,
        targetSmartFolderApiType: smartFolderApiType as CommonRenameRequestTargetSmartFolderApiType,
        targetItemId: file?.id as number,
        nameToChange: `${fileName}.${fileExtension}`,
      },
    });
    setEditFileName(false);
  };

  /*
   * 다운로드 모달 닫기
   */
  const handleCloseDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  /*
   * 다운로드 저장 버튼 클릭시
   */
  const handleConfirmDownloadModal = async (targetFolder?: SmartFolderItemResult | null, pathString?: string) => {
    if (!targetFolder) return;

    const finalize = () => {
      setCurrentAction(null);
      setCurrentActionItem(null);
      initCurrentAction();
      handleCloseDownloadModal();
    };

    if (currentAction === 'save') {
      handleSave(targetFolder, [currentActionItem?.driveItemKey || ''], pathString).then(finalize);
    }
    if (currentAction === 'copy') {
      handleCopy(
        targetFolder,
        [currentActionItem?.id || 0],
        (currentActionItem as SmartFolderItemResult).smartFolderApiType,
        pathString,
      ).then(finalize);
    }
  };
  /*
   * 편집 버튼 클릭시
   */
  const handleClickEditButton = async () => {
    switch (file?.fileType) {
      case 'STORY_BOARD':
        router.push(`/my-board/story-board/view/${file?.storyBoard?.id}?isEdit=true`);
        break;
      case 'STUDENT_RECORD':
        router.push(
          `/work-board/student-record/${file?.studentRecord?.educationalClassId}/${file?.studentRecord?.studentId}/${file?.studentRecord?.id}`,
        );
        break;
      case 'LECTURE_PLAN':
        if (file.isMine) {
          router.push(`/work-board/playing-plan/activity-card/${file?.lecturePlan?.id}`);
          return;
        }
        await getDocsFolderTree().then((docsFolderResult) => {
          if (docsFolderResult.status === 200 && docsFolderResult.result) {
            const lecturePlanFolder = docsFolderResult.result[0]?.subFolders?.find(
              (docsFolder) => docsFolder?.rootType === 'LECTURE_PLAN',
            );
            if (lecturePlanFolder && userInfo) {
              handleSave(
                {
                  ...lecturePlanFolder,
                  fileType: 'FOLDER',
                  isMine: true,
                  publicState: 'PRIVATE',
                  isHidden: false,
                  ownerAccountId: userInfo.accountId,
                  ownerProfileId: userInfo.id,
                  originalCreatorAccountId: userInfo.accountId,
                  originalCreatorProfileId: userInfo.id,
                  driveItemCreatedAt: '',
                  addedAt: '',
                  taskItemId: 0,
                  userEditable: false,
                  memoCount: 0,
                  copyCount: 0,
                  viewCount: 0,
                  likeCount: 0,
                  hasLiked: false,
                  isFavorite: false,
                  replyCount: 0,
                  totalSize: null,
                },
                [file.driveItemKey],
                '스마트폴더 > 자료 > 놀이계획서',
              )
                .then(async () => {
                  // TODO : add-item하고 난 뒤 해당 파일의 id를 알 수가 없음
                  await getIncludedDocsItems(String(lecturePlanFolder.id), {
                    targetFileType: SmartFolderItemResultFileType.LECTURE_PLAN,
                    offsetWithLimit: '0,1',
                  }).then((docsFileResult) => {
                    if (docsFileResult.status === 200 && docsFileResult.result) {
                      const myLecturePlan = docsFileResult.result.find(
                        (docsSub) => docsSub.fileType === 'LECTURE_PLAN' && docsSub.lecturePlan,
                      );

                      if (myLecturePlan) {
                        router.push(`/work-board/playing-plan/activity-card/${myLecturePlan.lecturePlan?.id}`);
                        return;
                      }
                    }

                    throw new Error({ statusCode: 500, title: '저장 실패' });
                  });
                })
                .catch(() => {
                  showAlert({ message: '저장에 실패했습니다.' });
                });
            }
          }
        });
        break;
      case 'LECTURE_PLAN_REPORT':
        router.push(`/work-board/playing-report/${file?.lecturePlanReport?.id}`);
        break;
      default:
        router.push('/work-board');
    }
  };

  const menuButtons: {
    label: string;
    onClick: () => void;
    className: string;
    icon: string;
  }[] = [
    {
      label: '좋아요',
      onClick: () => btnHandler('like'),
      className: cx('btn-feature btn-line btn-like', file?.hasLiked && 'active'),
      icon: 'ico-heart-14',
    },
    {
      label: '댓글',
      onClick: () => btnHandler('comment'),
      className: 'btn-feature btn-line',
      icon: 'ico-message-alt-14',
    },
    {
      label: '정보보기',
      onClick: () => btnHandler('info'),
      className: 'btn-feature btn-line',
      icon: 'ico-circle-information-14',
    },
    {
      label: '저장',
      onClick: () => btnHandler('download'),
      className: 'btn-feature btn-line',
      icon: 'ico-download-14-b',
    },
    ...(file?.isMine
      ? [
          ...(file.fileType !== 'STUDENT_RECORD' && file.fileType !== 'LECTURE_PLAN_REPORT'
            ? [
                {
                  label: '공유하기',
                  onClick: () => btnHandler('share', { ...file, smartFolderApiType }),
                  className: 'btn-feature btn-line',
                  icon: 'ico-export-14',
                },
              ]
            : []),
          {
            label: '즐겨찾기',
            className: cx('btn-feature btn-line btn-favorite', file?.isFavorite && 'active'),
            onClick: () => btnHandler('star'),
            icon: 'ico-favorite-14',
          },
        ]
      : [
          {
            label: '신고',
            onClick: () => btnHandler('report'),
            className: 'btn-feature btn-line',
            icon: 'ico-siren-14',
          },
        ]),
  ];

  useEffect(() => {
    setLoading(true);
  }, []);

  if (isParamsReady && !file) {
    return <Loader hasOverlay />;
  }

  if (!file) return <div />;

  return (
    <>
      <ModalBase
        isOpen
        className={cx('modal-material', isFullscreen && 'expand', isDirect && 'type-clear')}
        size="large"
        message="자료 상세"
        hiddenTitle
        onCancel={() => router.back()}
      >
        <div className="wrap-detail">
          <div className="inner-detail">
            <div
              className={cx('content-detail', (isCommentOpen || isInfoOpen) && 'side')}
              ref={containerRef}
              id="preview-layer"
            >
              <div className={cx('inner-content', !isAuthenticated && 'unauthenticated')}>
                <strong className="tit-content">{removeFileExtension(file.name)}</strong>
                <div className="head-content">
                  <div className="profile-content">
                    <Link href={`/my-board/lecture-photo?user=${file.userProfileCode}`}>
                      <Image
                        width={48}
                        height={48}
                        alt="게시자 프로필"
                        className="thumb-profile"
                        src={file.userProfileThumbUrl ?? '/images/profile.png'}
                      />
                    </Link>
                    <div className="info-profile">
                      <Link href={`/my-board/lecture-photo?user=${file.userProfileCode}`}>
                        <strong className="name-info">{file?.userProfileName ?? ''}</strong>
                      </Link>
                      <p className="desc-info">{file.userProfileBio}</p>
                    </div>
                  </div>
                  <div className="util-head">
                    <dl className="info-content">
                      <dt>
                        <span className="ico-comm ico-heart-16">좋아요</span>
                      </dt>
                      <dd>{formatCompactNumber(file.likeCount)}</dd>
                      <dt>
                        <span className="ico-comm ico-eye-16-g">조회수</span>
                      </dt>
                      <dd>{formatCompactNumber(file.viewCount)}</dd>
                    </dl>
                    {((isAuthenticated &&
                      file.isMine &&
                      (file.fileType === 'STORY_BOARD' ||
                        file.fileType === 'STUDENT_RECORD' ||
                        file.fileType === 'LECTURE_PLAN_REPORT')) ||
                      file.fileType === 'LECTURE_PLAN') && (
                      <Button size="small" color="line" icon="edit2-14" onClick={handleClickEditButton}>
                        편집
                      </Button>
                    )}
                  </div>
                </div>
                <div
                  className={cx(
                    'body-content',
                    ['STORY_BOARD', 'LECTURE_PLAN_REPORT', 'LECTURE_PLAN', 'STUDENT_RECORD', 'DOCUMENT'].includes(
                      file.fileType,
                    ) && 'body-file-content',
                  )}
                >
                  {/* {isLoading && !['LECTURE_PLAN_REPORT', 'STORY_BOARD'].includes(file.fileType) && ( */}
                  {/*  <Loader isAbsolute loadingMessage={message} /> */}
                  {/* )} */}
                  <FileViewer
                    file={file}
                    isFullScreen={isFullscreen}
                    onClick={toggleFullscreen}
                    cdnFile={cdnFile}
                    isFailCdnFile={isFailCdnFile}
                    handleDownload={handleDownload}
                  />
                  {file.fileType === 'IMAGE' && file.isMine && (
                    <div className="info-content">
                      {isEditing ? (
                        <>
                          <Input
                            id="memoTitle"
                            value={memo.title}
                            onChange={(e) => handleMemoChange('title', e.target.value)}
                            maxLength={20}
                            placeholder="메모 제목을 입력하세요"
                          />
                          <Textarea
                            value={memo.content}
                            onChange={(value) => handleMemoChange('content', value)}
                            maxLength={500}
                            placeholder="파일에 대한 메모를 입력하세요"
                          />
                          <div className="group-btn">
                            <Button size="small" color="line" onClick={() => setIsEditing(false)}>
                              취소
                            </Button>
                            <Button size="small" color="primary" onClick={handleSaveMemo}>
                              저장
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="tit-info">
                            <em className="txt-tit">{memo.title || '제목 없음'}</em>
                            {file.isMine && (
                              <button type="button" className="btn-edit" onClick={() => setIsEditing(true)}>
                                <span className="ico-comm ico-edit-16">수정하기</span>
                              </button>
                            )}
                          </div>
                          <p className="txt-info">{memo.content || '메모가 없습니다.'}</p>
                        </>
                      )}
                    </div>
                  )}
                  {isAuthenticated && (
                    <div className="feature-content">
                      {menuButtons.map(({ label, onClick, className, icon }) => (
                        <button type="button" key={`menuButtons_${label}`} className={className} onClick={onClick}>
                          <span className={`ico-comm ${icon}`}>{label}</span>
                          <TooltipContent colorType="dark" sizeType="small" position="left" contents={label} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* 추천 자료 + 댓글 이미지 Swiper */}
                {isAuthenticated && (
                  <div className="material-content">
                    <div className="head-material">
                      <strong className="tit-material">추천자료</strong>
                      {!smartFolderRecommendItemIsLoading && !smartFolderPublicRecommendItemIsLoading && (
                        <div className="util-head">
                          <Button size="small" color="line" icon="arrow-prev" className="btn-prev btn-util">
                            <span className="screen_out">목록 왼쪽으로 넘기기</span>
                          </Button>
                          <Button size="small" color="line" icon="arrow-next" className="btn-next btn-util">
                            <span className="screen_out">목록 오른쪽으로 넘기기</span>
                          </Button>
                        </div>
                      )}
                    </div>
                    {smartFolderRecommendItemIsLoading || smartFolderPublicRecommendItemIsLoading ? (
                      <div
                        className="body-material"
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '160px',
                        }}
                      >
                        <Loader loadingMessage={null} disableBodyScroll={false} />
                      </div>
                    ) : (
                      <div className="body-material">
                        {recommendItemList && recommendItemList.length > 0 ? (
                          <Swiper
                            modules={[Navigation]}
                            navigation={{
                              prevEl: '.btn-prev',
                              nextEl: '.btn-next',
                            }}
                            spaceBetween={12}
                            slidesPerView={6}
                            className="list-thumbnail-grid"
                          >
                            {recommendItemList.map((rec) => (
                              <SwiperSlide key={rec.id}>
                                <li>
                                  <Thumbnail
                                    hover
                                    className="type-upload"
                                    fileType={rec.fileType}
                                    fileName={rec.name}
                                    thumbUrl={rec.thumbUrl || ''}
                                    floatingType={floatingType({
                                      fileType: rec.fileType,
                                      isMine: rec.isMine,
                                      memoCount: rec.memoCount,
                                    })}
                                    width={128}
                                    style={{ position: 'relative', zIndex: 2 }}
                                    onClick={() =>
                                      handleNextPrev({
                                        apiType: rec.smartFolderApiType,
                                        id: rec.id,
                                      })
                                    }
                                    dropDown={openDropDown}
                                    onDropDown={onDropDown}
                                    dropDownMenu={dropDownMenu(rec)}
                                    lecturePlan={rec.lecturePlan}
                                    lecturePlanReport={rec.lectureReport}
                                    storyBoard={rec.storyBoard}
                                    likes={rec.likeCount}
                                    views={rec.viewCount}
                                    visualClassName={rec.fileType === 'LECTURE_PLAN' ? 'type-card' : undefined}
                                    isMine={rec.isMine}
                                    favorite={rec.isFavorite}
                                    onFavorite={() => btnHandler('star', rec)}
                                    isProfileImage
                                    userProfileThumbUrl={rec.profileImageUrl}
                                    userProfileCode={rec.profileCode as string}
                                  />
                                </li>
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        ) : (
                          <span>추천된 자료가 없습니다.</span>
                        )}
                      </div>
                    )}
                    {replyAttachedFileList && replyAttachedFileList.length > 0 && (
                      <div className="material-content">
                        <div className="head-material">
                          <strong className="tit-material">댓글자료</strong>
                          <div className="util-head">
                            <Button size="small" color="line" icon="arrow-prev" className="btn-prev2 btn-util">
                              <span className="screen_out">목록 왼쪽으로 넘기기</span>
                            </Button>
                            <Button size="small" color="line" icon="arrow-next" className="btn-next2 btn-util">
                              <span className="screen_out">목록 오른쪽으로 넘기기</span>
                            </Button>
                          </div>
                        </div>
                        <Swiper
                          modules={[Navigation]}
                          spaceBetween={12}
                          slidesPerView={6}
                          navigation={{
                            prevEl: '.btn-prev2',
                            nextEl: '.btn-next2',
                          }}
                          className="list-thumbnail-grid"
                        >
                          {replyAttachedFileList.map((replyAttachedFile) => (
                            <SwiperSlide key={replyAttachedFile.id}>
                              <li>
                                <Thumbnail
                                  hover
                                  className="type-upload"
                                  fileType={replyAttachedFile.fileType}
                                  fileName={replyAttachedFile.name as string}
                                  thumbUrl={replyAttachedFile.thumbUrl as string}
                                  floatingType={floatingType({
                                    fileType: replyAttachedFile.fileType,
                                    isMine: replyAttachedFile.isMine,
                                    memoCount: replyAttachedFile.memoCount,
                                  })}
                                  width={128}
                                  onClick={() =>
                                    handleNextPrev({
                                      apiType: replyAttachedFile.smartFolderApiType,
                                      id: replyAttachedFile.id,
                                    })
                                  }
                                  dropDown={openDropDown}
                                  onDropDown={onDropDown}
                                  dropDownMenu={dropDownMenu(replyAttachedFile)}
                                  likes={replyAttachedFile.likeCount}
                                  views={replyAttachedFile.viewCount}
                                  visualClassName={
                                    replyAttachedFile.fileType === 'LECTURE_PLAN' ? 'type-card' : undefined
                                  }
                                  lecturePlan={replyAttachedFile.lecturePlan}
                                  lecturePlanReport={replyAttachedFile.lectureReport}
                                  storyBoard={replyAttachedFile.storyBoard}
                                  isMine={replyAttachedFile.isMine}
                                  favorite={replyAttachedFile.driveItemResult?.starred}
                                  onFavorite={() => btnHandler('star', replyAttachedFile)}
                                  isProfileImage
                                  userProfileThumbUrl={replyAttachedFile.profileImageUrl}
                                  userProfileCode={replyAttachedFile.profileCode as string}
                                />
                                {/* </Tooltip> */}
                              </li>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                    )}
                  </div>
                )}

                {/* 댓글 패널 (우측 추가 영역) */}
                <div className={cx('aside-content reply-aside', isCommentOpen && 'show')}>
                  <strong className="tit-aside">댓글 보기</strong>
                  <div className="inner-aside">
                    <ul className="list-reply">
                      {replyList && replyList?.length > 0 ? (
                        replyList?.map((reply) => renderComments(reply))
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            flexDirection: 'column',
                            height: '100%',
                          }}
                        >
                          <div className="ico-comm ico-information-14-g" />
                          <p style={{ color: '#aaa', marginTop: 6 }}>
                            등록된 댓글이 없습니다. <br />첫 댓글의 주인공이 되어보세요.
                          </p>
                        </div>
                      )}
                    </ul>
                    <div className="item-reply">
                      <ul className="list-picture">
                        {newComment.attachedDriveItemList &&
                          newComment.attachedDriveItemList.length > 0 &&
                          newComment.attachedDriveItemList.map((attachedDriveItem) => (
                            <li key={`reply_file_${attachedDriveItem.id}`}>
                              <Image
                                src={`${attachedDriveItem?.driveItemResult?.thumbUrl}`}
                                className="img-picture"
                                alt={`${attachedDriveItem?.driveItemResult?.name}`}
                                width={54}
                                height={54}
                              />
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleRemoveUploadedFile(attachedDriveItem.id, 'reply')}
                              >
                                <span className="ico-comm ico-close-solid-20-b">삭제</span>
                              </button>
                            </li>
                          ))}
                      </ul>
                      <Textarea
                        value={newComment.comment}
                        onChange={(value) =>
                          setNewComment((prev) => ({
                            ...prev,
                            comment: value,
                          }))
                        }
                        placeholder="댓글을 남겨보세요."
                        maxLength={300}
                      />
                      <div className="group-btn">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept={EXTENSIONS.IMAGE.map((ext) => `.${ext}`).join(',')} // 사진만 허용
                          onChange={handleFileChange}
                          multiple
                          style={{ display: 'none' }}
                        />
                        <Button size="small" color="line" icon="camera-14" onClick={() => handleUploadClick('reply')}>
                          사진올리기
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          disabled={newComment.comment.length === 0 && newComment.attachedDriveItemList.length === 0}
                          onClick={() => handleAddReply('reply', newComment.comment.trim())}
                        >
                          등록
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 정보 패널 (우측 추가 영역) */}

                <div className={cx('aside-content', isInfoOpen && 'show')}>
                  <strong className="tit-aside">정보 보기</strong>
                  <div className="inner-aside">
                    <dl className="list-info">
                      <dt>
                        자료명
                        {!isEditFileName && file.isMine && (
                          <button
                            type="button"
                            className="btn-info"
                            onClick={() => {
                              setFileName(removeFileExtension(file.name));
                              setEditFileName((prev) => !prev);
                            }}
                          >
                            <span className="ico-comm ico-edit-16">수정</span>
                          </button>
                        )}
                      </dt>

                      {isEditFileName ? (
                        <dd>
                          <Input
                            id="materialTitle"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            maxLength={20}
                            placeholder="파일명을 입력하세요..."
                          />
                          <div className="group-btn">
                            <Button size="small" color="line" onClick={() => setEditFileName(false)}>
                              취소
                            </Button>
                            <Button
                              size="small"
                              color="primary"
                              disabled={fileName.length < 2 || isPendingRenameItem}
                              onClick={handleRename}
                            >
                              저장
                            </Button>
                          </div>
                        </dd>
                      ) : (
                        <dd>{removeFileExtension(file.name)}</dd>
                      )}
                      <dt>게시자</dt>
                      <dd>
                        <div
                          className="item-profile"
                          style={{
                            cursor: 'pointer',
                          }}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            router.push(
                              `/my-board/lecture-photo${file.authorProfileCode ? `?user=${file.authorProfileCode}` : ''}`,
                            )
                          }
                          onKeyDown={() => {}}
                        >
                          <Image
                            width={48}
                            height={48}
                            alt="게시자 프로필"
                            className="thumb-profile"
                            src={file.authorProfileThumbUrl ?? '/images/profile.png'}
                            style={{ borderRadius: 20 }}
                          />
                          <em className="name-profile">{file.authorProfileName ?? file.userProfileName}</em>
                        </div>
                      </dd>
                      <dt>
                        태그
                        {file.isMine && (
                          <button type="button" className="btn-info" onClick={() => setTagModal((prev) => !prev)}>
                            <span className="ico-comm ico-setting-16">설정</span>
                          </button>
                        )}
                      </dt>
                      <dd>
                        <div className="group-tag">
                          {file.tagList && file.tagList.length > 0
                            ? file.tagList.map((tag) => <Tag key={tag} text={tag || ''} />)
                            : '-'}
                        </div>
                      </dd>
                      {file.isMine && isSmartFolderMode && (
                        <>
                          <dt>위치</dt>
                          <dd>
                            <BreadCrumb
                              items={breadcrumbs}
                              onNavigate={(item) => {
                                router.push(item.href as string);
                              }}
                            />
                          </dd>
                        </>
                      )}

                      <dt>
                        공개
                        {file.isMine && (
                          <button
                            type="button"
                            className="btn-info"
                            onClick={() => {
                              setShareLinkItem({ ...file, smartFolderApiType });
                              setIsShareLinkModalOpen(true);
                            }}
                          >
                            <span className="ico-comm ico-setting-16">설정</span>
                          </button>
                        )}
                      </dt>
                      <dd>{publicState[file.publicState]}</dd>
                      <dt>등록일자</dt>
                      <dd>{dayjs(file.driveItemCreatedAt).format(dateFormat.default)}</dd>
                      <dt>자료유형</dt>
                      <dd>{fileExtension}</dd>
                      {file.totalSize > 0 && (
                        <>
                          <dt>크기</dt>
                          <dd>{formatFileSize(file.totalSize)}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalBase>
      {isTagModal && (
        <TagModal
          isOpen={isTagModal}
          driveItemKey={file.driveItemKey}
          onSave={async () => {
            await refetch();
            setTagModal(false);
          }}
          onCancel={() => setTagModal(false)}
        />
      )}

      {isShareLinkModalOpen && (
        <ShareLinkModal
          item={shareLinkItem}
          onCloseRefetch={refetch}
          onCancel={() => {
            setIsShareLinkModalOpen(false);
            setShareLinkItem(null);
          }}
        />
      )}
      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          itemData={[currentActionItem] as SmartFolderItemResult[]}
          onCancel={handleCloseDownloadModal}
          onConfirm={handleConfirmDownloadModal}
          onSaveToImage={handleSaveToImage}
          action={currentAction}
        />
      )}
      {isReportModal && (
        <ReportModal
          isOpen={isReportModal}
          onReport={() => btnHandler('report')}
          onCancel={handleReportModalClose}
          contentType="CONTENT"
          contentId={file.id} // 댓글 신고의 경우, 댓글 id로 수정해야함.
          contentSmartFolderApiType={smartFolderApiType}
          targetProfile={{ name: file.userProfileName ?? '', accountId: -1 }} // 자료 신고이므로 accountId 필요없음.
        />
      )}
      {/* 댓글 신고 */}
      {commentReportModalInfo?.isShow && (
        <ReportModal
          isOpen={commentReportModalInfo?.isShow}
          onReport={() => {}}
          onCancel={handleCommentReportModalClose}
          contentType="REPLY"
          contentId={commentReportModalInfo?.id} // 댓글 신고의 경우, 댓글 id로 수정해야함.
          contentSmartFolderApiType="Reply"
          targetProfile={{
            name: commentReportModalInfo?.targetProfileName ?? '',
            accountId: -1,
          }}
        />
      )}

      {isSaving && <Loader hasOverlay loadingMessage={savingMessage} />}
    </>
  );
};

PreviewLayer.displayName = 'PreviewLayer';
export default PreviewLayer;
