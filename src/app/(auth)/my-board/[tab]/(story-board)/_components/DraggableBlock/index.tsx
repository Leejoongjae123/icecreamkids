import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IBlockData } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm/types';
import { useDrag, useDrop } from 'react-dnd';
import { Button } from '@/components/common';
import TypeBlock from '@/app/(auth)/my-board/[tab]/(story-board)/_components/TypeBlock';
import { IDraggableBlock } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/DraggableBlock/types';
import { STORY_TYPE_LIST } from '@/const/storyBoard';
import { IStoryBoardType } from '@/app/(auth)/my-board/[tab]/(story-board)/types';
import cx from 'clsx';

export const DraggableBlock: React.FC<IDraggableBlock> = ({
                                                              blockRef,
                                                              block,
                                                              blockLength,
                                                              index,
                                                              moveBlock,
                                                              updateBlockData,
                                                              removeBlock,
                                                              isEdit,
                                                              form,
                                                              previewMode = false,
                                                          }) => {
    const [isDragEnabled, setIsDragEnabled] = useState(true);
    const [isUploadModalOpen, setIsModalOpen] = useState(false);
    const [canDragFromInner, setCanDragFromInner] = useState(true); // .inner-form 드래그 제어

    useEffect(() => {
        setIsDragEnabled(!isUploadModalOpen);
    }, [isUploadModalOpen]);

    const ref = useRef<HTMLDivElement>(null);
    const innerFormRef = useRef<HTMLDivElement>(null);

    const canDrag = useMemo(() => {
        return isEdit && isDragEnabled && canDragFromInner;
    }, [isEdit, isDragEnabled, canDragFromInner]);

    const [{ isDragging }, drag] = useDrag({
        type: 'BLOCK',
        item: { index },
        canDrag,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: 'BLOCK',
        hover(item: { index: number }) {
            if (!canDrag) return;
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            moveBlock(dragIndex, hoverIndex);
            Object.assign(item, { index: hoverIndex });
        },
    });

    useEffect(() => {
        if (canDrag) {
            drag(drop(ref));
        }
    }, [canDrag, drag, drop, isEdit]);

    // .inner-form에서 mousedown 이벤트 감지
    useEffect(() => {
        const innerForm = innerFormRef.current;
        if (!innerForm) return undefined;

        const handleMouseDown = (e: MouseEvent) => {
            if (innerForm.contains(e.target as Node)) {
                setCanDragFromInner(false); // .inner-form 내부 클릭 시 드래그 비활성화
            } else {
                setCanDragFromInner(true); // 그 외 클릭 시 드래그 활성화
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    const handleChange = (newData: Partial<IBlockData>) => {
        updateBlockData(index, newData);
    };

    const typeInfo = STORY_TYPE_LIST.find((item: IStoryBoardType) => item.value === block.contentType);
    if (!typeInfo) return null;

    return (
        <div
            ref={blockRef}
            key={block.id}
            className={cx('box-form')}
            // style={{
            //   opacity: isDragging ? 0.5 : 1,
            //   cursor: isEdit && isDragEnabled ? 'move' : 'default',
            // }}
        >
            {isEdit && (
                <div className="head-form">
                    <strong className="subtitle-type1">{typeInfo.name}</strong>
                    <div className="util-head">
                        {['TYPE_A', 'TYPE_E', 'TYPE_F'].includes(block.contentType) && (
                            <Button
                                type="button"
                                color="line"
                                size="small"
                                disabled={block.title !== undefined}
                                onClick={() => updateBlockData(index, { title: '' })}
                            >
                                제목추가
                            </Button>
                        )}
                        <Button
                            color="line"
                            size="small"
                            className="btn-up"
                            icon="snb-arrow-down-14"
                            onClick={() => moveBlock(index, index - 1)}
                            disabled={index === 0}
                        >
                            <span className="screen_out">위로 이동</span>
                        </Button>
                        <Button
                            color="line"
                            size="small"
                            className="btn-down"
                            icon="snb-arrow-down-14"
                            onClick={() => moveBlock(index, index + 1)}
                            disabled={index === blockLength - 1}
                        >
                            <span className="screen_out">아래로 이동</span>
                        </Button>
                        <Button color="line" size="small" icon="minus" className="btn-remove" onClick={() => removeBlock(index)}>
                            <span className="screen_out">삭제</span>
                        </Button>
                    </div>
                </div>
            )}
            <div
                ref={innerFormRef}
                className={cx('inner-form', { type2: ['TYPE_E', 'TYPE_F'].includes(block.contentType) })}
                style={{ alignItems: ['TYPE_E', 'TYPE_F'].includes(block.contentType) && !isEdit ? 'flex-start' : '' }}
            >
                <TypeBlock
                    data={block}
                    onChange={handleChange}
                    control={form.control}
                    isEdit={isEdit}
                    setIsModalOpen={setIsModalOpen}
                    previewMode={previewMode}
                />
            </div>
        </div>
    );
};