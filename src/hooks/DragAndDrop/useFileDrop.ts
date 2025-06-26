import { useCallback } from 'react';
import { useDrop } from 'react-dnd';
import type { IDraggedItems } from '@/components/common/DragAndDrop/Drag/types';
import type { SmartFolderItemResult } from '@/service/file/schemas';
import getValidateFileTypes from '../../utils/DragAndDrop/getValidateFileTypes';
import type { IUseFileDropProps } from './types';
import { useAlertStore } from '../store/useAlertStore';

// 타입 확장 - 실제 사용되는 형태에 맞게 확장
interface ExtendedDraggedItems extends IDraggedItems {
  name?: string;
  fileType?: string;
  playingCardData?: any;
}

export function useFileDrop({
  availableFiles,
  allowedFileTypes,
  onDrop,
  onError = (message) => alert(message),
  onDropComplete,
  uploadedFiles,
}: IUseFileDropProps) {
  const { showAlert } = useAlertStore();

  const handleDrop = useCallback(
    (dragPayload: ExtendedDraggedItems & { taskItemId: string }) => {
      /**
       * * * 드래그 앤 드롭 페이로드 타입 처리
       * ! .isdlp 파일 타입이 아니라면 경고 표시를 내뱉음
       */
      let isValidFileType = false;

      // 첫 번째 페이로드 타입 처리 (name 속성이 있는 경우)
      if (dragPayload.name) {
        const extension = dragPayload.name.split('.').pop()?.toLowerCase();
        isValidFileType = extension === 'isdlp';
      }
      // 두 번째 페이로드 타입 처리 (playingCardData 내에 정보가 있는 경우)
      else if (dragPayload.playingCardData) {
        // fileExtension 속성 확인
        if (dragPayload.playingCardData.fileExtension === '.isdlp') {
          isValidFileType = true;
        }
        // 없으면 fileName에서 확장자 추출
        else if (dragPayload.playingCardData.fileName) {
          const extension = dragPayload.playingCardData.fileName.split('.').pop()?.toLowerCase();
          isValidFileType = extension === 'isdlp';
        }
      }

      // 유효하지 않은 파일 타입인 경우 경고 표시 후 종료
      if (!isValidFileType) {
        showAlert({ message: '놀이카드 형식의 파일이 아닙니다.' });
        return;
      }

      // 이미 파일이 1개 이상 업로드되어 있는 경우 제한
      if (uploadedFiles.length >= 1) {
        // 같은 파일을 업로드하지 않은 경우에만 경고 표시
        if (
          ((dragPayload.playingCardData && dragPayload.playingCardData?.taskItemId) || dragPayload?.taskItemId) !==
          (uploadedFiles[0]?.parsedRecommendedPlayingCardData ? uploadedFiles[0]?.id : uploadedFiles[0]?.taskItemId)
        ) {
          showAlert({ message: '놀이카드는 최대 1개만 업로드할 수 있습니다.' });
          return;
        }
        // 같은 파일을 업로드한 경우
        return;
      }

      /**
       * * 업무보드 SNB 형식 처리
       */

      if (dragPayload.fileType === 'LECTURE_PLAN') {
        onDrop([dragPayload as unknown as SmartFolderItemResult]);
        onDropComplete?.();
        return;
      }

      /**
       * * playingCardData 형식 처리
       */
      if (dragPayload.playingCardData) {
        // ID 추출하여 availableFiles에서 매칭
        const cardId = dragPayload.playingCardData.recommendedPlayingCardId;

        // ID로 매칭되는 파일 찾기
        const matchingFile = availableFiles.find((file) => file.id === cardId);

        if (matchingFile) {
          console.log('매칭된 파일 찾음:', matchingFile);
          onDrop([matchingFile]);
        } else {
          // 페이로드 자체를 사용
          onDrop([dragPayload.playingCardData]);
        }

        onDropComplete?.();
        return;
      }

      const filesToUpload = availableFiles.filter((file) => dragPayload.selectedIds.includes(file.id));
      console.log('업로드될 파일 확인: ', filesToUpload);

      if (!filesToUpload.length) return;

      if (!getValidateFileTypes(filesToUpload, allowedFileTypes)) {
        onError('[useFileDrop] 지정된 파일 형식만 업로드가 가능합니다.');
        return;
      }

      onDrop(filesToUpload);
      onDropComplete?.();
    },
    [availableFiles, allowedFileTypes, uploadedFiles, onDrop, onError, onDropComplete, showAlert],
  );

  const [{ isOver }, dropRef] = useDrop<IDraggedItems & { taskItemId: string }, void, { isOver: boolean }>(
    () => ({
      accept: ['FILE_ITEM', 'PLAYING_CARD', 'THUMBNAIL'],
      drop: handleDrop,
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }),
    [handleDrop],
  );

  return { isOver, dropRef };
}
