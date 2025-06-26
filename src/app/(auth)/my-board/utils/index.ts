import { IBlockData } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm/types';
import { IPostFile } from '@/hooks/useS3FileUpload';
import {
  FileObjectResult,
  SmartFolderItemResult,
  StoryBoardContentForAdd,
  StoryBoardContentForAddContentType,
  StoryBoardContentForUpdate,
  StoryBoardContentPhotoForAdd,
  StoryBoardContentPhotoResult,
  StoryBoardContentResult,
  StoryBoardResult,
} from '@/service/file/schemas';
import { getBypassCorsUrl } from '@/utils';
import { useValidateFileName } from '@/hooks/useValidateFileName';

const getMyBoardType = (typeIdx: number) => {
  switch (typeIdx) {
    case 0:
      return 'PLAY_PHOTO';
    case 1:
      return 'LECTURE_PLAN';
    case 2:
      return 'STORY_BOARD';
    default:
      return 'PLAY_PHOTO';
  }
};

const getDefaultImageData = (index?: number) => {
  return {
    order: index ?? 0,
    driveItemIdOrKey: '',
    width: 0,
    height: 0,
    positionX: 0,
    positionY: 0,
  };
};

const createImages = (contentType: StoryBoardContentForAddContentType) => {
  if (['TYPE_B', 'TYPE_E', 'TYPE_F'].includes(contentType)) {
    return [getDefaultImageData(0)];
  }
  if (contentType === 'TYPE_C') {
    return [getDefaultImageData(0), getDefaultImageData(1)];
  }
  if (contentType === 'TYPE_D') {
    return [getDefaultImageData(0), getDefaultImageData(1), getDefaultImageData(2)];
  }
  return [];
};

const createImageFiles = (contentType: StoryBoardContentForAddContentType) => {
  if (['TYPE_B', 'TYPE_E', 'TYPE_F'].includes(contentType)) {
    return [undefined];
  }
  if (contentType === 'TYPE_C') {
    return [undefined, undefined];
  }
  if (contentType === 'TYPE_D') {
    return [undefined, undefined, undefined];
  }
  return [];
};

const getStoryBoardInitBlocks = (storyBoard?: StoryBoardResult): IBlockData[] => {
  if (!storyBoard) {
    return [{ id: Date.now(), contentType: 'TYPE_A', title: '', contents: '', images: [], imageFiles: [] }];
  }

  return storyBoard?.contents
    ? storyBoard.contents.map((block: StoryBoardContentResult, index: number) => {
        const blockImages =
          block.attachedPhotos?.length === 0
            ? createImages(block.contentType)
            : block.attachedPhotos?.map(({ id: imgId, driveItemKey, ...item }) => {
                return {
                  ...item,
                  contentId: block.id,
                  photoUrl: getBypassCorsUrl(item.photoUrl),
                  driveItemIdOrKey: driveItemKey,
                };
              });

        const blockImageFiles =
          block.attachedPhotos?.length === 0
            ? createImageFiles(block.contentType)
            : block.attachedPhotos?.map(() => undefined);

        return {
          id: block.id,
          storyBoardContentId: block.id,
          contentType: block.contentType,
          contentOrder: index,
          title: block.title,
          contents: block.contents,
          images: blockImages,
          imageFiles: blockImageFiles,
        };
      })
    : [
        {
          id: Date.now(),
          contentOrder: 0,
          contentType: 'TYPE_A',
          title: '',
          contents: '',
          images: [],
          imageFiles: [],
        },
      ];
};

const getStoryBoardContents = async (
  blocks: IBlockData[],
  postFile: ({
    file,
    fileType,
    taskType,
    source,
    thumbFile,
    thumbObjectId,
  }: IPostFile) => Promise<SmartFolderItemResult | FileObjectResult[] | null>,
): Promise<StoryBoardContentForAdd[] | StoryBoardContentForUpdate[]> => {
  return Promise.all(
    blocks
      .filter((block) => !!block.id)
      .map(async (item: IBlockData, index: number) => {
        const { images, storyBoardContentId, id, imageFiles, ...restItem } = item;

        // 각 항목의 내용을 반환
        return {
          ...restItem,
          storyBoardContentId,
          title: item.title ?? undefined,
          contentOrder: index,
          attachedPhotos: await Promise.all(
            (images as (StoryBoardContentPhotoResult & { driveItemIdOrKey: string })[]).map(
              async (img: StoryBoardContentPhotoResult & { driveItemIdOrKey: string }, idx: number) => {
                if (imageFiles && imageFiles[idx]) {
                  const imageResult = (await postFile({
                    file: imageFiles[idx],
                    fileType: 'IMAGE',
                    taskType: 'STORY_BOARD',
                    source: 'FILE',
                    thumbFile: imageFiles[idx],
                  })) as SmartFolderItemResult;

                  return {
                    ...img, // 이미지의 기존 속성 유지하고 driveItemIdOrKey 업데이트
                    storyBoardContentPhotoId: img.id,
                    driveItemIdOrKey: imageResult.driveItemKey,
                  };
                }

                return {
                  ...img, // 이미지의 기존 속성 유지
                  storyBoardContentPhotoId: img.id,
                };
              },
            ),
          ),
        };
      }),
  );
};

const findBlockWithoutTitle = (blocks: IBlockData[]): boolean => {
  return blocks.some((block) => {
    return ['TYPE_A', 'TYPE_E', 'TYPE_F'].includes(block.contentType) && block.title === '';
  });
};

const findBlockWithoutContents = (blocks: IBlockData[]): boolean => {
  return blocks.some((block) => {
    return ['TYPE_A', 'TYPE_E', 'TYPE_F'].includes(block.contentType) && !block.contents;
  });
};

const findBlockWithDefaultImage = (blocks: IBlockData[]): IBlockData | undefined => {
  return blocks.find((block) => {
    return block.images?.some((image: StoryBoardContentPhotoForAdd | StoryBoardContentPhotoResult, idx: number) => {
      const isDefaultImage = JSON.stringify(image) === JSON.stringify(getDefaultImageData(idx));
      const isFileUpload = !!block.imageFiles?.[idx];
      return !isFileUpload && isDefaultImage;
    });
  });
};

const isValidateStoryBoard = ({
  title,
  blocks,
}: {
  title?: string | undefined;
  blocks: IBlockData[];
}): { isValidate: boolean; message?: string } => {
  if (!title) {
    return { isValidate: false, message: '제목을 입력 해주세요.' };
  }
  if (!title) {
    return { isValidate: false, message: '제목을 입력 해주세요.' };
  }
  if (!blocks || blocks.length <= 0) {
    return { isValidate: false, message: '스토리 보드를 작성 해주세요.' };
  }
  if (findBlockWithoutTitle(blocks)) {
    return { isValidate: false, message: '제목을 입력 해주세요.' };
  }
  if (findBlockWithoutContents(blocks)) {
    return { isValidate: false, message: '내용을 입력 해주세요.' };
  }
  if (findBlockWithDefaultImage(blocks)) {
    return { isValidate: false, message: '이미지를 업로드 해주세요.' };
  }
  return { isValidate: true };
};

export {
  getMyBoardType,
  getDefaultImageData,
  createImages,
  createImageFiles,
  getStoryBoardInitBlocks,
  getStoryBoardContents,
  findBlockWithoutTitle,
  findBlockWithoutContents,
  findBlockWithDefaultImage,
  isValidateStoryBoard,
};
