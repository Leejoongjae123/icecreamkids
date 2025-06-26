'use client';

import React, { useState, useCallback, useEffect, ChangeEvent, memo, useMemo } from 'react';
import { Checkbox } from '@/components/common';
import { ImageUploadArea } from '@/components/common/ImageUploadArea';
import { SmartFolderResult } from '@/service/file/schemas';
import cx from 'clsx';
import { IFilterOption, T_FILTER_TYPE } from '@/app/work-board/(festai)/types';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { FILTER_TYPE } from './types';

export interface FilterProps {
  inputName: string;
  type: T_FILTER_TYPE;
  onWorkExecute?: (selectedOptions: string[], files: (File | SmartFolderResult)[]) => void;
  onFilesUpload: (files: File[] | SmartFolderResult[]) => void;
  onChoiceValue: (value: string) => void;
  uploadedFiles: (File | SmartFolderResult)[];
}

const WorkAiFilterClient: React.FC<FilterProps> = ({
  inputName,
  type,
  onWorkExecute,
  onFilesUpload,
  onChoiceValue,
  uploadedFiles = [],
}) => {
  const storageKey = `WorkAiFilterClient_${type}`;
  const { showAlert } = useAlertStore();
  // 컴포넌트 마운트 시 sessionStorage에 저장된 값이 있으면 불러오고, 없으면 FILTER_TYPE[type]으로 초기화
  const [filterOptions, setFilterOptions] = useState<IFilterOption[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored) as IFilterOption[];
        } catch (e) {
          console.error('필터 옵션 파싱 오류:', e);
        }
      }
    }
    return FILTER_TYPE[type];
  });
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  // filterOptions 상태 변경 시 sessionStorage에 저장하여 다음 마운트 때 활용
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(filterOptions));
  }, [filterOptions, storageKey]);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem(storageKey);
    };
  }, [storageKey]);

  const MemoizedCheckbox = memo(Checkbox);
  const MemoizedImageUploadArea = memo(ImageUploadArea);

  // 옵션 선택 상태 변경 핸들러 (체크박스, 라디오 모두 처리)
  const handleInputChange = useCallback((id: string, inputType: 'checkbox' | 'radio', checked: boolean) => {
    setFilterOptions((prevOptions) =>
      prevOptions.map((option) => {
        if (option.id === id) {
          return { ...option, checked };
        }
        // radio 버튼이면 같은 그룹 내 다른 옵션은 false 처리
        if (inputType === 'radio' && option.type === 'radio' && option.id !== id) {
          return { ...option, checked: false };
        }
        return option;
      }),
    );
  }, []);

  const onChangeValue = useCallback(
    (option: IFilterOption) => (e: ChangeEvent<HTMLInputElement>) => {
      if (['mergePhoto', 'faceReplaceFace'].includes(option.value)) {
        setIsSubmitDisabled(true);
        showAlert({ message: '서비스 준비 중입니다.' });
        return;
      }
      handleInputChange(option.id, option.type, e.target.checked);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleInputChange],
  );

  const selectedValue = useMemo(
    () => filterOptions.filter((option) => option.checked).map((option) => option.value),
    [filterOptions],
  );

  // 선택한 값 부모로 올리기
  useEffect(() => {
    if (selectedValue.length === 0) return;
    onChoiceValue(selectedValue[0] || '');
  }, [selectedValue, onChoiceValue]);

  // 작업 실행 핸들러 (이 함수 실행 후에도 filterOptions 상태는 sessionStorage에 의해 보존됨)
  const handleWorkExecute = useCallback(async () => {
    const selectedOptions = filterOptions.filter((option) => option.checked).map((option) => option.value);
    if (onWorkExecute) {
      await onWorkExecute(selectedOptions, uploadedFiles);
    }
    // 데이터 없을 경우를 위한 딜레이 추가
    setTimeout(() => {
      const swiperElement = document.querySelector('.workAiSwiper');
      if (swiperElement) {
        swiperElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [filterOptions, onWorkExecute, uploadedFiles]);

  return (
    <div className={cx('group-preset', `type-${type}`)}>
      {/* 필터 옵션 선택 영역 */}
      <div className="group-choice">
        {filterOptions.map((option) => (
          <MemoizedCheckbox
            key={option.id}
            type={option.type}
            isImage
            className="type-image"
            isIcoHidden={option.isIcoHidden}
            name={inputName}
            id={option.id}
            label={option.label}
            checked={option.checked}
            value={option.value}
            thumbnail={option.thumbnail}
            onChange={onChangeValue(option)}
          />
        ))}
      </div>

      {/* 이미지 업로드 영역 */}
      <MemoizedImageUploadArea
        onFilesUpload={onFilesUpload}
        uploadedFiles={uploadedFiles}
        type={type}
        className="item-preset preset-type3"
      />

      {/* 작업 실행 버튼 */}
      <button
        className={cx('btn-preset btn-black', { 'btn-disabled': uploadedFiles.length === 0 })}
        onClick={handleWorkExecute}
        disabled={uploadedFiles.length === 0 || isSubmitDisabled}
      >
        <span className="ico-comm ico-comm ico-illust-sort-40" />
        작업 실행
      </button>
    </div>
  );
};

WorkAiFilterClient.displayName = 'WorkAiFilterClient';
export default WorkAiFilterClient;
