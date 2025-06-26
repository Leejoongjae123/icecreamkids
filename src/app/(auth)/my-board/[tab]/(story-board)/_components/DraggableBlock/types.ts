import { IBlockData } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm/types';
import { UseFormReturn } from 'react-hook-form';
import { StoryBoardAddRequest, StoryBoardUpdateRequest } from '@/service/file/schemas';
import React from 'react';

export interface IDraggableBlock {
    blockRef: React.RefObject<HTMLDivElement>;
    block: IBlockData;
    blockLength: number;
    index: number;
    moveBlock: (dragIndex: number, hoverIndex: number) => void;
    updateBlockData: (index: number, newData: Partial<IBlockData>) => void;
    removeBlock: (index: number) => void;
    isEdit: boolean;
    form: UseFormReturn<StoryBoardAddRequest, any, undefined> | UseFormReturn<StoryBoardUpdateRequest, any, undefined>;
    previewMode?: boolean; // 상세보기 모드 타입
}