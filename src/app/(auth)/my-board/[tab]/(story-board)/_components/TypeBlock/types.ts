import { IBlockData } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm/types';
// import { StoryBoardAddRequest } from '@/service/file/schemas';
// import { Control } from 'react-hook-form';

export interface ITypeBlock {
    data: IBlockData;
    onChange: (newData: Partial<IBlockData>) => void;
    control: any;
    isEdit?: boolean;
    setIsModalOpen?: (state: boolean) => void;
    previewMode?: boolean; // 상세보기 모드 타입
}