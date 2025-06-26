'use client';

import { Button, Checkbox, ModalBase } from '@/components/common';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import SortItem from '@/app/(auth)/material-board/_components/DnDWidget';
import { SmartFolderResult } from '@/service/file/schemas';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useManageSortAndToggleHiddenWidgets } from '@/service/file/fileStore';
import useUserStore from '@/hooks/store/useUserStore';
import { IWidgetModal } from '@/app/(auth)/material-board/_components/WidgetModal/types';

const WidgetModal: React.FC<IWidgetModal> = ({ isOpen, onCancel, widgetList }): ReactNode => {
  const { userInfo } = useUserStore();
  const PROFILE_ID = userInfo?.id.toString() || '';
  const { mutateAsync } = useManageSortAndToggleHiddenWidgets();
  const [leftWidgets, setLeftWidgets] = useState<SmartFolderResult[]>([]);
  const [rightWidgets, setRightWidgets] = useState<SmartFolderResult[]>([]);

  const [selectedWidgets, setSelectedWidgets] = useState<Record<number | string, boolean>>({});

  useEffect(() => {
    setLeftWidgets(widgetList);
    setRightWidgets(() => widgetList.filter((widget) => !widget.isHidden));
    setSelectedWidgets(() =>
      widgetList.reduce(
        (acc, widget) => {
          if (!widget.isHidden) acc[widget.id] = true;
          return acc;
        },
        {} as Record<number, boolean>,
      ),
    );
  }, [isOpen, widgetList]);

  const onClose = () => {
    setLeftWidgets([]);
    setRightWidgets([]);
    setSelectedWidgets({});
  };

  // 전체 선택 or 비활성화
  const toggleSelectAll = (state: boolean) => {
    setSelectedWidgets((prev) => ({
      ...prev, // 기존 우측 리스트 체크 상태 유지
      ...Object.fromEntries(leftWidgets.map((widget) => [widget.id, !widget.isHidden ? true : state])),
    }));
  };

  // 개별 체크박스 토글
  const handleToggle = (id: number | string) => {
    setSelectedWidgets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const reorderWidgets = useCallback((dragIndex: number, hoverIndex: number) => {
    setRightWidgets((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, dragged);
      return updated;
    });
  }, []);

  const addWidgets = () => {
    setLeftWidgets((prevLeft) =>
      prevLeft.map((widget) =>
        selectedWidgets[widget.id] && widget.isHidden ? { ...widget, isHidden: false } : widget,
      ),
    );

    setRightWidgets((prevRight) => [
      ...prevRight,
      ...leftWidgets.filter(
        (widget) => selectedWidgets[widget.id] && widget.isHidden && !prevRight.some((w) => w.id === widget.id),
      ),
    ]);
  };

  /** 선택된 활성화 위젯 삭제 */
  const removeCheckedWidgets = () => {
    const checkedRightIds = Object.entries(selectedWidgets)
      .filter(([id, isChecked]) => isChecked && id.startsWith('right_')) // 우측 리스트 체크된 항목만 필터링
      .map(([id]) => Number(id.replace('right_', ''))); // 'right_' 제거 후 숫자로 변환

    if (checkedRightIds.length === 0) return; // 아무것도 선택되지 않았다면 실행 X

    setRightWidgets((prevRight) => prevRight.filter((widget) => !checkedRightIds.includes(widget.id))); // 선택된 항목 제거

    setLeftWidgets((prevLeft) =>
      prevLeft.map((widget) => (checkedRightIds.includes(widget.id) ? { ...widget, isHidden: true } : widget)),
    ); // isHidden 변경

    setSelectedWidgets((prevSelected) =>
      Object.fromEntries(
        Object.entries(prevSelected).filter(([id]) => !checkedRightIds.includes(Number(id.replace('right_', '')))),
      ),
    ); // 선택 아이템 동기화
  };

  const handleConfirm = async () => {
    const targetItemIdsToHide = leftWidgets.filter((leftwidget) => leftwidget.isHidden).map((leftId) => leftId.id);
    const targetItemIdsToShow = rightWidgets.map((rightWidget) => rightWidget.id);

    const { result } = await mutateAsync({
      data: {
        itemOwnerProfileId: parseInt(PROFILE_ID, 10), // 임시 설정
        targetItemIdsToHide,
        targetItemIdsToShow,
      },
    });
    if (result) {
      onCancel?.('refetch');
    }
  };

  // x 버튼 시 onClick 이벤트
  const handleDeleteWidget = (id: number) => {
    setRightWidgets((prev) => prev.filter((w) => w.id !== id));
    setLeftWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, isHidden: true } : w)));
    setSelectedWidgets((prev) => {
      const updated = { ...prev };
      delete updated[`right_${id}`]; // 오른쪽 리스트의 선택 상태 해제
      delete updated[id]; // 왼쪽 리스트의 선택 상태 해제
      return updated;
    });
  };

  return (
    <ModalBase
      isOpen={isOpen}
      className="modal-widget"
      message="위젯관리"
      size="medium"
      cancelText="취소"
      confirmText="저장"
      onCancel={() => {
        onCancel?.();
        onClose();
      }}
      onConfirm={() => {
        handleConfirm();

        onClose();
      }}
    >
      <div className="inner-category">
        <div className="group-category">
          <div className="head-category">
            <strong className="tit-category">전체 리스트</strong>
            <div className="btn-group">
              <Button size="small" color="line" onClick={() => toggleSelectAll(true)}>
                전체 선택
              </Button>
              <Button size="small" color="line" onClick={() => toggleSelectAll(false)}>
                전체선택 취소
              </Button>
            </div>
          </div>
          <div className="box-category">
            <ul className="list-category">
              {leftWidgets.map((widget) => {
                return (
                  <Checkbox
                    key={widget.id.toString()}
                    name={widget.name}
                    id={widget.id.toString()}
                    label={widget.name}
                    onChange={() => handleToggle(widget.id)}
                    checked={!!selectedWidgets[widget.id]}
                    disabled={!widget.isHidden}
                  />
                );
              })}
            </ul>
          </div>
        </div>
        <Button size="small" color="line" icon="plus-g" onClick={addWidgets}>
          추가
        </Button>
        <div className="group-category">
          <div className="head-category">
            <strong className="tit-category">사용 리스트</strong>
            <div className="btn-group">
              <Button size="small" color="line" onClick={removeCheckedWidgets}>
                선택 삭제
              </Button>
            </div>
          </div>
          <div className="box-category box-category-edit">
            <DndProvider backend={HTML5Backend}>
              <ul className="list-category">
                {rightWidgets.map((widget, index) => {
                  return (
                    <SortItem
                      key={`right_${widget.id}`}
                      widget={widget}
                      index={index}
                      selectedWidgets={selectedWidgets}
                      onChange={handleToggle}
                      reorderWidgets={reorderWidgets}
                      onDelete={handleDeleteWidget}
                    />
                  );
                })}
              </ul>
            </DndProvider>
          </div>
        </div>
      </div>
    </ModalBase>
  );
};

export default WidgetModal;
