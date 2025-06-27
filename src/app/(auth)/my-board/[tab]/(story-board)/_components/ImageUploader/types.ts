import { ITypeBlock } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/TypeBlock/types';

export interface IImageUploader extends ITypeBlock {
    index: number;
    onOpenModal: () => void;
    onCloseModal: () => void;
    isUploadModalOpen: boolean;
}
