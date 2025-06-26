'use client';

import React, { useCallback, useMemo, memo, useState, useRef } from 'react';
import { blurFaces, maskingFaces } from '@/service/aiAndProxy/aiAndProxyStore';
import { getIncludedPhotoItems } from '@/service/file/fileStore';
import { SmartFolderResult, SmartFolderTreeResult } from '@/service/file/schemas';
import { IClassificationParams, IUploadedFileInfo, TutorialType } from '@/app/work-board/(festai)/types';

import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useToast } from '@/hooks/store/useToastStore';
import useUserStore from '@/hooks/store/useUserStore';

import { Loader } from '@/components/common';
import AppLayout from '@/components/layout/AppLayout';
import useS3FileUpload from '@/hooks/useS3FileUpload';

// 공통 컴포넌트 feat. 빠른업무
import WorkAiFilterClient from '@/app/work-board/(festai)/_components/WorkAiFilter';
import WorkAiPhotoResultClient from '@/app/work-board/(festai)/_components/WorkAiSortResult';
import WorkAiResultSlideClient from '@/app/work-board/(festai)/_components/WorkAiResultSlide';
import RegistersImageList from '@/app/work-board/(festai)/_components/RegistersImageList';

// 공통 함수. feat. 빠른업무
import {
  handleFilesUpload,
  handleFileDelete,
  handleDeleteAll,
  uploadFilesToS3,
  fetchTaskResult,
} from '@/app/work-board/(festai)/_utils/fileProcessingUtils';
import FastAiLoader from '../_components/FastAiLoader';
import { ImageProcessMessages } from '../const';
import WorkAiTutorial from '../_components/WorkAiTutorial';

// 필요상수
const CONSTANTS = {
  LAYOUT_ARGS: { docClass: 'doc-workboard', bgColor: 'type1' },
};

// URL 해제 유틸리티 함수
// const revokeBlobUrls = (fileInfos: IUploadedFileInfo[]) => {
//   fileInfos.forEach((info) => {
//     if (!info.isPreUploaded && info.previewUrl.startsWith('blob:')) {
//       URL.revokeObjectURL(info.previewUrl);
//     }
//   });
// };

