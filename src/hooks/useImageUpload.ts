'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/store/useToastStore';
import { SmartFolderItemResult, SmartFolderResult } from '@/service/file/schemas';
import { useDrop } from 'react-dnd';
import { EXTENSIONS } from '@/const';
import { getFileExtension } from '@/utils';
import { useAlertStore } from './store/useAlertStore';

interface UseImageUploadProps {
  uploadedFiles: (File | SmartFolderResult)[];
  onFilesUpload: (files: File[] | SmartFolderItemResult[]) => void;
  maxDataLength?: number; // 최대갯수 제한 필요할경우 (놀이보고서!)
}

export const useImageUpload = ({ uploadedFiles, onFilesUpload, maxDataLength }: UseImageUploadProps) => {
  const addToast = useToast((state) => state.add);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSmartFolderItems, setSelectedSmartFolderItems] = useState<SmartFolderItemResult[]>([]);
  const { showAlert } = useAlertStore();

  // 파일 중복 체크 함수
  const filterUniqueFiles = useCallback(
    (newFiles: File[] | SmartFolderItemResult[]) => {
      return newFiles.filter(
        (newFile) =>
          !uploadedFiles.some((existingFile) => {
            // File 타입인 경우
            if (existingFile instanceof File) {
              return (
                existingFile.name === (newFile as File).name &&
                existingFile.size === (newFile as File).size &&
                existingFile.lastModified === (newFile as File).lastModified
              );
            }
            // SmartFolderResult 타입인 경우 size와 lastModified가 없으므로
            // 이름과 driveItemKey로 비교
            return existingFile.driveItemKey === (newFile as SmartFolderItemResult).driveItemKey;
          }),
      );
    },
    [uploadedFiles],
  );

  // 이미지 파일 필터링 (드롭)
  const filterImageFiles = useCallback((files: File[]) => {
    return files.filter((file) => file.type.startsWith('image/'));
  }, []);

  // 드롭된 썸네일 처리 (SmartFolderItemResult)
  const processUploadedThumbnail = useCallback(
    (items: SmartFolderItemResult[]) => {
      // 빈 배열 체크
      if (!items || items.length === 0) {
        showAlert({ message: '아이템이 선택되지 않았습니다.' });
        return;
      }

      const validItems: SmartFolderItemResult[] = [];
      const invalidItems: string[] = [];

      // 각 아이템 검증
      items.forEach((item) => {
        const fileExtension = getFileExtension(item.name);

        if (!fileExtension) {
          invalidItems.push(item.name);
          return;
        }

        if (!EXTENSIONS.IMAGE.includes(fileExtension.toLowerCase())) {
          invalidItems.push(item.name);
          return;
        }

        validItems.push(item);
      });

      // 유효성 검사 결과에 따른 메시지
      if (invalidItems.length > 0) {
        showAlert({
          message: `이미지만 등록 가능합니다`,
        });

        // 유효한 아이템이 있다면 계속 진행
        if (validItems.length === 0) return;
      }

      // 중복 파일 필터링
      const uniqueFiles = filterUniqueFiles(validItems);

      console.log('다중 처리 결과:', uniqueFiles);

      // 중복이 아닌 파일만 업로드
      if (uniqueFiles.length > 0) {
        onFilesUpload(uniqueFiles as SmartFolderItemResult[]);
        addToast({
          message: `${uniqueFiles.length}개의 이미지가 등록되었습니다.`,
        });
      } else {
        addToast({ message: '이미 등록된 이미지들입니다.' });
      }
    },
    [addToast, filterUniqueFiles, showAlert, onFilesUpload],
  );

  // 파일 처리 로직을 분리하여 코드 중복 방지
  const continueProcessingFiles = useCallback(
    (imagesToProcess: File[], totalCount: number) => {
      if (imagesToProcess.length < totalCount) {
        // 일부 파일만 이미지인 경우 또는 제한으로 일부만 처리하는 경우
        addToast({ message: `${totalCount}개 중 ${imagesToProcess.length}개가 등록되었습니다.` });
      }

      // 중복 파일 필터링
      const uniqueFiles = filterUniqueFiles(imagesToProcess);

      // 토스트 메시지 표시 로직
      if (uniqueFiles.length === 0 && imagesToProcess.length > 0) {
        // 모든 파일이 중복인 경우
        addToast({ message: '이미 등록된 이미지입니다.' });
      } else if (uniqueFiles.length < imagesToProcess.length) {
        // 일부 파일만 중복인 경우
        const duplicateCount = imagesToProcess.length - uniqueFiles.length;
        addToast({
          message: `${imagesToProcess.length}개 중 ${duplicateCount}개는 중복되어 제외하고, ${uniqueFiles.length}개를 업로드했습니다.`,
        });

        // 중복이 아닌 파일만 업로드
        if (uniqueFiles.length > 0) {
          onFilesUpload(uniqueFiles as File[]);
        }
      } else {
        // 중복 파일이 없는 경우
        addToast({ message: `${uniqueFiles.length}개의 이미지가 등록되었습니다.` });
        onFilesUpload(uniqueFiles as File[]);
      }
    },
    [addToast, filterUniqueFiles, onFilesUpload],
  );

  // 드롭된 파일 처리
  const processUploadedFiles = useCallback(
    (allFiles: File[]) => {
      // 모든 파일 중 이미지 파일만 필터링
      const imageFiles = filterImageFiles(allFiles);

      if (imageFiles.length === 0) {
        // 이미지 파일이 없는 경우
        showAlert({ message: '이미지만 등록 가능합니다.' });
        return;
      }

      // maxDataLength가 있는 경우에만 제한 로직 적용
      if (maxDataLength !== undefined) {
        const currentCount = uploadedFiles.length;
        const available = maxDataLength - currentCount;

        if (available <= 0) {
          showAlert({
            message: `최대 ${maxDataLength}건만 등록 가능합니다.<br/>업로드된 이미지를 삭제 후 다시 시도해주세요.`,
          });
          return;
        }

        // 제한 개수 내에서만 처리
        if (imageFiles.length > available) {
          const limitedFiles = imageFiles.slice(0, available);

          showAlert({
            message: `최대 ${maxDataLength}건만 등록 가능합니다.<br/> 업로드된 자료중 최신 ${available}개만 등록합니다`,
            onConfirm: () => {
              // 제한 내 파일 처리
              continueProcessingFiles(limitedFiles, imageFiles.length);
            },
          });
          return; // 얼럿 표시 후 여기서 종료
        }
      }

      // 제한이 없거나 제한 이내인 경우 바로 처리
      continueProcessingFiles(imageFiles, allFiles.length);
    },
    [filterImageFiles, showAlert, uploadedFiles, maxDataLength, continueProcessingFiles],
  );

  // 업로드 모달 핸들러
  const handleOpenUploadModal = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  // 업로드 모달에서 이미지 선택 완료 시 처리
  const handleConfirmUploadModal = useCallback(
    (items?: SmartFolderItemResult[]) => {
      // items가 있으면 사용하고, 없으면 상태값 사용
      const smartFolderItems = items || selectedSmartFolderItems;

      if (!smartFolderItems.length) {
        return;
      }

      // maxDataLength가 있는 경우에만 제한 로직 적용
      if (maxDataLength !== undefined) {
        const currentCount = uploadedFiles.length;
        const available = maxDataLength - currentCount;

        if (available <= 0) {
          // 이미 최대 개수에 도달한 경우
          showAlert({
            message: `최대 ${maxDataLength}건만 등록 가능합니다.<br/>업로드된 이미지를 삭제 후 다시 시도해주세요.`,
          });
          return;
        }

        // 제한 개수 내에서만 처리
        if (smartFolderItems.length > available) {
          const itemsToUpload = smartFolderItems.slice(0, available);

          showAlert({
            message: `최대 ${maxDataLength}건만 등록 가능합니다.<br/> 업로드된 자료중 최신 ${available}개만 등록합니다`,
            onConfirm: () => {
              // 중복 체크 후 업로드
              const uniqueItems = filterUniqueFiles(itemsToUpload) as SmartFolderItemResult[];
              if (uniqueItems.length > 0) {
                onFilesUpload(uniqueItems);
                addToast({ message: `${uniqueItems.length}개의 이미지가 추가되었습니다.` });
              }
              setIsUploadModalOpen(false);
            },
          });
          return; // 얼럿 표시 후 여기서 종료
        }
      }

      // 제한이 없거나 제한 이내인 경우 정상 처리
      const uniqueItems = filterUniqueFiles(smartFolderItems) as SmartFolderItemResult[];
      if (uniqueItems.length > 0) {
        onFilesUpload(uniqueItems);
        addToast({ message: `${uniqueItems.length}개의 이미지가 추가되었습니다.` });
      } else if (smartFolderItems.length > 0) {
        addToast({ message: '선택한 이미지가 이미 모두 등록되어 있습니다.' });
      }

      // 모달 닫기
      setIsUploadModalOpen(false);
    },
    [selectedSmartFolderItems, addToast, onFilesUpload, uploadedFiles, maxDataLength, showAlert, filterUniqueFiles],
  );
  // 업로드 모달에서 선택된 이미지 데이터 설정
  const handleSetItemData = useCallback<React.Dispatch<React.SetStateAction<SmartFolderItemResult[]>>>((items) => {
    setSelectedSmartFolderItems(items);
  }, []);

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      // TODO: 만약 외부파일 허용이 필요할 경우 NativeTypes.FILE 을 accept에 추가하면 됨!
      accept: ['THUMBNAIL'], // NativeTypes.FILE
      drop(item: { files: File[] } | SmartFolderItemResult) {
        // 파일 타입 처리
        if ('files' in item && item.files && item.files.length > 0) {
          const allFiles = Array.from(item.files);
          processUploadedFiles(allFiles);
        } else {
          processUploadedThumbnail(Array.isArray(item) ? item : ([item] as SmartFolderItemResult[]));
        }
        return undefined;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [processUploadedFiles],
  );

  return {
    isUploadModalOpen,
    drop,
    canDrop,
    isOver,
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleConfirmUploadModal,
    handleSetItemData,
    selectedSmartFolderItems,
    processUploadedFiles,
  };
};
