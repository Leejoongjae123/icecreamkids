'use client';

import { Input, ModalBase, Tag } from '@/components/common';
import { useAddTag, useGetByIdOrKey, useGetRecentTagsV2, useGetRecommendationKeyword } from '@/service/file/fileStore';
import { type KeyboardEvent, useEffect, useMemo, useState } from 'react';
import useUserStore from '@/hooks/store/useUserStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { useToast } from '@/hooks/store/useToastStore';
import type { ITagModalProps } from './types';

export const TagModal = ({ isOpen, onSave, onCancel, driveItemKey }: ITagModalProps) => {
  const { userInfo } = useUserStore();
  const profileId = userInfo?.id ?? 0;
  const accountId = userInfo?.accountId ?? 0;
  const { data: recentTags } = useGetRecentTagsV2(profileId.toString());
  const recentTagList = useMemo(() => {
    return recentTags?.result || [];
  }, [recentTags]);

  const { data: driveItemByKey, refetch: getbyIdOrKey } = useGetByIdOrKey(
    driveItemKey,
    {
      owner_id: String(accountId),
      includes: 'tags',
    },
    {
      query: { enabled: accountId !== 0 },
    },
  );

  const driveItem = useMemo(() => {
    return driveItemByKey?.result;
  }, [driveItemByKey]);

  const { data: recommendKeywords, refetch: getRecommendationKeyword } = useGetRecommendationKeyword({
    requestCount: '5',
  });

  const recommendKeywordList = useMemo(() => {
    return recommendKeywords?.result || [];
  }, [recommendKeywords]);

  const { mutateAsync: addTag } = useAddTag();

  const { showAlert } = useAlertStore();
  const { add: addToast } = useToast();

  const [inputValue, setInputValue] = useState<string>('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      getbyIdOrKey();
      getRecommendationKeyword();
    }
  }, [getRecommendationKeyword, getbyIdOrKey, isOpen]);

  useEffect(() => {
    if (driveItem?.tags) {
      setCurrentTags(driveItem.tags);
    }
  }, [driveItem?.tags]);

  const handleSearch = async () => {
    if (inputValue.trim().length <= 0) {
      return;
    }
    if (currentTags.length + 1 > 10) {
      showAlert({ message: '태그는 10개까지 등록이 가능합니다.' });
      return;
    }

    /**
     * * (임시) 태그 추가 로직
     * ! (주의) 정책 및 기획적인 허점이 존재한다고 판단되어 역제안 예정
     * TODO: 태그 정책 역제안 & UX적으로 개선 필요
     */
    setCurrentTags((prevTags) => {
      const updatedTags = [...prevTags, inputValue];
      setInputValue('');
      return Array.from(new Set(updatedTags));
    });
  };
  const addTags = (tag: string) => {
    if (currentTags.length + 1 > 10) {
      showAlert({ message: '태그는 10개까지 등록이 가능합니다.' });
      return;
    }
    setCurrentTags((prevTags) => {
      const updatedTags = [...prevTags, tag];
      setInputValue('');
      return Array.from(new Set(updatedTags));
    });
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = currentTags.filter((t) => t !== tag);
    setCurrentTags(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // 엔터를 누른 경우에만 검색 수행
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (!driveItem) {
    return null;
  }

  return (
    <ModalBase
      isOpen={isOpen}
      message="태그 관리"
      onCancel={onCancel}
      onConfirm={async () => {
        const result = await addTag({
          data: {
            keys: [driveItemKey],
            tags: currentTags,
          },
        });
        addToast({ message: result.status === 200 ? '태그 저장을 성공했습니다.' : '태그 저장을 실패했습니다.' });
        onSave();
      }}
      className="modal-tag"
    >
      <div className="item-modal">
        <strong className="tit-info">자료명</strong>
        <div className="cont-info">
          <span className="txt-info">{driveItem.name}</span>
        </div>
      </div>
      <div className="item-modal">
        <strong className="tit-info">태그 등록</strong>
        <div className="cont-info">
          <Input
            id="inpTag"
            placeholder="태그를 입력해주세요"
            value={inputValue}
            maxLength={10}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {currentTags.length > 0 && (
            <div className="inner-tags">
              {currentTags.map((tag) => {
                return <Tag key={tag} text={tag} type="delete" onClick={() => handleRemoveTag(tag)} />;
              })}
            </div>
          )}
        </div>
      </div>
      <div className="item-modal">
        <strong className="tit-info">최근 사용 태그</strong>
        <div className="cont-info">
          <div className="inner-tags">
            {recentTagList.length > 0 ? (
              recentTagList.map((recentTag) => {
                return <Tag key={`recent_${recentTag}`} text={recentTag} onClick={() => addTags(recentTag)} />;
              })
            ) : (
              <span className="txt-info txt-nodata">아직 등록된 태그가 없습니다.</span>
            )}
          </div>
        </div>
      </div>
      <div className="item-modal">
        <strong className="tit-info">추천 태그</strong>
        <div className="cont-info">
          <div className="inner-tags">
            {recommendKeywordList.map((recommendTag) => {
              return (
                <Tag
                  key={`recommend_${recommendTag}`}
                  text={recommendTag}
                  onClick={() => {
                    addTags(recommendTag);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </ModalBase>
  );
};
