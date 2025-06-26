import { IPostFile } from '@/hooks/useS3FileUpload';
import {
  FileObjectResult,
  SmartFolderItemResult,
  StudentRecordAttachedPhotoForAdd,
  StudentRecordAttachedPhotoForUpdate,
} from '@/service/file/schemas';
import { IRegisteredImage } from '../_component/type';

export const getAttachedPhotos = async (
  attachedPhotos: IRegisteredImage[],
  postFile: ({
    file,
    fileType,
    taskType,
    source,
    thumbFile,
    thumbObjectId,
  }: IPostFile) => Promise<SmartFolderItemResult | FileObjectResult[] | null>,
): Promise<StudentRecordAttachedPhotoForAdd[] | StudentRecordAttachedPhotoForUpdate[]> => {
  return Promise.all(
    attachedPhotos.map(async (item: IRegisteredImage, index: number) => {
      const { id, isRepresent, originalFile, type } = item;

      const studentRecordAttachedPhotoId = type === 'ATTACHED' ? (id ?? null) : null;
      let photoId = item.photoDriveItemId ?? -1;
      if (originalFile) {
        const imageResult = (await postFile({
          file: originalFile,
          fileType: 'IMAGE',
          taskType: 'STUDENT_RECORD',
          source: 'FILE',
          thumbFile: originalFile,
        })) as unknown as SmartFolderItemResult;
        photoId = imageResult.id;
      }
      return {
        studentRecordAttachedPhotoId,
        sortOrder: index,
        photoDriveItemId: photoId,
        isRepresent: isRepresent ?? false,
      };
    }),
  );
};
