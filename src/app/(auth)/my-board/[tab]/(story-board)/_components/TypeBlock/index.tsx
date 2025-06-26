import React, { useState } from 'react';
import ImageUploader from '@/app/(auth)/my-board/[tab]/(story-board)/_components/ImageUploader';
import ContentRender from '@/app/(auth)/my-board/[tab]/(story-board)/_components/ContentRender';
import { ITypeBlock } from './types';

const TypeBlock: React.FC<ITypeBlock> = ({
                                             data,
                                             onChange,
                                             control,
                                             isEdit,
                                             setIsModalOpen,
                                             previewMode = false,
                                         }: ITypeBlock) => {
    const contentProps = { data, onChange, control, isEdit };
    const imageProps = { data, onChange, isEdit };

    // 각 ImageUploader의 모달 상태를 관리
    const [modalStates, setModalStates] = useState([false, false, false]);

    const handleOpenModal = (index: number) => {
        const newModalStates = [...modalStates];
        newModalStates[index] = true;
        setModalStates(newModalStates);
        if (setIsModalOpen) {
            setIsModalOpen(true);
        } // 모달 열리면 부모로 상태 전달
    };

    const handleCloseModal = (index: number) => {
        const newModalStates = [...modalStates];
        newModalStates[index] = false;
        setModalStates(newModalStates);
        if (setIsModalOpen) {
            setIsModalOpen(false);
        } // 모달 닫히면 부모로 상태 전달
    };

    switch (data.contentType) {
        case 'TYPE_A':
            return <ContentRender {...contentProps} />;
        case 'TYPE_B':
            return (
                <ImageUploader
                    {...imageProps}
                    index={0}
                    onOpenModal={() => handleOpenModal(0)}
                    onCloseModal={() => handleCloseModal(0)}
                    isUploadModalOpen={modalStates[0]}
                    previewMode={previewMode}
                />
            );
        case 'TYPE_C':
            return (
                <>
                    <ImageUploader
                        {...imageProps}
                        index={0}
                        onOpenModal={() => handleOpenModal(0)}
                        onCloseModal={() => handleCloseModal(0)}
                        isUploadModalOpen={modalStates[0]}
                        previewMode={previewMode}
                    />
                    <ImageUploader
                        {...imageProps}
                        index={1}
                        onOpenModal={() => handleOpenModal(1)}
                        onCloseModal={() => handleCloseModal(1)}
                        isUploadModalOpen={modalStates[1]}
                        previewMode={previewMode}
                    />
                </>
            );
        case 'TYPE_D':
            return (
                <>
                    <ImageUploader
                        {...imageProps}
                        index={0}
                        onOpenModal={() => handleOpenModal(0)}
                        onCloseModal={() => handleCloseModal(0)}
                        isUploadModalOpen={modalStates[0]}
                        previewMode={previewMode}
                    />
                    <ImageUploader
                        {...imageProps}
                        index={1}
                        onOpenModal={() => handleOpenModal(1)}
                        onCloseModal={() => handleCloseModal(1)}
                        isUploadModalOpen={modalStates[1]}
                        previewMode={previewMode}
                    />
                    <ImageUploader
                        {...imageProps}
                        index={2}
                        onOpenModal={() => handleOpenModal(2)}
                        onCloseModal={() => handleCloseModal(2)}
                        isUploadModalOpen={modalStates[2]}
                        previewMode={previewMode}
                    />
                </>
            );
        case 'TYPE_E':
            return (
                <>
                    <ImageUploader
                        {...imageProps}
                        index={0}
                        onOpenModal={() => handleOpenModal(0)}
                        onCloseModal={() => handleCloseModal(0)}
                        isUploadModalOpen={modalStates[0]}
                        previewMode={previewMode}
                    />
                    <ContentRender {...contentProps} />
                </>
            );
        case 'TYPE_F':
            return (
                <>
                    <ContentRender {...contentProps} />
                    <ImageUploader
                        {...imageProps}
                        index={0}
                        onOpenModal={() => handleOpenModal(0)}
                        onCloseModal={() => handleCloseModal(0)}
                        isUploadModalOpen={modalStates[0]}
                        previewMode={previewMode}
                    />
                </>
            );
        default:
            return null;
    }
};

export default TypeBlock;