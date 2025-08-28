'use client';

import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import cx from 'clsx';
import { SmartFolderItemResult } from '@/service/file/schemas';
import dayjs from 'dayjs';
import { sanitizeAndFormat } from '@/utils';
import { MemoEditModal } from '@/components/modal/memo-edit';
import { updateMemoFile, updateDriveItemStt } from '@/service/file/fileStore';
import { useToast } from '@/hooks/store/useToastStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { AudioFleData, AudioPlayModal } from '@/components/modal/audioPlay';
import { useAlertStore } from '@/hooks/store/useAlertStore';

// 외부로 타입 정의 분리
interface IDragItem {
  type: string;
  index: number;
  referenceMemoKey?: string; // Changed from memoCardId
  contents?: string;
  memoCardId?: number;
}

interface IDraggableMemoProps {
  item: SmartFolderItemResult;
  index: number;
  onUpdate: () => void;
}

// 학생 관련 타입 정의
interface IStudent {
  thumbUrl?: string;
  name: string;
  [key: string]: any; // 추가 속성 허용
}

const DraggableMemo: React.FC<IDraggableMemoProps> = ({ item, index, onUpdate }) => {
  const addToast = useToast((state) => state.add);
  const [openMore, setOpenMore] = React.useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAudioModal, setIsAudioModal] = React.useState(false);
  const hasMemoText = useMemo(
    () => item.sttFullString || item?.memoContents?.memo,
    [item.sttFullString, item?.memoContents?.memo],
  );
  const [memoData, setMemoData] = React.useState({
    title: item?.memoContents?.title || '',
    memo: hasMemoText || '',
  });
  const moreRef = useRef(null);
  const formatDate = useMemo(() => dayjs(item.driveItemCreatedAt).format('YYYY.MM.DD'), [item.driveItemCreatedAt]);

  // 학생 관련 데이터 계산 최적화
  const studentData = useMemo(() => {
    const studentCount = item.students?.length || 0;
    const firstTwoStudents = item.students && studentCount > 0 ? item.students.slice(0, 2) : [];
    const remainStudents = (item.students && item.students.slice(2)) || [];
    const remainingCount = studentCount > 2 ? studentCount - 2 : 0;

    return { studentCount, firstTwoStudents, remainingCount, remainStudents };
  }, [item.students]);

  const [{ isDragging }, dragRef] = useDrag<IDragItem, unknown, { isDragging: boolean }>(
    () => ({
      type: 'memo',
      item: () => ({
        type: 'memo',
        index,
        referenceMemoKey: item?.id?.toString() || '',
        contents: hasMemoText,
        memoCardId: item?.id || 0,
      }),
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [index, item?.id, hasMemoText],
  );

  const toggleMoreButton = useCallback(() => setOpenMore((prev) => !prev), []);
  const toggleEditModal = useCallback(() => setIsEditModalOpen((prev) => !prev), []);
  const toggleAudioModal = useCallback(() => setIsAudioModal((prev) => !prev), []);

  // 오디오 모달
  const [nameAudio, setNameAudio] = useState('');
  const [audioData, setAudioData] = useState<any>({});
  const handleOpenAudio = (data: any) => {
    setNameAudio(data.name);
    const body = {
      ownerId: item.originalCreatorAccountId,
      ownerProfileId: item.originalCreatorProfileId,
      driveItemKeys: item.driveItemKey,
    };
    setAudioData(body);
    toggleAudioModal();
  };

  const { showAlert } = useAlertStore();
  useClickOutside(moreRef, () => setOpenMore(false));

  // 메모저장
  const handleSaveEditedContent = useCallback(async () => {
    if (memoData.memo === '') {
      showAlert({ message: '메모내용을 입력해주세요.' });
      return;
    }
    try {
      // 오디오 메모 수정일경우
      if (item.fileType === 'AUDIO') {
        const { originalCreatorAccountId: ownerAccountId, originalCreatorProfileId: ownerProfileId, id } = item;
        const body = {
          sttFullText: memoData.memo,
          ownerAccountId,
          ownerProfileId,
        };

        await updateDriveItemStt(String(id), { ...body });
        // 일반메모 수정일 경우
      } else {
        const body = {
          smartFolderApiType: item.smartFolderApiType,
          smartFolderItemId: item.id,
          memo: memoData.memo,
          title: memoData.title,
          taggedStudentIds: item.studentIds,
        };

        await updateMemoFile(body);
      }
      onUpdate();
      addToast({ message: '메모를 수정하였습니다.' });
      setIsEditModalOpen(false);
    } catch (error) {
      addToast({ message: '메모 수정 중 오류가 발생했습니다.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoData.memo, memoData.title]);

  // 메모내용 수정
  const handleChangeMemo = useCallback((val: Record<string, any>) => {
    const key = Object.keys(val)[0];
    const value = Object.values(val)[0];

    setMemoData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 프로필 렌더링 함수 최적화
  const renderProfile = useCallback(
    (student: IStudent, key: number) => (
      <div className="profile-head" key={key}>
        <span
          className="thumb-profile"
          style={{ backgroundImage: student.thumbUrl ? `url(${student.thumbUrl})` : undefined }}
        >
          {!student.thumbUrl && <span className="ico-comm ico-profile-32" />}
        </span>
        <div className="wrap-name">
          <em className="name-profile">{student.name.length > 5 ? `${student.name.slice(0, 5)}...` : student.name}</em>
        </div>
      </div>
    ),
    [],
  );

  // CSS 클래스 최적화
  const memoClassName = useMemo(() => cx('item-memo', { 'is-dragging': isDragging }), [isDragging]);

  return (
    <div
      ref={(node: HTMLDivElement | null) => {
        dragRef(node);
      }}
      className={memoClassName}
    >
      {studentData.firstTwoStudents.length > 0 && (
        <div className="head-memo">
          {studentData.firstTwoStudents.map((student, idx) => student && renderProfile(student, idx))}
          {studentData.remainingCount > 0 && (
            <div className="more-head">
              <button type="button" ref={moreRef} className="btn-more" onClick={toggleMoreButton}>
                +{studentData.remainingCount}
              </button>
              {studentData.remainStudents.length && (
                <div className={cx('menu-layer', openMore && 'show')}>
                  <ul className="list-menu">
                    {studentData.remainStudents.map((child, idx) => {
                      return (
                        <li key={(child && child.id) || idx}>
                          {child && <span className="txt-menu">{child.name}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="content-memo">
        {hasMemoText ? (
          // 정상 텍스트가 있을 때
          <p className="text-content" dangerouslySetInnerHTML={{ __html: sanitizeAndFormat(hasMemoText) }} />
        ) : (
          // 텍스트 변환에 실패했을 때
          <p className="text-content err_memo">
            <div aria-hidden="true" className="ico-comm ico-information-14-g" />
            <span>
              음성을 정확히 인식하지 못해
              <br />
              텍스트가 저장되지 않았습니다.
            </span>
          </p>
        )}
      </div>

      <div className="info-memo">
        <dl className="date-info">
          <dt className="screen_out">날짜</dt>
          <dd>{formatDate}</dd>
        </dl>
        <div className="util-info">
          {item.fileType === 'AUDIO' && (
            <button type="button" className="btn-audio" onClick={() => handleOpenAudio(item)}>
              <span className="ico-comm ico-audio-20" />
            </button>
          )}
          <button type="button" className="btn-modify" onClick={toggleEditModal}>
            <span className="ico-comm ico-message-20" />
          </button>
        </div>
      </div>

      {/* 메모 편집 모달 - 조건부 렌더링 */}
      {isEditModalOpen && (
        <MemoEditModal
          memo={memoData}
          isOpen={isEditModalOpen}
          onChangeMemo={handleChangeMemo}
          onCancel={toggleEditModal}
          onSave={handleSaveEditedContent}
        />
      )}

      {isAudioModal && (
        <AudioPlayModal data={audioData} title={nameAudio} isOpen={isAudioModal} onCancel={toggleAudioModal} />
      )}
    </div>
  );
};

// memo로 컴포넌트 감싸서 불필요한 리렌더링 방지
export default memo(DraggableMemo);
