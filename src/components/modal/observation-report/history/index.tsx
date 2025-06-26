import React, { MouseEvent, useEffect, useRef } from 'react';
import { ModalBase } from '@/components/common';
import { StudentRecordResult } from '@/service/file/schemas';
import dayjs, { dateFormat } from '@/lib/dayjs';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export function ObservationReportHistoryModal({
  historyList = [],
  studentName = '',
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  onSelect,
  onCancel,
}: {
  historyList: StudentRecordResult[] | undefined;
  studentName: string | undefined;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  onSelect: (studentRecord: StudentRecordResult) => void;
  onCancel: () => void;
}) {
  const message = '히스토리';

  /** 무한 스크롤 */
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef<() => void>(() => {}); // 데이터의 최신 상태 유지하기 위해 ref 생성
  useEffect(() => {
    callbackRef.current = async () => {
      if (hasNextPage && !isFetchingNextPage && !isLoading) {
        await fetchNextPage();
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isLoading]);

  /** 무한 스크롤 옵저브 선언 */
  const { observe } = useInfiniteScroll({
    callback: () => callbackRef.current(), // 항상 최신 상태의 callback을 실행
    threshold: 0.5,
  });

  /** 옵저브 요소 할당 */
  useEffect(() => {
    if (loadMoreRef.current) {
      observe(loadMoreRef.current);
    }
  }, [observe]);

  const handleClickHistory = (e: MouseEvent, studentRecord: StudentRecordResult) => {
    e.preventDefault();

    onSelect(studentRecord);
    onCancel();
  };

  return (
    <ModalBase message={message} isOpen size="small" cancelText="닫기" className="modal-history" onCancel={onCancel}>
      {historyList.length > 0 ? (
        <ul className="list-history">
          {historyList.map((history, index) => {
            return (
              <li key={history.id}>
                <a href="/" className="link-history" onClick={(e) => handleClickHistory(e, history)}>
                  아이관찰기록_{studentName}_{dayjs(history.modifiedAt).format(dateFormat.second)}
                </a>
                {/* 무한 스크롤 감지 div */}
                {historyList?.length === index + 1 && <div ref={loadMoreRef} style={{ background: 'transparent' }} />}
              </li>
            );
          })}
        </ul>
      ) : (
        <span className="txt-empty">히스토리에 저장된 내용이 없습니다.</span>
      )}
    </ModalBase>
  );
}