// 메인 컴포넌트
const ImageFacePrivacyPage: React.FC = () => {
  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);
  const { postFile } = useS3FileUpload();
  const { userInfo } = useUserStore();

  const [uploadedFileInfos, setUploadedFileInfos] = useState<IUploadedFileInfo[]>([]); // 업로드된 파일 정보(미리보기 URL, 파일 객체 등)를 저장
  const [currentFolderId, setCurrentFolderId] = useState<string>(''); // 현재 선택된 폴더의 ID(이미지 로드에 사용)
  const [faceBlur, setFaceBlur] = useState<SmartFolderResult[]>([]); // 흐림효과
  const [blurBreadCrumb, setBlurBreadCrumb] = useState<SmartFolderTreeResult[]>([]); // 흐림효과(브레드크럼 표시용)
  const [faceSticker, setFaceSticker] = useState<SmartFolderResult[]>([]); // 스티커 결과(분류된 폴더 목록)
  const [stickerBreadCrumb, setStickerBreadCrumb] = useState<SmartFolderTreeResult[]>([]); // 스티커 경로(브레드크럼 표시용)
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태(업로드 중인지 여부)

  const [selectValueName, setSelectValueName] = useState('');

  // 업로드된 파일 목록 최적화
  const uploadedFiles = useMemo(() => uploadedFileInfos.map((info) => info.file), [uploadedFileInfos]);

  // 반 분류
  const fetchStudentFace = useCallback(
    (params: IClassificationParams) =>
      fetchTaskResult(
        { ...params, responseWithFolder: true },
        blurFaces,
        'PRIVATE_DATA_ENCRYPTION',
        setFaceBlur,
        setBlurBreadCrumb,
        showAlert,
        '흐림효과 처리중 오류가 발생했습니다.',
      ),
    [showAlert],
  );

  // 활동 분류
  const fetchRemoveBackground = useCallback(
    (params: IClassificationParams) =>
      fetchTaskResult(
        { ...params, maskSize: 0.9, maskType: 'C', responseWithFolder: true },
        maskingFaces,
        'PRIVATE_DATA_ENCRYPTION',
        setFaceSticker,
        setStickerBreadCrumb,
        showAlert,
        '스티커효과 처리중 오류가 발생했습니다.',
      ),
    [showAlert],
  );

  // 중복 없이 결과 병합을 위한 유틸리티 함수
  const mergeUniqueResults = (
    existingResults: SmartFolderResult[],
    newResults: SmartFolderResult[],
  ): SmartFolderResult[] => {
    // ID 기준으로 중복 제거하며 병합
    const merged = [...existingResults];
    const existingIds = new Set(existingResults.map((item) => item.id));

    newResults.forEach((newItem) => {
      if (!existingIds.has(newItem.id)) {
        merged.push(newItem);
        existingIds.add(newItem.id);
      }
    });
    return merged;
  };

  const tempTimeout = (delay: number): Promise<void> => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, delay);
    });
  };

  // 실행 버튼
  const handleWorkExecute = useCallback(
    async (selectValue: string[], files: (File | SmartFolderResult)[]) => {
      if (selectValue[0] === 'faceReplaceFace') {
        showAlert({ message: '서비스 준비 중입니다.' });
        return;
      }

      // 전체 처리 시간 측정 시작
      const totalStartTime = performance.now();

      console.log('handleWorkExecute - 선택 값:', selectValue, '파일:', files);
      setSelectValueName(selectValue[0]);

      if (files?.length === 0) {
        addToast({ message: '업로드된 파일이 없습니다.' });
        return;
      }

      setIsLoading(true);
      try {
        // SmartFolderResult와 File을 구분하여 처리
        const fileInstances = files.filter((file): file is File => file instanceof File);
        const smartFolderResults = files.filter(
          (file): file is SmartFolderResult => !(file instanceof File) && 'id' in file,
        );

        // 일반 파일 처리 (기존 로직)
        const filesToUpload = uploadedFileInfos.filter(
          (info) => !info.thumbKey && fileInstances.some((f) => f.name === info.file.name),
        );
        console.log('handleWorkExecute - 업로드할 파일:', filesToUpload);
        let updatedFileInfos = [...uploadedFileInfos];

        if (filesToUpload?.length > 0) {
          const uploadResults = await uploadFilesToS3(filesToUpload, postFile, addToast, 'PRIVATE_DATA_ENCRYPTION');
          updatedFileInfos = uploadedFileInfos.map((info) => uploadResults.find((u) => u.id === info.id) || info);
          setUploadedFileInfos(updatedFileInfos);
          console.log('handleWorkExecute - 업로드 후 파일 정보:', updatedFileInfos);
        }

        // 드라이브 키 수집 (파일과 SmartFolderResult 모두에서)
        const fileItemKeys = updatedFileInfos.map((info) => info.thumbKey).filter((key): key is string => Boolean(key));
        // SmartFolderResult에서 직접 driveItemKey 수집
        const smartFolderItemKeys = smartFolderResults.map((folder) => folder.driveItemKey).filter(Boolean);
        // 두 배열 합치기
        const driveItemKeys = [...fileItemKeys, ...smartFolderItemKeys];
        const uniqueDriveItemKeys = Array.from(new Set(driveItemKeys));

        console.log('handleWorkExecute - 드라이브 키:', uniqueDriveItemKeys);
        if (!userInfo?.id) {
          addToast({ message: '사용자 정보를 찾을 수 없습니다.' });
          return;
        }

        // 10개씩 배치 처리
        const BATCH_SIZE = 10; // 한 번에 처리할 이미지 수
        const batches = Array.from({ length: Math.ceil(uniqueDriveItemKeys.length / BATCH_SIZE) }, (_, i) =>
          uniqueDriveItemKeys.slice(i * BATCH_SIZE, i * BATCH_SIZE + BATCH_SIZE),
        );

        console.log(`총 ${uniqueDriveItemKeys.length}개의 이미지를 ${batches.length}개 배치로 나누어 처리합니다.`);

        // 순차적 처리를 위한 변수들
        let allFaceBlurResults: SmartFolderResult[] = [];
        let allFaceStickerResults: SmartFolderResult[] = [];
        let hasAnyFailures = false;
        const batchTimes: { batchIndex: number; count: number; timeS: number }[] = [];

        // 순차적 처리 함수
        const processBatches = async () => {
          // reduce를 사용해 Promise 체인 생성
          await batches.reduce(async (previousPromise, batchKeys, batchIndex) => {
            // 이전 Promise가 완료될 때까지 대기
            await previousPromise;

            console.log(`배치 ${batchIndex + 1}/${batches.length} 처리 시작 (${batchKeys.length}개 이미지)`);

            // 첫 번째 배치가 아니면 지연 추가
            if (batchIndex > 0) {
              await tempTimeout(500);
            }

            const batchStartTime = performance.now();

            const batchParams: IClassificationParams = {
              profileId: userInfo.id,
              driveItemKeys: batchKeys,
              responseWithFolder: true,
            };

            // maskingFaces API에 필요한 추가 파라미터
            if (selectValue.includes('fetchSticker')) {
              batchParams.maskSize = 0.9;
              batchParams.maskType = 'C';
            }

            // 분류 요청 처리
            const classificationCalls: { name: string; promise: Promise<any> }[] = [];
            if (selectValue.includes('fetchBlurFace')) {
              classificationCalls.push({
                name: '흐림효과',
                promise: fetchStudentFace(batchParams),
              });
            }
            if (selectValue.includes('fetchSticker')) {
              classificationCalls.push({
                name: '스티커',
                promise: fetchRemoveBackground(batchParams),
              });
            }

            // 배치별 결과 처리
            const batchResults = await Promise.allSettled(classificationCalls.map((call) => call.promise));

            // 배치 처리 시간 측정 완료
            const batchEndTime = performance.now();
            const batchTimeS = (batchEndTime - batchStartTime) / 1000;

            console.log(
              `배치 ${batchIndex + 1} 처리 완료: ${batchKeys.length}개 이미지, ${batchTimeS.toFixed(2)}초 소요`,
            );

            // 배치 시간 기록
            batchTimes.push({
              batchIndex: batchIndex + 1,
              count: batchKeys.length,
              timeS: batchTimeS,
            });

            // UI 업데이트
            const loadingEl = document.querySelector('.loader-content p');
            if (loadingEl) {
              loadingEl.textContent = `${ImageProcessMessages[selectValue[0]].loading} (${batchIndex + 1}/${batches.length})`;
            }

            // 배치 결과 처리
            let batchHasFailure = false;
            batchResults.forEach((res, index) => {
              if (res.status === 'rejected') {
                console.error(`배치 ${batchIndex + 1} - ${classificationCalls[index].name} 오류:`, res.reason);

                // HTTP 상태 코드 확인 (axios 에러인 경우)
                if (res.reason?.response?.status) {
                  const statusCode = res.reason.response.status;
                  showAlert({
                    message: `${classificationCalls[index].name}: 오류 발생 (${statusCode})<br/>다시 시도해주세요.`,
                  });
                } else {
                  showAlert({
                    message: `${classificationCalls[index].name} 처리 중 오류가 발생했습니다.<br/>다시 시도해주세요.`,
                  });
                }
                batchHasFailure = true;
              } else if (res.status === 'fulfilled') {
                // 성공했지만 결과가 비어있는 경우
                if (res.value === false || (Array.isArray(res.value) && res.value.length === 0)) {
                  showAlert({
                    message: `${classificationCalls[index].name} 배치 ${batchIndex + 1} 처리에 실패하였습니다.<br/>다시 시도해주세요.`,
                  });
                  batchHasFailure = true;
                } else if (Array.isArray(res.value)) {
                  // 성공한 결과를 누적
                  if (classificationCalls[index].name === '흐림효과') {
                    allFaceBlurResults = mergeUniqueResults(allFaceBlurResults, res.value);
                  } else if (classificationCalls[index].name === '스티커') {
                    allFaceStickerResults = mergeUniqueResults(allFaceStickerResults, res.value);
                  }
                }
              }
            });

            if (batchHasFailure) {
              hasAnyFailures = true;
            }
          }, Promise.resolve()); // 초기 Promise는 즉시 해결됨
        };

        // 모든 배치 처리 실행
        await processBatches();

        // 모든 배치 처리 완료 후, 결과를 상태에 업데이트
        if (allFaceBlurResults.length > 0) {
          setFaceBlur(allFaceBlurResults);
        }

        if (allFaceStickerResults.length > 0) {
          setFaceSticker(allFaceStickerResults);
        }

        // 전체 처리 시간 측정 완료
        const totalEndTime = performance.now();
        const totalTimeS = (totalEndTime - totalStartTime) / 1000;

        // 처리 시간 결과 로깅
        console.log('=== 이미지 처리 시간 ===');
        console.log(`총 처리 시간: ${totalTimeS.toFixed(2)}초`);
        console.log(`총 ${uniqueDriveItemKeys.length}개 이미지, ${batches.length}개 배치`);
        console.log('배치별 처리 시간:');
        batchTimes.forEach((batch) => {
          console.log(`- 배치 ${batch.batchIndex}: ${batch.count}개 이미지, ${batch.timeS.toFixed(2)}초`);
        });

        // 평균 처리 시간 계산
        if (batchTimes.length > 0) {
          const avgBatchTimeS = batchTimes.reduce((sum, batch) => sum + batch.timeS, 0) / batchTimes.length;
          console.log(`배치당 평균 처리 시간: ${avgBatchTimeS.toFixed(2)}초`);
          console.log(`이미지당 평균 처리 시간: ${(totalTimeS / uniqueDriveItemKeys.length).toFixed(2)}초`);
        }

        // 최종 결과 처리
        if (hasAnyFailures) {
          addToast({ message: '일부 이미지 처리에 실패했습니다. 일부 결과만 표시됩니다.' });
        } else if (allFaceBlurResults.length > 0 || allFaceStickerResults.length > 0) {
          addToast({ message: ImageProcessMessages[selectValue[0]].result });
        } else {
          showAlert({ message: 'AI생성에 문제가 생겼습니다.<br/>다시 시도해주세요. [ code: ai ]' });
        }
      } catch (error) {
        console.error('handleWorkExecute - 오류:', error);
        addToast({ message: '작업 실행 중 오류가 발생했습니다.' });

        // 오류 발생 시에도 시간 측정 (비정상 종료)
        const errorEndTime = performance.now();
        const errorTimeS = (errorEndTime - totalStartTime) / 1000;
        console.log(`오류로 인한 종료: ${errorTimeS.toFixed(2)}초 소요`);
      } finally {
        setIsLoading(false);
      }
    },
    [uploadedFileInfos, postFile, addToast, showAlert, fetchStudentFace, fetchRemoveBackground, userInfo?.id],
  );

  const [selectFolderName, setSelectFolderName] = useState<string>(''); // 선택된 폴더 이름

  // 폴더선택
  const handleSetFolderData = useCallback(
    async (info: SmartFolderResult) => {
      console.log('handleSetFolderData - 폴더 정보:', info);
      const { id: smartFolderItemId, name } = info;

      if (!smartFolderItemId) {
        addToast({ message: '폴더 정보가 올바르지 않습니다.' });
        setCurrentFolderId('');
        return;
      }

      const folderId = String(smartFolderItemId);
      await setSelectFolderName(name);
      await setCurrentFolderId(folderId);

      // try {
      //   const { result } = await getIncludedPhotoItems(folderId, {
      //     offsetWithLimit: '0,19',
      //     sorts: 'createdAt.desc',
      //   });

      //   if (result && result.length === 0) {
      //     addToast({ message: '폴더에 등록된 이미지가 없습니다.' });
      //   } else {
      //     await setCurrentFolderId(folderId);
      //     setSelectFolderName(name);

      //     console.log('handleSetFolderData - 슬라이드 이미지 상태:', result);
      //   }
      // } catch (error) {
      //   console.error('handleSetFolderData - 오류:', error);
      //   addToast({ message: '이미지 로드 중 오류가 발생했습니다.' });
      // }
    },
    [addToast],
  );

  const setTimeObj = useRef<string | number | NodeJS.Timeout | null | undefined>(null);

  const scrollMove = async () => {
    const scrollTop = 200;
    if (window.scrollY !== scrollTop) {
      setTimeObj.current = setTimeout(() => {
        requestAnimationFrame(async () => {
          await window.scrollTo({ top: scrollTop, behavior: 'smooth' });
        });
      }, 200);
    }
  };

  const MemoizedFilterClient = memo(WorkAiFilterClient);
  // const MemoizedResultSlideClient = memo(WorkAiResultSlideClient);
  const MemoizedPhotoResultClient = memo(WorkAiPhotoResultClient);

  const [choiceValue, setChoiceValue] = useState<TutorialType>('fetchBlurFace');
  const onSetChoiceValue = useCallback((value: string) => {
    setChoiceValue(value as TutorialType);
  }, []);
  return (
    <AppLayout {...CONSTANTS.LAYOUT_ARGS}>
      {currentFolderId ? (
        <div className="workboard-ai-swiper">
          <WorkAiResultSlideClient
            type="face"
            folderName={selectFolderName}
            onClosePreview={() => setCurrentFolderId('')}
            folderId={currentFolderId}
            onScrollMove={scrollMove}
            hasErrorMessage
          />
        </div>
      ) : (
        <>
          <h3 className="title-type3">초상권 해결</h3>
          <MemoizedFilterClient
            inputName="photoSort"
            type="face"
            onWorkExecute={handleWorkExecute}
            onFilesUpload={(files) => handleFilesUpload(files, setUploadedFileInfos)}
            uploadedFiles={uploadedFiles.filter(
              (file): file is File | SmartFolderResult =>
                file instanceof File || (typeof file === 'object' && file !== null && 'id' in file),
            )}
            onChoiceValue={onSetChoiceValue}
          />
          <RegistersImageList
            fileInfos={uploadedFileInfos}
            selectValue={selectValueName}
            onDeleteAll={() =>
              handleDeleteAll(uploadedFileInfos, setUploadedFileInfos, showAlert, addToast, setFaceBlur, setFaceSticker)
            }
            onDeleteOne={(id: string) => handleFileDelete(id, setUploadedFileInfos)}
            isFilterDone={faceBlur?.length > 0}
          />
          {uploadedFileInfos.length === 0 && <WorkAiTutorial type={choiceValue} />}
        </>
      )}

      {(faceBlur?.length > 0 || faceSticker?.length > 0) && (
        <MemoizedPhotoResultClient
          onShowFolder={handleSetFolderData}
          breadCrumb={blurBreadCrumb || stickerBreadCrumb}
          title="초상권 해결"
          thumbNailList={[...faceBlur, ...faceSticker]}
        />
      )}

      {isLoading && <FastAiLoader selectValue={selectValueName} />}
    </AppLayout>
  );
};

export default memo(ImageFacePrivacyPage);
