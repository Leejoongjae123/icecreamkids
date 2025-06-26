import {
  StoryBoardAddRequest,
  StoryBoardContentForAddContentType,
  StoryBoardContentPhotoForAdd,
  StoryBoardContentPhotoResult,
  StoryBoardResult,
  StoryBoardUpdateRequest,
} from '@/service/file/schemas';
import React from 'react';
import { FieldValues, UseFormReturn, UseFormWatch } from 'react-hook-form';

export interface IBlockData {
  contentOrder?: number;
  id?: number;
  storyBoardContentId?: number;
  contentType: StoryBoardContentForAddContentType;
  title?: string;
  contents?: string;
  images?: StoryBoardContentPhotoForAdd[] | StoryBoardContentPhotoResult[];
  imageFiles?: (File | undefined)[];
}

export interface IStoryBoardForm<T extends FieldValues> {
  isPost?: boolean;
  isEdit?: boolean;
  blocks: IBlockData[];
  data?: StoryBoardResult;
  setBlocks: React.Dispatch<React.SetStateAction<IBlockData[]>>;
  form: any;
  onSubmit: () => Promise<void>;
  footer?: React.ReactNode;
  previewMode?: boolean; // 상세보기 모드 타입
}

export interface IStoryType {
  value: StoryBoardContentForAddContentType;
  name: string;
  component?: () => React.ReactNode;
}
