import { useState, useRef, ChangeEvent, RefObject, useEffect, useCallback } from 'react';
import { ReactCropperElement } from 'react-cropper';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import { FileObjectResult } from '@/service/file/schemas';
import { PREFIX_THUMB } from '@/const';
import { getBypassCorsUrl } from '@/utils';

export interface IImageEditorResult {
  image: string;
  handleRotate: () => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleZoomIn: () => void;
  cropperRef: RefObject<ReactCropperElement>;
  getCroppedImage: () => string | null;
  getCroppedS3Image: () => Promise<string | null>;
  getCroppedImageFile: () => Promise<File | null>;
  getCroppedImageData: () => { positionX: number; positionY: number; width: number; height: number };
  handleZoomOut: () => void;
  setImage: (value: ((prevState: string) => string) | string) => void;
  isUploadImage: boolean;
}

export const useImageEditor = (initialImage: string): IImageEditorResult => {
  const [image, setImage] = useState<string>(initialImage);
  const [isUploadImage, setIsUploadImage] = useState<boolean>(false);
  const cropperRef = useRef<ReactCropperElement>(null);
  const { postFile } = useS3FileUpload();

  // CORS 우회
  const handleCorsImage = useCallback(async (): Promise<void> => {
    if (initialImage.includes(process.env.NEXT_PUBLIC_S3_URL!)) return;
    setImage(getBypassCorsUrl(image));
  }, [image, initialImage]);

  useEffect(() => {
    if (initialImage.startsWith('http')) {
      handleCorsImage();
    }
  }, [handleCorsImage, initialImage]);

  // 이미지 업로드 처리
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 확대
  const handleZoomIn = () => {
    if (cropperRef.current) {
      cropperRef.current.cropper.zoom(0.1);
    }
  };

  // 축소
  const handleZoomOut = () => {
    if (cropperRef.current) {
      cropperRef.current.cropper.zoom(-0.1);
    }
  };

  // 회전
  const handleRotate = () => {
    if (cropperRef.current) {
      cropperRef.current.cropper.rotate(90);
    }
  };

  // 이미지를 자르고 File로 반환
  const getCroppedImageFile = async (): Promise<File | null> => {
    if (cropperRef.current && cropperRef.current.cropper) {
      return new Promise<File | null>((resolve) => {
        cropperRef.current?.cropper.getCroppedCanvas().toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], 'cropped-image.jpg', { type: blob.type });
              resolve(file);
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          0.9,
        );
      });
    }
    return null;
  };

  // 이미지를 자르고 Blob URL로 반환
  const getCroppedImage = () => {
    if (cropperRef.current) {
      return cropperRef.current.cropper.getCroppedCanvas()?.toDataURL();
    }
    return null;
  };

  // 이미지를 자르고 S3 URL로 반환
  const getCroppedS3Image = async () => {
    const croppedFile: File | null = await getCroppedImageFile();
    if (!croppedFile) return null;
    const result = await postFile({
      file: croppedFile,
      fileType: 'IMAGE',
      taskType: 'ETC',
      source: 'THUMBNAIL',
    });
    return result ? `${PREFIX_THUMB}${(result as FileObjectResult[])[0]?.key}` : '/images/profile.png';
  };

  const getCroppedImageData = useCallback(() => {
    if (cropperRef.current) {
      const imageData = cropperRef.current.cropper.getCanvasData();
      return {
        positionX: imageData.left,
        positionY: imageData.top,
        width: imageData.width,
        height: imageData.height,
      };
    }
    return {
      positionX: 0,
      positionY: 0,
      width: 0,
      height: 0,
    };
  }, []);

  // 이미지 업로드 여부
  useEffect(() => {
    setIsUploadImage(image !== '/images/profile.png');
  }, [image]);

  return {
    image,
    setImage,
    cropperRef,
    handleImageUpload,
    handleZoomIn,
    handleZoomOut,
    handleRotate,
    getCroppedImage,
    getCroppedS3Image,
    getCroppedImageFile,
    getCroppedImageData,
    isUploadImage,
  };
};
