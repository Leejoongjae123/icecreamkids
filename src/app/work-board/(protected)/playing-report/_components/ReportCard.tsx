'use client';

import { useState, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import cx from 'clsx';
import Image from 'next/image';
import { Button, Textarea, FormField, Thumbnail, Input } from '@/components/common';
import { useDrop } from 'react-dnd';
import { useReportStore } from '@/hooks/store/useReportStore';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import { useCreatePhotoCaption } from '@/service/aiAndProxy/aiAndProxyStore';
import useUserStore from '@/hooks/store/useUserStore';
import { useToast } from '@/hooks/store/useToastStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { SmartFolderItemResult, SmartFolderItemResultFileType } from '@/service/file/schemas';
import { FLOATING_BUTTON_TYPE } from '@/const';
import { useHandleMemo } from '@/hooks/useHandleMemo';
import { MemoEditModal } from '@/components/modal/memo-edit';
import { sanitizeAndFormat } from '@/utils';

const ItemTypes = {
  PLAY_CARD: 'play_card',
  MEMO: 'memo',
};

interface DragItem {
  type: string;
  id?: number;
  index: number;
  playCardId?: number;
  playCardName?: string;
  memoCardId?: number;
  contents?: string;
}

interface localFileData {
  id?: number | string;
  name?: string;
  fileType?: string;
  thumbUrl?: string;
  originalFile?: any;
  driveItemKey?: string;
  memoCount?: number;
  isMine?: boolean;
}

export interface CardData {
  id?: number;
  cardOrder?: number;
  photoDriveItemId?: number;
  title?: string;
  contents?: string;
  isUserEdited?: boolean;
  playCardId?: number;
  playCardName?: string;
  memoCardId?: number;
  isDetailMode?: boolean;
  photoDriveItemResult?: localFileData | SmartFolderItemResult;
  driveItemKey?: string;
  isCardFold?: boolean;
  isEditMode?: boolean; // 수정 모드 상태 추가
  referenceMemoKey?: string;
  referencePlanCardId?: number;
}

export interface ReportCardProps {
  card: CardData;
  index: number;
  control: any;
  getValues: any;
  setValue: any;
  mainSubject: string;
  isCardFold: boolean;
  handleRemoveFile: (index: number) => void;
  updateAIGeneratingStatus?: (cardIdOrIndex: string | number, isGenerating: boolean) => void;
  updateCardAILoading?: (cardId: string | number, isLoading: boolean) => void;
  isCardAILoading?: (cardId: string | number) => boolean;
  onEditModeChange?: (cardId: number | undefined, isEditMode: boolean) => void;
}

export interface ReportCardHandle {
  generateAIContent: () => Promise<void>;
  expandCard: () => void;
  postS3Image: () => void;
}

const ReportCard = forwardRef<ReportCardHandle, ReportCardProps>(function ReportCard(
  {
    card,
    index,
    control,
    getValues,
    setValue,
    mainSubject,
    handleRemoveFile,
    updateAIGeneratingStatus,
    updateCardAILoading,
    isCardAILoading,
    onEditModeChange,
  },
  ref,
) {
  // 훅 초기화 (순서 최적화)
  const { postFile } = useS3FileUpload();
  const { reportData } = useReportStore((state) => state);
  const { mutateAsync: createPlayReportText } = useCreatePhotoCaption();
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);
  const { userInfo } = useUserStore();

  // 상태 관리 (관련 상태끼리 그룹화)
  // UI 상태
  const [isDetailMode, setIsDetailMode] = useState<boolean>(card.isDetailMode || false);
  const [cardFold, setCardFold] = useState<boolean>(
    card.isCardFold !== undefined ? card.isCardFold : !(card.title && card.contents),
  );

  // 수정 모드 상태
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');

  // 로딩 상태
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  // 메모이제이션 최적화
  // 카드의 고유 ID 가져오기
  const cardUniqueId = useMemo(() => {
    // 카드 ID가 없으면 인덱스를 포함한 임시 ID 생성
    if (card.id) return card.id.toString();
    if (index !== undefined) return index.toString();
    return `temp-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, [card.id, index]);

  // 현재 카드가 AI 생성 중인지 확인하는 함수
  const isAiLoading = useMemo(() => {
    // 로컬 로딩 상태가 true면 무조건 로딩으로 표시
    return localLoading || (isCardAILoading ? isCardAILoading(cardUniqueId) : false);
  }, [cardUniqueId, isCardAILoading, localLoading]);

  // 메모 관련 훅
  const {
    isEditModalOpen,
    driveItemMemoData,
    onChangeMemo,
    onEdit,
    handleCloseMemoEditModal,
    handleSaveEditedContent,
  } = useHandleMemo(card.photoDriveItemResult as SmartFolderItemResult);

  const updateCard = useCallback(
    (changes: Partial<CardData>) => {
      // 현재 cards 배열 전체를 가져옴
      const allCards = getValues('cards');

      // 현재 카드의 실제 위치를 찾음 (id나 photoDriveItemId로)
      const currentIndex = allCards.findIndex(
        (c: CardData) =>
          (card.id && c.id === card.id) ||
          (card.photoDriveItemId && c.photoDriveItemId === card.photoDriveItemId) ||
          (card.photoDriveItemResult?.id && c.photoDriveItemResult?.id === card.photoDriveItemResult.id),
      );

      if (currentIndex === -1) return; // 못 찾으면 리턴

      // 찾은 위치에 업데이트
      setValue(`cards.${currentIndex}`, {
        ...allCards[currentIndex],
        ...changes,
      });
    },
    [getValues, setValue, card.id, card.photoDriveItemId, card.photoDriveItemResult?.id],
  );

  // AI 생성 상태 업데이트
  const updateAIStatus = useCallback(
    (isGenerating: boolean) => {
      setLocalLoading(isGenerating);
      if (updateCardAILoading) {
        updateCardAILoading(cardUniqueId, isGenerating);
      }
      if (updateAIGeneratingStatus) {
        updateAIGeneratingStatus(cardUniqueId, isGenerating);
      }
    },
    [cardUniqueId, updateCardAILoading, updateAIGeneratingStatus],
  );

  // 드래그 앤 드롭 핸들러 (간소화)
  const handleDrop = useCallback(
    (item: DragItem) => {
      if (item.type === ItemTypes.PLAY_CARD) {
        console.log('놀이카드를 뿅!!', item);
        updateCard({
          playCardId: item.playCardId || 0,
          playCardName: item.playCardName || '',
        });
      } else if (item.type === ItemTypes.MEMO) {
        updateCard({
          contents: item.contents || '',
          memoCardId: item.memoCardId || 0,
        });
      }
    },
    [updateCard],
  );

  const handleContentChange = useCallback(
    (newValue: string) => {
      updateCard({
        contents: newValue,
        isUserEdited: true,
        isDetailMode: false,
      });
    },
    [updateCard],
  );

  // 이미지 업로드 최적화
  const uploadLocalImage = useCallback(async () => {
    const localFile = card.photoDriveItemResult as localFileData;
    if (!localFile?.originalFile) return null;

    try {
      const result = await postFile({
        file: localFile.originalFile,
        fileType: 'IMAGE',
        taskType: 'LECTURE_PLAN_REPORT',
        source: 'FILE',
        thumbFile: localFile.originalFile,
      });
      return result;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  }, [card.photoDriveItemResult, postFile]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleIsOnlyFileImageUpload = useCallback(async () => {
    const localFile = card.photoDriveItemResult as localFileData;
    if (localFile?.originalFile) {
      try {
        const postImageResult = await postFile({
          file: localFile.originalFile,
          fileType: 'IMAGE',
          taskType: 'LECTURE_PLAN_REPORT',
          source: 'FILE',
          thumbFile: localFile.originalFile,
        });
        const potentialData = postImageResult;
        const id = potentialData && 'id' in potentialData ? potentialData.id : 0;

        updateCard({ photoDriveItemId: id });
      } catch (error) {
        console.log('Error', error);
      }
    }
  }, [card.photoDriveItemResult, postFile, updateCard]);

  // AI 처리 로직 최적화
  const handleApplyReportAi = useCallback(
    async (action: 'ai' | 'edit') => {
      // 수정 모드 처리
      if (action === 'edit') {
        setEditTitle(card.title || '');
        setEditContent(card.contents || '');
        setIsEditMode(true);
        onEditModeChange?.(card.id, true);
        return;
      }

      // AI 생성 처리
      if (!mainSubject?.trim()) {
        showAlert({ message: '놀이주제를 입력해주세요.' });
        updateAIStatus(false);
        return;
      }

      updateAIStatus(true);

      try {
        let CardPostResult;
        let driveItemKey;

        // 로컬 파일이 있는 경우 업로드
        const localFile = card.photoDriveItemResult as localFileData;
        if (localFile?.originalFile) {
          const postImageResult = await postFile({
            file: localFile.originalFile,
            fileType: 'IMAGE',
            taskType: 'LECTURE_PLAN_REPORT',
            source: 'FILE',
            thumbFile: localFile.originalFile,
          });

          CardPostResult = postImageResult as SmartFolderItemResult;
          driveItemKey = CardPostResult?.driveItemKey;
        }

        // driveItemKey 확인 - 업로드 결과 또는 기존 데이터에서 가져오기
        if (!driveItemKey && card.photoDriveItemResult) {
          // SmartFolderItemResult 타입인 경우
          if ('driveItemKey' in card.photoDriveItemResult) {
            driveItemKey = card.photoDriveItemResult.driveItemKey;
          }
        }

        if (!driveItemKey) {
          showAlert({ message: '이미지 업로드 후 유효한 키를 얻지 못했습니다.' });
          return;
        }

        // AI 텍스트 생성
        const referenceMemoText = card.memoCardId ? card.contents : getValues(`cards.${index}.contents`);

        const requestData = {
          profileId: userInfo?.id as number,
          subject: mainSubject,
          studentAge: reportData?.studentAge,
          referenceDriveItemKey: driveItemKey,
          playCardId: card.playCardId || undefined,
          memoCardId: card.memoCardId || undefined,
          ...(referenceMemoText && { referenceMemoText }),
        };

        const { result, status } = await createPlayReportText({
          data: requestData,
        });

        if (status === 200 && result) {
          const { title, contents } = result;

          // photoDriveItemId 결정 - 원본 로직과 동일하게
          const photoDriveItemId =
            (CardPostResult as SmartFolderItemResult)?.id ||
            card.photoDriveItemId ||
            (card.photoDriveItemResult as SmartFolderItemResult)?.driveItemResult?.id ||
            0;

          updateCard({
            title,
            contents,
            isUserEdited: false,
            photoDriveItemId,
            isDetailMode: true,
            isEditMode: false,
          });
          setIsDetailMode(true);
          setIsEditMode(false);
        } else {
          showAlert({
            message: `보고서 생성에 실패했습니다. 다시 시도해주세요. <br/> [ code : ${status} ]`,
          });
        }
      } catch (error) {
        console.error('AI generation error:', error);
        showAlert({ message: 'AI 생성 중 오류가 발생했습니다.' });
      } finally {
        updateAIStatus(false);
      }
    },
    [
      card,
      mainSubject,
      reportData?.studentAge,
      userInfo?.id,
      postFile,
      createPlayReportText,
      updateCard,
      updateAIStatus,
      showAlert,
      getValues,
      index,
      onEditModeChange,
    ],
  );

  // 편집 모드 핸들러 통합
  const handleEditAction = useCallback(
    (action: 'save' | 'reset' | 'cancel') => {
      switch (action) {
        case 'save':
          if (!editTitle.trim() || !editContent.trim()) return;

          updateCard({
            title: editTitle,
            contents: editContent,
            isUserEdited: true,
            isDetailMode: true,
            isEditMode: false,
          });
          setIsEditMode(false);
          setIsDetailMode(true);
          addToast({ message: '수정된 내용이 저장되었습니다.' });
          onEditModeChange?.(card.id, false);
          break;

        case 'reset':
          showAlert({
            message: '수정 중인 내용이 삭제됩니다.<br/>초기화 하시겠습니까?',
            onCancel: () => {},
            onConfirm: () => {
              setEditTitle('');
              setEditContent('');
            },
          });
          break;

        case 'cancel':
          showAlert({
            message: '수정을 취소하시겠습니까?<br/>변경 사항이 저장되지 않습니다.',
            onCancel: () => {},
            onConfirm: () => {
              setIsEditMode(false);
              setIsDetailMode(true);
              onEditModeChange?.(card.id, false);
            },
          });
          break;
        default:
          break;
      }
    },
    [editTitle, editContent, updateCard, addToast, showAlert, card.id, onEditModeChange],
  );

  // 카드 액션
  const handleCardAction = useCallback(
    (action: 'remove' | 'reset' | 'toggleFold') => {
      switch (action) {
        case 'remove': {
          if (isAiLoading) {
            showAlert({ message: 'AI 생성 중인 카드는 삭제할 수 없습니다.' });
            return;
          }

          const cards = getValues('cards');
          if (cards.length === 1) {
            showAlert({ message: '최소 한 개 이상의 카드가 필요합니다.' });
            return;
          }

          showAlert({
            message: '해당 카드를 삭제하시겠습니까?',
            onCancel: () => {},
            onConfirm: () => {
              // 편집 모드 강제 종료
              if (isEditMode) {
                setIsEditMode(false);
                setEditTitle('');
                setEditContent('');
                onEditModeChange?.(card.id, false);
              }

              const getCards = getValues('cards');

              // URL 정리
              const cardToRemove = getCards[index];
              const localFile = cardToRemove.photoDriveItemResult as localFileData;
              if (localFile?.thumbUrl && localFile.originalFile) {
                URL.revokeObjectURL(localFile.thumbUrl);
              }

              // 카드 삭제 후 남은 카드들에 새로운 uniqueKey 할당
              const updatedCards = getCards
                .filter((_: CardData, i: number) => i !== index)
                .map((cardItem: CardData, newIndex: number) => ({
                  ...cardItem,
                  // 강제로 새로운 key 생성
                  uniqueKey: `${cardItem.id || 'new'}-${Date.now()}-${newIndex}-${Math.random().toString(36).substr(2, 5)}`,
                }));

              setValue('cards', updatedCards);
              setTimeout(() => {
                setValue('cards', [...updatedCards]);
              }, 0);
              addToast({ message: '카드가 삭제되었습니다.' });
            },
          });
          break;
        }

        case 'reset':
          showAlert({
            message: '생성된 내용이 삭제됩니다.<br/>초기화 하시겠습니까?',
            onCancel: () => {},
            onConfirm: () => {
              handleRemoveFile(index);
              setIsDetailMode(false);
              updateCard({ title: '', contents: '' });
            },
          });
          break;

        case 'toggleFold':
          setCardFold((prev) => !prev);
          break;
        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAiLoading, getValues, setValue, index, showAlert, addToast, handleRemoveFile, updateCard],
  );

  const generateAIContent = useCallback(async () => {
    if (!isDetailMode) {
      updateAIStatus(true);
      await handleApplyReportAi('ai');
    }
  }, [isDetailMode, updateAIStatus, handleApplyReportAi]);

  const postS3Image = useCallback(async () => {
    if (!isDetailMode) {
      await handleIsOnlyFileImageUpload();
    }
  }, [isDetailMode, handleIsOnlyFileImageUpload]);

  const expandCard = useCallback(() => {
    setCardFold(false);
  }, []);

  useImperativeHandle(ref, () => ({
    generateAIContent,
    expandCard,
    postS3Image,
  }));

  // 드래그 앤 드롭 설정
  const [{ isOver }, drop] = useDrop<DragItem, unknown, { isOver: boolean }>(() => ({
    accept: [ItemTypes.PLAY_CARD, ItemTypes.MEMO],
    drop: handleDrop,
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  // 로딩중 상태
  const renderLoadingState = () => (
    <div
      className="loading-box"
      style={{
        minHeight: 245,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Image src="/images/loading_img.svg" alt="" className="img-loading" priority width={24} height={24} />
      <p>내용을 생성중입니다</p>
    </div>
  );

  // 편집 모드
  const renderEditMode = () => (
    <>
      <div className="edit-form" style={{ padding: '10px 0' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor={`edit-title-${index}`} className="screen_out">
            제목 수정
          </label>
          <Input
            id={`edit-title-${index}`}
            placeholder="제목을 입력하세요"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`edit-content-${index}`} className="screen_out">
            내용 수정
          </label>
          <Textarea
            id={`edit-content-${index}`}
            placeholder="내용을 입력하세요"
            maxLength={500}
            value={editContent}
            onChange={setEditContent}
          />
        </div>
      </div>
      <div className="util-report util-edit-report" style={{ justifyContent: 'end' }}>
        <Button size="small" color="line" onClick={() => handleEditAction('cancel')}>
          취소
        </Button>
        <Button size="small" color="line" onClick={() => handleEditAction('reset')} style={{ marginLeft: 0 }}>
          초기화
        </Button>
        <Button
          size="small"
          color="primary"
          onClick={() => handleEditAction('save')}
          style={{ marginLeft: 0 }}
          disabled={!editTitle.trim() || !editContent.trim()}
        >
          저장
        </Button>
      </div>
    </>
  );

  // 입력 모드
  const renderInputMode = () => (
    <>
      <div className={cx('card-report', { 'drop-active': isOver && !card.playCardName })}>
        {!card.playCardName ? (
          <div className="item-empty">
            <span className="ico-comm ico-upload-26" />
            <p className="txt-empty">놀이카드를 드래그하면 더 정확한 결과가 만들어집니다.</p>
          </div>
        ) : (
          <div className="item-file">
            <span className="ico-comm ico-document-empty-20" />
            <span className="txt-file">
              <span className="txt-ellipsis">{card.playCardName || card.title}</span>
            </span>
            <button type="button" className="btn-del" onClick={() => handleRemoveFile(index)}>
              <span className="ico-comm ico-close-16-g">삭제하기</span>
            </button>
          </div>
        )}
      </div>
      <div className={cx('content-report', { 'drop-active': isOver && !card.memoCardId })}>
        <FormField
          control={control}
          name={`cards.${index}.contents`}
          render={({ field }) => (
            <Textarea
              id={`content-${index}`}
              placeholder="메모를 드래그 하거나 업로드 하면 메모내용에 맞게 사진의 내용을 정리해 줍니다."
              maxLength={500}
              {...field}
              value={field.value || ''}
              onChange={(newValue) => {
                field.onChange(newValue);
                handleContentChange(newValue);
              }}
            />
          )}
        />
      </div>
      <div className="util-report">
        <button type="button" className="btn-toggle" onClick={() => handleCardAction('toggleFold')}>
          <span className="ico-comm ico-triangle-12">{cardFold ? '영역 펼치기' : '영역 접기'}</span>
        </button>
        {cardFold ? (
          <span className="txt-util">놀이카드 작성하기</span>
        ) : (
          <Button
            size="small"
            color="line"
            icon="wand-14"
            className="btn-ai"
            onClick={() => {
              updateAIStatus(true);
              handleApplyReportAi('ai').catch(() => {
                updateAIStatus(false);
                showAlert({ message: 'AI 생성 중 오류가 발생했습니다.' });
              });
            }}
          >
            AI 생성
          </Button>
        )}
      </div>
    </>
  );

  // 상세 모드
  const renderDetailMode = () => (
    <>
      <strong className="tit-report">{card.title}</strong>
      <p
        className="txt-report"
        dangerouslySetInnerHTML={{
          __html: sanitizeAndFormat(card.contents),
        }}
      />
      <div className="util-report" style={{ justifyContent: 'end' }}>
        <Button size="small" color="line" onClick={() => handleCardAction('reset')}>
          초기화
        </Button>
        <Button size="small" color="line" onClick={() => handleApplyReportAi('edit')} style={{ marginLeft: 0 }}>
          수정
        </Button>
      </div>
    </>
  );

  return (
    <>
      <div className="item-card" ref={drop as unknown as React.RefObject<HTMLDivElement>}>
        <Thumbnail
          fileName={card.photoDriveItemResult?.name || ''}
          fileType={card.photoDriveItemResult?.fileType as SmartFolderItemResultFileType}
          thumbUrl={card.photoDriveItemResult?.thumbUrl || ''}
          floatingType={
            isAiLoading
              ? FLOATING_BUTTON_TYPE.None
              : card?.photoDriveItemResult?.memoCount
                ? FLOATING_BUTTON_TYPE.CloseEdit
                : FLOATING_BUTTON_TYPE.Close
          }
          nameHidden
          hover
          isMine={card?.photoDriveItemResult?.isMine}
          onClose={() => handleCardAction('remove')}
          onEditToggle={(e) => console.log(e)}
          onEdit={onEdit}
          eagerLoading
        />
        <div className={cx('wrap-report', cardFold ? 'fold' : '')}>
          {isAiLoading
            ? renderLoadingState()
            : isEditMode
              ? renderEditMode()
              : !isDetailMode || !card.contents
                ? renderInputMode()
                : renderDetailMode()}
        </div>
      </div>
      {isEditModalOpen && driveItemMemoData && (
        <MemoEditModal
          memo={driveItemMemoData}
          isOpen={isEditModalOpen}
          onChangeMemo={onChangeMemo}
          onCancel={handleCloseMemoEditModal}
          onSave={handleSaveEditedContent}
        />
      )}
    </>
  );
});

export default ReportCard;
