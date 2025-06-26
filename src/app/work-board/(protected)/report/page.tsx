'use client';

import AppLayout from '@/components/layout/AppLayout';
import { type ChangeEvent, useState, useEffect } from 'react';
import { Button, Checkbox, Loader, Radio, RangeCalendar } from '@/components/common';
import useUserStore from '@/hooks/store/useUserStore';
import { getPhotosForReport } from '@/service/file/fileStore';
import { ApiResponseListSmartFolderItemResult, SmartFolderItemResult } from '@/service/file/schemas';
import { useRouter } from 'next/navigation';
import { useReportStore } from '@/hooks/store/useReportStore';
import { ImageUploadArea } from '@/components/common/ImageUploadArea';
import { useToast } from '@/hooks/store/useToastStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { AGE_OPTIONS } from '@/const';
// import { RegisterThumbnail } from './_components/RegisterThumbnail';

//새로 작업될 리포트 페이지
function ReportPage() {
  const { userInfo } = useUserStore();
  const { showAlert } = useAlertStore();
  const router = useRouter();
  const addToast = useToast((state) => state.add);
  const setReportData = useReportStore((state) => state.setReportData);

  // 상태관리
  const [selectedAge, setSelectedAge] = useState<number>(2);
  const [allAgree, setAllAgree] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<(File | SmartFolderItemResult)[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: '',
    endDate: '',
  });
  const [editStates, setEditStates] = useState<Record<number, boolean>>({});
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SmartFolderItemResult[]>([]); // 기존 선택된 id 상태는 제거하고, 대신 전체 이미지 객체를 저장할 상태 추가
  const [registeredImages, setRegisteredImages] = useState<SmartFolderItemResult[]>([]); // 등록된 이미지 상태
  const [imageCache, setImageCache] = useState<{
    [key: string]: SmartFolderItemResult[] | ApiResponseListSmartFolderItemResult;
  }>({}); // 캐시 처리용 상태 (키: "startDate_endDate")

  // 나이설정
  const handlePlayingAge = (e: ChangeEvent<HTMLInputElement>) => setSelectedAge(+e.target.value);

  // 활동 기간 변경 처리
  const handlePeriodChange = (key: string, v: string) => {
    setSelectedPeriod((prev) => ({
      ...prev,
      [key]: v,
    }));
  };

  // 중복 체크
  const processNewImages = (newImages: SmartFolderItemResult[]) => {
    // 이미 등록된 이미지와 중복 검사 - 더 정확한 중복 검사 로직
    const uniqueImages = newImages.filter((newImg) => {
      // 기존 이미지와 비교할 때 id와 driveItemKey 모두 확인
      return !registeredImages.some(
        (regImg) =>
          regImg.id === newImg.id ||
          (regImg as any).smartFolderItemId === newImg.id ||
          regImg.driveItemKey === newImg.driveItemKey ||
          (regImg.name === newImg.name && regImg.fileType === newImg.fileType),
      );
    });

    // 중복 메시지 처리
    if (uniqueImages.length < newImages.length) {
      const duplicateCount = newImages.length - uniqueImages.length;
      addToast({
        message: `${newImages.length}개 중 ${duplicateCount}개는 중복되어 제외했습니다.`,
      });
    }

    // 이미지 추가 개수 알림
    if (uniqueImages.length > 0) {
      addToast({
        message: `${uniqueImages.length}개의 이미지가 추가되었습니다.`,
      });
    }

    return uniqueImages;
  };

  // 기간 이미지 조회
  const handleGetPeriodImage = async () => {
    if (!userInfo?.id) return;

    const periodKey = `${selectedPeriod.startDate}_${selectedPeriod.endDate}`;
    let fetchedData: SmartFolderItemResult[] = [];

    // 캐시 처리
    if (imageCache[periodKey]) {
      fetchedData = imageCache[periodKey] as SmartFolderItemResult[];
    } else {
      // 이미지 호출
      setIsSubmitLoading(true);
      try {
        const response = await getPhotosForReport(String(userInfo.id), {
          startsAt: selectedPeriod.startDate,
          endsAt: selectedPeriod.endDate,
        });

        fetchedData = response?.result || [];
        if (fetchedData.length === 0) {
          addToast({ message: '기간내에 등록된 이미지가 없습니다.' });
          return;
        }
        setImageCache((prev) => ({ ...prev, [periodKey]: fetchedData }));
      } catch (error) {
        addToast({ message: '이미지를 불러오는 중 오류가 발생했습니다.' });
        return;
      } finally {
        setIsSubmitLoading(false);
      }
    }

    // 현재 등록된 이미지 + 가져올 이미지 수가 30개를 초과하는지 확인
    const totalImagesAfterAdd = registeredImages.length + fetchedData.length;
    if (totalImagesAfterAdd > 30) {
      // 30개 제한 알림 및 최신 이미지만 등록
      showAlert({
        message: '최대 30개만 등록 가능합니다.<br/> 업로드된 자료중 최신 30개만 등록합니다',
        onConfirm: () => {
          // 남은 슬롯 계산
          const remainingSlots = Math.max(0, 30 - registeredImages.length);
          // 남은 슬롯만큼만 가져오기
          const limitedData = fetchedData.slice(0, remainingSlots);

          // 중복 체크 및 등록
          const imagesToAdd = processNewImages(limitedData);
          if (imagesToAdd?.length > 0) {
            setRegisteredImages((prev) => [...prev, ...imagesToAdd]);
            // uploadedFiles에도 추가 (중요: 이미 SmartFolderItemResult 타입이므로 그대로 추가)
            setUploadedFiles((prev) => [...prev, ...imagesToAdd]);
          }
        },
      });
    } else {
      // 30개 이내라면 정상 처리
      const imagesToAdd = processNewImages(fetchedData);
      if (imagesToAdd?.length > 0) {
        setRegisteredImages((prev) => [...prev, ...imagesToAdd]);
        // uploadedFiles에도 추가
        setUploadedFiles((prev) => [...prev, ...imagesToAdd]);
      }
    }
  };

  // 컴포넌트 마운트 시 초기화 로직
  useEffect(() => {
    // 컴포넌트 마운트 시 상태 초기화
    return () => {
      // 컴포넌트 언마운트 시 생성한 URL 객체 정리
      registeredImages.forEach((image) => {
        if (image.thumbUrl && (image as any).originalFile) {
          URL.revokeObjectURL(image.thumbUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesUpload = (items: File[] | SmartFolderItemResult[], isProcessed = false) => {
    if (!items || items.length === 0) return;

    // ImageUploadArea 컴포넌트에서 이미 제한 로직을 처리하므로
    // 여기서는 중복 체크와 변환만 진행하고 등록 로직을 수행

    // 내컴퓨터에서 올린 이미지일 경우
    if (items[0] instanceof File) {
      const fileItems = items as File[];

      // File 객체를 SmartFolderItemResult 형태로 변환
      const convertedImages = fileItems.map((file) => {
        const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          id: uniqueId,
          name: file.name,
          driveItemKey: `local_${uniqueId}`,
          thumbUrl: URL.createObjectURL(file),
          fileType: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
          driveItemCreatedAt: new Date().toISOString(),
          originalFile: file,
        };
      });

      // 중복 체크
      const imagesToAdd = processNewImages(convertedImages as any);

      if (imagesToAdd?.length > 0) {
        const newUploadedFiles = imagesToAdd.map((img) => (img as any).originalFile || img);
        setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
        setRegisteredImages((prev) => [...prev, ...imagesToAdd]);
      }
    } else {
      const smartFolderItems = items as SmartFolderItemResult[];
      const imagesToAdd = processNewImages(smartFolderItems);

      if (imagesToAdd?.length > 0) {
        setUploadedFiles((prev) => [...prev, ...imagesToAdd]);
        setRegisteredImages((prev) => [...prev, ...imagesToAdd]);
      }
    }
  };

  // 첨부된 이미지 제거
  const handleRemoveImage = (id: number | string) => {
    const removedImage = registeredImages.find((img) => {
      // 문자열과 숫자 모두 처리
      return img.id === id || img.id === Number(id) || String(img.id) === String(id);
    });

    if (!removedImage) {
      console.error('삭제할 이미지를 찾을 수 없습니다:', id);
      return;
    }

    // URL 객체 해제
    if (removedImage.thumbUrl && (removedImage as any).originalFile) {
      URL.revokeObjectURL(removedImage.thumbUrl);
    }

    // registeredImages에서 제거 (같은 비교 로직 사용)
    setRegisteredImages((prev) =>
      prev.filter((image) => {
        return !(image.id === id || image.id === Number(id) || String(image.id) === String(id));
      }),
    );

    // uploadedFiles에서도 제거
    setUploadedFiles((prev) => {
      return prev.filter((item) => {
        if (item instanceof File) {
          return !(removedImage && (removedImage as any).originalFile === item);
        }
        if ('id' in item) {
          return !(item.id === id || item.id === Number(id) || String(item.id) === String(id));
        }
        if ('smartFolderItemId' in item) {
          const smartId = (item as any).smartFolderItemId;
          return !(smartId === id || smartId === Number(id) || String(smartId) === String(id));
        }
        return true;
      });
    });

    // 선택된 이미지와 편집 상태에서도 제거
    setSelectedImages((prev) =>
      prev.filter((img) => {
        return !(img.id === id || img.id === Number(id) || String(img.id) === String(id));
      }),
    );

    setEditStates((prev) => {
      const newEditStates = { ...prev };
      delete newEditStates[id as any];
      return newEditStates;
    });

    addToast({ message: '이미지가 삭제되었습니다.' });
  };

  //  전체 이미지 삭제
  const handleRemoveAllImage = () => {
    // 선택된 이미지가 없으면 작업 중단
    if (selectedImages.length === 0) {
      addToast({ message: '선택된 이미지가 없습니다.' });
      return;
    }

    // 삭제 확인 다이얼로그
    showAlert({
      message: '선택한 이미지를 삭제하시겠습니까?',
      onCancel: () => {},
      onConfirm: () => {
        // 선택된 이미지 ID 목록 생성 (string과 number 모두 지원)
        const selectedIds = selectedImages.map((img) => img.id);

        // URL 객체 해제 (로컬 파일인 경우)
        selectedImages.forEach((image) => {
          if (image.thumbUrl && (image as any).originalFile) {
            URL.revokeObjectURL(image.thumbUrl);
          }
        });

        // 선택된 이미지 정보 보관 (logging용)
        const removedCount = selectedImages.length;

        // registeredImages에서 선택된 이미지 제거
        setRegisteredImages((prev) => prev.filter((img) => !selectedIds.includes(img.id)));

        // uploadedFiles에서 선택된 이미지 제거 (File과 SmartFolder 객체 모두 처리)
        setUploadedFiles((prev) => {
          return prev.filter((item) => {
            // File 객체인 경우
            if (item instanceof File) {
              // 어떤 선택된 이미지의 originalFile과도 일치하지 않는 경우만 유지
              return !selectedImages.some((selected) => (selected as any).originalFile === item);
            }

            // SmartFolderItemResult 타입 (id 속성 있는 경우)
            if ('id' in item) {
              return !selectedIds.includes(item.id);
            }

            // SmartFolderResult 타입 (smartFolderItemId 속성 있는 경우)
            if ('smartFolderItemId' in item) {
              return !selectedIds.includes((item as any).smartFolderItemId);
            }

            return true; // 나머지 타입은 유지
          });
        });

        // 편집 상태 초기화
        const newEditStates = { ...editStates };
        selectedIds.forEach((id) => {
          delete newEditStates[id];
        });
        setEditStates(newEditStates);

        // 선택된 이미지 상태 초기화
        setSelectedImages([]);

        // 결과 알림
        addToast({ message: `${removedCount}개의 이미지가 삭제되었습니다.` });
      },
    });
  };

  const handleEditToggle = (id: number) => {
    setEditStates((prev) => ({
      ...prev,
      [id]: !prev[id], // 해당 파일의 상태만 토글
    }));
  };

  useEffect(() => {
    const total = registeredImages.length;
    const selectedCount = selectedImages.length;

    // registeredImages가 20개 초과면, 최신 20개 선택 시 모두선탹으로 간주
    const maxSelectable = total > 20 ? 20 : total;
    if (selectedCount === maxSelectable && maxSelectable > 0) {
      setAllAgree(true);
    } else {
      setAllAgree(false);
    }
  }, [selectedImages, registeredImages]);

  const onEditToggle = (
    event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLDivElement>,
    id: number,
    image: SmartFolderItemResult,
  ) => {
    // 현재 선택 상태의 반대값을 새로운 상태로 사용
    const newCheckedState = !editStates[id];

    // 상태 업데이트
    handleEditToggle(id);

    if (newCheckedState) {
      setSelectedImages((prev) => {
        if (prev.some((img) => img.id === image.id)) return prev; // 중복 추가 방지
        if (prev?.length >= 20) {
          showAlert({ message: '최대 20개만 선택 가능합니다.' });
          setEditStates((prevEditStates) => ({ ...prevEditStates, [id]: false }));
          return prev;
        }
        return [...prev, image];
      });
    } else {
      setSelectedImages((prev) => prev.filter((img) => img.id !== image.id));
    }
  };

  // 선택하기 버튼 클릭 핸들러: 선택된 이미지 전체를 콘솔에 출력
  const handleSelectButtonClick = async () => {
    if (selectedImages?.length === 0) {
      addToast({ message: '최소 한 개 이상의 이미지를 선택해주세요.' });
      return;
    }

    const storeReportData = {
      studentAge: +selectedAge,
      startsAt: selectedPeriod.startDate,
      endsAt: selectedPeriod.endDate,
      lectureReportCards: selectedImages,
    };

    setReportData(storeReportData, () => {
      // 상태 업데이트 완료 후 라우팅
      router.push('/work-board/playing-report/create');
    });
  };

  // 전체체크
  const handleCheckAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setAllAgree(isChecked);
    if (isChecked) {
      if (registeredImages?.length > 20) {
        showAlert({
          message: '최대 20개만 선택 가능합니다. <br/>최신순 20개가 선택됩니다.',
          onConfirm() {
            const latest20 = registeredImages.slice(0, 20); // 최신 20개 선택
            setSelectedImages(latest20);
            const newEditStates = latest20.reduce(
              (acc, image) => {
                acc[image.id] = true;
                return acc;
              },
              {} as Record<string, boolean>,
            );
            setEditStates(newEditStates);
          },
        });
      } else {
        setSelectedImages([...registeredImages]);
        const newEditStates = registeredImages.reduce(
          (acc, image) => {
            acc[image.id] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
        setEditStates(newEditStates);
      }
    } else {
      setSelectedImages([]);
      const newEditStates = registeredImages.reduce(
        (acc, image) => {
          acc[image.id] = false;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setEditStates(newEditStates);
    }
  };

  return (
    <AppLayout bgColor="type1" isSnb={false} showFooter={false}>
      <h3 className="title-type3">놀이 보고서</h3>

    </AppLayout>
  );
}

export default ReportPage;
