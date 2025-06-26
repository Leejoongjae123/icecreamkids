'use client';

// 등록된 이미지 리스트
import React, { useState, memo } from 'react';
import cx from 'clsx';
import { Button } from '@/components/common';
import { IRegistersImageListProps } from '@/app/work-board/(festai)/types';
import { ImageProcessMessages } from '../../const';

// 등록된 이미지 리스트 컴포넌트
const RegistersImageList = memo(
  ({ fileInfos, isFilterDone, selectValue, onDeleteAll, onDeleteOne }: IRegistersImageListProps) => {
    const [isExpand, setIsExpand] = useState(true);

    // 최초화면, 등록된거 없을경우
    if (fileInfos.length === 0) return '';

    return (
      <div className="group-content group-image">
        <div className="head-group">
          <h4 className="title-type4">등록된 사진</h4>
          <button
            type="button"
            className={cx('btn-accordion', { active: isExpand })}
            onClick={() => setIsExpand(!isExpand)}
          >
            <span className="ico-comm ico-chevron-down">사진목록 {isExpand ? '열림' : '닫힘'}</span>
          </button>
        </div>
        <div className={cx('body-group', { show: isExpand })}>
          <div className="util-head">
            <p className="txt-util">
              <em className="txt_bold">총 {fileInfos.length}장</em>의 사진이 등록 되었습니다.
            </p>
            <Button size="small" color="line" icon="delete-14" className="btn-delete" onClick={onDeleteAll}>
              <span className="screen_out">선택된 사진 {fileInfos.length}장</span> 전체삭제
            </Button>
          </div>
        </div>
        <div className={cx('body-group', { show: isExpand })}>
          <div className="body-content">
            <ul className="list-thumbnail-grid">
              {/* 등록된 파일 목록 */}
              {fileInfos.map((fileInfo) => (
                <li key={fileInfo.id}>
                  <div className="item-thumbnail type-upload">
                    <div className="visual-thumbnail" style={{ backgroundImage: `url(${fileInfo.previewUrl})` }} />
                    <div className="content-thumbnail">
                      <strong className="title-content" title={fileInfo.file.name}>
                        {fileInfo.file.name}
                      </strong>
                    </div>
                    <div className="util-thumbnail">
                      <button className="btn-delete" onClick={() => onDeleteOne(fileInfo.id)}>
                        <span className="ico-comm ico-close-solid-20">삭제</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {isFilterDone && (
            <p className="txt-content">
              <span className="ico-comm ico-check-circle-solid-20-b" />
              {selectValue
                ? ImageProcessMessages[selectValue]?.result
                : '선택한 사진이 모두 분류됐어요! 사진을 업로드하면 추가 분류할 수 있어요.'}
            </p>
          )}
        </div>
      </div>
    );
  },
);

RegistersImageList.displayName = 'RegistersImageList';
export default RegistersImageList;
