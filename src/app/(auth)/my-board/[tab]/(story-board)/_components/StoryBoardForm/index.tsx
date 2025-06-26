'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, FormField, Input, Loader } from '@/components/common';
import {
  IBlockData,
  IStoryBoardForm,
  IStoryType,
} from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm/types';
import {
  StoryBoardAddRequest,
  StoryBoardContentForAddContentType,
  StoryBoardUpdateRequest,
} from '@/service/file/schemas';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableBlock } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/DraggableBlock';
import { STORY_TYPE_LIST } from '@/const/storyBoard';
import Image from 'next/image';
import cx from 'clsx';
import { createImageFiles, createImages } from '@/app/(auth)/my-board/utils';
import { useLoadingState } from '@/hooks/useLoadingState';
import useImagesLoaded from '@/hooks/useImamgesLoaded';
import { usePathname } from 'next/navigation';

const StoryBoardForm = <T extends StoryBoardAddRequest | StoryBoardUpdateRequest>({
  isPost = false,
  data,
  isEdit,
  form,
  blocks,
  setBlocks,
  onSubmit,
  footer,
  previewMode,
}: IStoryBoardForm<T>) => {
  /* 로딩 */
  const [imageLoading, setImageLoading] = useState<boolean>(!isPost);

  const loadingStates = useMemo(
    () => [
      {
        isLoading: imageLoading,
        name: '로딩',
        message: '로딩 중입니다.',
        priority: 0,
      },
    ],
    [imageLoading],
  );
  const { isLoading, message: loadingMessage } = useLoadingState(loadingStates);

  const allImagesLoaded = useImagesLoaded({ containerId: 'story-board', watchTrigger: isPost ? null : data });

  const didReportArrive = useRef(false);

  const currentPath = usePathname();

  useEffect(() => {
    if (isPost) return;
    if (!data) {
      setImageLoading(true);
      didReportArrive.current = false;
      return;
    }

    if (data && blocks?.map((item: IBlockData) => item.images)?.flat()?.length === 0) {
      setImageLoading(false);
      return;
    }

    if (!didReportArrive.current) {
      // watchTrigger 가 true 된 직후 한 번만 무시
      didReportArrive.current = true;
      return;
    }

    setImageLoading(!allImagesLoaded);
  }, [allImagesLoaded, blocks, blocks.length, data, isPost]);

  // 스토리 보드 수정의 경우, 초기 블록 설정
  useEffect(() => {
    setBlocks(blocks);
  }, [blocks, setBlocks]);

  // 특정 블록의 데이터를 업데이트.
  const updateBlockData = (index: number, newData: Partial<IBlockData>) => {
    setBlocks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...newData };
      return updated;
    });
  };

  // 새로운 블록 추가.
  const addBlock = (contentType: StoryBoardContentForAddContentType) => {
    const newBlock: IBlockData = {
      id: Date.now(),
      contentType,
      title: '',
      contents: '',
      images: createImages(contentType),
      imageFiles: createImageFiles(contentType),
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  // 블록 삭제.
  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  // 블록 순서 변경.
  const [movedIndex, setMovedIndex] = useState<number | null>(null);
  const blockRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);

  const moveBlock = (fromIndex: number, toIndex: number) => {
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      const [draggedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, draggedBlock);
      return newBlocks;
    });
    setMovedIndex(toIndex);
  };

  // blocks 길이가 바뀔 때마다 ref 배열도 재생성
  useEffect(() => {
    blockRefs.current = blocks.map((_, i) => blockRefs.current[i] || React.createRef());
  }, [blocks]);

  useEffect(() => {
    if (movedIndex !== null) {
      const node = blockRefs.current[movedIndex]?.current;
      if (node) {
        node.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
      setMovedIndex(null);
    }
  }, [movedIndex]);

  return (
    <div id="story-board" className={cx('group-writing story-board-form', { 'type-saved': !isEdit })}>
      <DndProvider backend={HTML5Backend}>
        <Form form={form} onSubmit={onSubmit}>
          <fieldset>
            <div className="box-form form-title">
              <div className="inner-form">
                <div className="item-form">
                  {isEdit ? (
                    <>
                      <div className="head-form">
                        <strong className="subtitle-type1">제목</strong>
                      </div>
                      <div className="wrap-form">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <Input {...field} id="title" maxLength={20} placeholder="제목을 입력하세요." />
                          )}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="wrap-form">
                      <strong className="title-type3 align-center">{data?.title}</strong>
                    </div>
                  )}
                  {/* <div className="wrap-form"> */}
                  {/*  <strong className="subtitle-type2">{data?.subTitle}</strong> */}
                  {/* </div> */}
                </div>
              </div>
            </div>
            {blocks.map((block, index) => (
              <DraggableBlock
                key={block.id}
                block={block}
                blockRef={blockRefs.current[index]}
                blockLength={blocks?.length}
                index={index}
                moveBlock={moveBlock}
                updateBlockData={updateBlockData}
                removeBlock={removeBlock}
                isEdit={isEdit ?? true}
                form={form}
                previewMode={previewMode}
              />
            ))}
            {isEdit && (
              <>
                <div className="group-template">
                  <strong className="screen_out">스토리보드 타입</strong>
                  <ul className="list-template">
                    {STORY_TYPE_LIST.map((type: IStoryType) => (
                      <li key={type.value}>
                        <button
                          type="button"
                          className="btn-template"
                          onClick={() => {
                            addBlock(type.value);
                          }}
                        >
                          <strong className="tit-template">{type.name}</strong>
                          <Image
                            style={{ height: '100%' }}
                            src={`/images/thumb_template${type.value.split('_')[1]}.svg`}
                            alt={type.name}
                            className="img-g"
                            width={137}
                            height={86}
                          />
                          <span className="ico-comm ico-plus-22">추가하기</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                {footer && footer}
              </>
            )}
          </fieldset>
        </Form>
      </DndProvider>
      {/* {isLoading && currentPath.includes('preview') && ( */}
      {/*  <Loader */}
      {/*    isAbsolute */}
      {/*    hasOverlay */}
      {/*    scrollContainerSelector={currentPath.includes('preview') ? '#story-board' : null} */}
      {/*    loadingMessage={loadingMessage} */}
      {/*  /> */}
      {/* )} */}
    </div>
  );
};

export default StoryBoardForm;
