import { ALLOWED_ICONS, FLOATING_BUTTON_TYPE, TASK_TYPE, THUMBNAIL_MAP, YOUTUBE_URL_PATTERN } from '@/const';
import { SmartFolderItemResultFileType } from '@/service/file/schemas';
import DOMPurify from 'dompurify';
import CryptoJS from 'crypto-js';
import { TPageResponse } from '@/utils/types';
import dayjs from '@/lib/dayjs';
import { IThumbnail } from '@/components/common/Thumbnail/types';

/**
 * 두개의 값이 같은 지 확인
 * @param value 값
 * @param other 다른 값
 * @returns
 */
export const isEqual = (value: unknown, other: unknown): boolean => {
  if (value === other) {
    return true;
  }

  if (typeof value !== typeof other) {
    return false;
  }

  if (Array.isArray(value) && Array.isArray(other)) {
    if (value.length !== other.length) {
      return false;
    }
    for (let i = 0; i < value.length; i++) {
      if (!isEqual(value[i], other[i])) {
        return false;
      }
    }
    return true;
  }

  if (typeof value === 'object' && typeof other === 'object' && value !== null && other !== null) {
    const valueObj = value as Record<string, unknown>;
    const otherObj = other as Record<string, unknown>;
    const valueKeys = Object.keys(valueObj);
    const otherKeys = Object.keys(otherObj);

    if (valueKeys.length !== otherKeys.length) {
      return false;
    }

    return valueKeys.every(
      (key) => Object.prototype.hasOwnProperty.call(otherObj, key) && isEqual(valueObj[key], otherObj[key]),
    );
  }

  return value === other;
};

/**
 * 해당 값이 empty 값인지 확인
 * @param value 확인할 값
 * @returns
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
};

type DebounceOrThrottleFunction = (...args: any[]) => void;

/**
 * 디바운싱 함수
 * @param func 실행할 함수
 * @param delay 지연시간
 * @returns
 */
export const debounce = (func: DebounceOrThrottleFunction, delay: number): DebounceOrThrottleFunction => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: any[]) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
};

/**
 * 쓰로틀링 함수
 * @param func 실행할 함수
 * @param delay 지연시간
 * @returns
 */
export const throttle = (func: DebounceOrThrottleFunction, delay: number): DebounceOrThrottleFunction => {
  let timer: NodeJS.Timeout | null = null;
  return function (this: unknown, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * 이미지 파일 업로드 시 base64로 반환하여 미리보기
 * @param file 파일 객체
 * @returns
 */
export const convertImageFileToBase64 = (file: File) => {
  return new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string | null);
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 파일 url 로 다운로드 받기
 * @param url 다운로드 받을 파일 주소
 * @param fileName 파일명
 */
export const downloadToURL = (url: string, fileName: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.style.display = 'none';

  if (fileName) {
    a.download = fileName;
  }

  document.body.appendChild(a);
  a.click();
  a.remove();
};

/**
 *  Blob을 File 객체로 변환하는 함수
 * @param blob File 객체로 변환하고자 하는 blob
 * @param fileName 파일명
 * @return file
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
};

/**
 * 입력값에서 숫자가 아닌 모든 문자를 제거한 문자열을 반환
 *
 * @param {number | string} value - 처리할 입력값. 숫자 또는 문자열 가능
 * @returns {string} 숫자만 포함된 문자열을 반환
 *
 * @example
 * // 문자열에서 숫자가 아닌 문자를 제거
 * getCleaned("abc123"); // "123"
 *
 * @example
 * // 숫자를 문자열로 변환 후 반환
 * getCleaned(456); // "456"
 *
 * @example
 * // 특수 문자와 공백 제거
 * getCleaned("12-34 56!"); // "123456"
 */
export const getCleaned = (value: number | string) => {
  return `${value}`.replace(/\D/g, '');
};

/**
 * URL 또는 파일명에서 확장자를 추출
 * @param {string} filePath 파일명 또는 URL
 * @returns {string | null} 추출된 확장자
 */
export function getFileExtension(filePath: string | undefined): string | null {
  if (!filePath) return null;

  // URL 또는 경로인 경우만 쿼리스트링 제거
  const cleanPath = filePath.includes('/') ? filePath.split('?')[0] : filePath;

  const lastSegment = cleanPath.split('/').pop(); // URL이면 경로 끝
  if (!lastSegment) return null;

  const parts = lastSegment.split('.');
  if (parts.length < 2) return null; // 확장자 없음

  return parts.pop()?.toLowerCase() || null;
}

/**
 * 파일명에서 확장자 제거
 * @param {string} fileName 파일명
 * @returns {string | null} 확장자가 제거된 파일명
 */
export function removeFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length === 1) return fileName; // 확장자 없음
  return parts.slice(0, -1).join('.');
}
/**
 * 파일 타입과 확장자를 기반으로 썸네일을 반환
 * @param {string} fileName - 파일명
 * @param {SmartFolderItemResultFileType} fileType - 파일 타입
 * @returns {{type: SmartFolderItemResultFileType, extension: string, file: string}} - 파일 타입, 확장자, 썸네일
 */
export function getThumbnail(
  fileName: string,
  fileType: SmartFolderItemResultFileType,
): {
  type: SmartFolderItemResultFileType;
  extension: string | null;
  icon: (typeof ALLOWED_ICONS)[number];
} {
  const extension = getFileExtension(fileName);

  // 문서 타입(DOCUMENT)에 대한 세부 아이콘 처리
  if (fileType === SmartFolderItemResultFileType.DOCUMENT && extension) {
    if (extension.includes('pdf')) return { type: fileType, extension, icon: 'pdf' };
    if (extension.includes('hwp')) return { type: fileType, extension, icon: 'hwp' };
    if (extension.includes('ppt')) return { type: fileType, extension, icon: 'ppt' };
    if (extension.includes('xls')) return { type: fileType, extension, icon: 'xls' };
    if (extension.includes('csv')) return { type: fileType, extension, icon: 'csv' };
    if (extension.includes('doc')) return { type: fileType, extension, icon: 'doc' };
    if (extension.includes('txt')) return { type: fileType, extension, icon: 'txt' };
  }

  return {
    type: fileType,
    extension,
    icon: THUMBNAIL_MAP[fileType] || 'no-image',
  };
}

/**
 * .url 파일 내용에서 URL 추출
 * @param {string} content .url 파일의 내용
 * @returns {string | null} 추출된 URL
 */
export function extractUrlFromContent(content: string): string {
  const cleanedContent = content.replace(/\r\n/g, '\n'); // 개행 문자 통일
  const match = cleanedContent.match(/^\s*URL=(https?:\/\/[^\s]+)/m); // 앞뒤 공백 허용
  return match ? match[1] : '';
}

/**
 * YouTube 링크에서 비디오 ID 추출
 * @param {string} url YouTube URL
 * @returns {string | null} 비디오 ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_URL_PATTERN);
  return match ? match[1] : null;
}

/**
 * 문자열의 개행 문자를 `<br />` 태그로 변환한 후, XSS 방지를 위해 sanitize 처리합니다.
 * @param {string} content - 변환할 문자열
 * @returns {string} - `<br />` 변환 및 sanitize된 안전한 HTML 문자열
 */
export const sanitizeAndFormat = (content: string = '') => DOMPurify.sanitize(content?.replaceAll('\n', '<br />'));

/**
 * 숫자를 1K, 1M 등의 형식으로 변환
 * @param {number} num 포맷팅 전 숫자
 * @returns {string} 포맷팅 후 숫자
 */
export const formatCompactNumber = (num: number = 0) => {
  if (num === 0) return '0';
  const formatted = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(num);

  // 소수점이 있는 경우에만 후처리로 불필요한 0 제거
  return formatted.includes('.') ? formatted.replace(/\.?0+([KMGTB]?)/, '$1') : formatted;
};

/**
 * 파일명에서 특수문자를 제거하는 함수 (한글 허용)
 */
export const sanitizeFileName = (fileName: string) => {
  // 유니코드 정규화
  const normalized = fileName.normalize('NFC');
  return normalized.replace(/[^a-zA-Z0-9\u1100-\u11FF\uAC00-\uD7A3\u3130-\u318F._\- ]/g, '');
};

/**
 * 썸네일 유효성 체크
 */
export const validateThumbnail = (fileName: string) => {
  if (fileName.startsWith('http')) return fileName;
  return '';
};

// 🔹 안전한 암호화 키
const SECRET_KEY = 'your-32-character-secret-key';

// 🔹 암호화 함수
export const encryptData = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

// 🔹 복호화 함수
export const decryptData = (cipherText: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

/** 파일 사이즈 변환 */
export const formatFileSize = (sizeInBytes: number, defaultFixed = 2): string => {
  const maxByte = 1024;
  if (!sizeInBytes) {
    return `0 B`; // sizeInBytes가 undefined 일 경우 0 B 고정 처리
  }
  if (sizeInBytes < maxByte) {
    return `${sizeInBytes} B`; // 1KB 미만이면 바이트 그대로 표시
  }
  if (sizeInBytes < maxByte * maxByte) {
    return `${(sizeInBytes / maxByte).toFixed(defaultFixed)} KB`; // KB 변환
  }
  if (sizeInBytes < maxByte * maxByte * maxByte) {
    return `${(sizeInBytes / (maxByte * maxByte)).toFixed(defaultFixed)} MB`; // MB 변환
  }
  return `${(sizeInBytes / (maxByte * maxByte * maxByte)).toFixed(defaultFixed)} GB`; // GB 변환
};

// Canvas를 사용해 이미지 URL을 File 객체로 변환하는 함수 (개선된 버전)
export const convertImageUrlToFile = (imageUrl: string, fileName: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img: HTMLImageElement = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context 생성 실패'));
        return;
      }
      ctx.drawImage(img, 0, 0);

      // 직접 Blob 생성
      try {
        // 이미지 타입지정
        const imageType = 'image/jpg';
        const dataUrl = canvas.toDataURL(imageType);

        // dataURL에서 base64 부분만 추출
        const base64 = dataUrl.split(',')[1];
        if (!base64) {
          reject(new Error('이미지 데이터 추출 실패'));
          return;
        }

        // base64를 디코딩하여 바이너리 데이터로 변환
        const byteString = window.atob(base64);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uintArray = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
          uintArray[i] = byteString.charCodeAt(i);
        }

        // 파일 객체 생성 및 리턴
        const blob = new Blob([uintArray], { type: imageType });
        resolve(new File([blob], fileName, { type: imageType }));
      } catch (error) {
        console.error('이미지 변환 중 오류:', error);
        reject(error);
      }
    };

    img.onerror = (err) => {
      console.error('이미지 로드 오류:', err);
      reject(err);
    };

    // Next.js의 공개 디렉토리(public) 경로 사용
    img.src = imageUrl;
  });
};

/**
 * useInfiniteQuery의 pages 구조에서 데이터를 평탄화하며,
 * hasNextPage가 true일 경우 마지막 페이지의 마지막 아이템을 제거
 */
export function getFlattenedData<T>(pages: TPageResponse<T>[] | undefined): T[] {
  if (!pages) return [];
  // 마지막 페이지를 제외한 모든 페이지의 마지막 요소 제거
  const trimmedPages = pages.map((page, index) => {
    if (index < pages.length - 1) {
      const result = [...(page.result ?? [])];
      result.pop(); // 마지막 요소 제거
      return {
        ...page,
        result,
      };
    }
    return page;
  });

  const allItems = trimmedPages.flatMap((page) => page.result ?? []);

  // 마지막 페이지가 더 있을 경우 마지막 항목도 제거
  return allItems;
}

/**
 * url 유효성 검사 - http|https 로 시작하는 url 여부 확인
 * @param {string} urlPath ur
 * @returns {boolean} url 여부 - http|https로 시작되는 지 확인
 */
export const validateUrlPattern = (urlPath: string) => {
  try {
    const url = new URL(urlPath);
    if (url?.protocol) return true;
  } catch (error) {
    return false;
  }
  return false;
};

/**
 * S3 원본 URL - CORS 우회 URL 반환
 * @param {string} url
 * @returns {string} 변환된 url
 */
export const getBypassCorsUrl = (url: string) => {
  return url.replace(process.env.NEXT_PUBLIC_S3_URL!, '/s3');
};

/**
 * 주어진 항목들을 날짜별로 그룹화.
 *
 * @template T - 그룹화할 항목의 타입. 해당 항목은 반드시 `driveItemCreatedAt` 속성을 가져야 함.
 * @param {T[]} items - 그룹화할 항목들의 배열.
 * @returns {Record<string, T[]>} - 날짜를 키로 하고, 각 날짜에 해당하는 항목들을 배열로 묶은 객체.
 *
 * @example
 * const items = [
 *   { driveItemCreatedAt: '2025-04-08', someOtherProperty: 'value1' },
 *   { driveItemCreatedAt: '2025-04-08', someOtherProperty: 'value2' },
 *   { driveItemCreatedAt: '2025-04-09', someOtherProperty: 'value3' }
 * ];
 * const grouped = groupByDate(items);
 * console.log(grouped);
 * // 출력:
 * // {
 * //   '2025.04.08': [{ driveItemCreatedAt: '2025-04-08', someOtherProperty: 'value1' }, { driveItemCreatedAt: '2025-04-08', someOtherProperty: 'value2' }],
 * //   '2025.04.09': [{ driveItemCreatedAt: '2025-04-09', someOtherProperty: 'value3' }]
 * // }
 */
export const groupByDate = <T extends { driveItemCreatedAt: string }>(items: T[]): Record<string, T[]> => {
  return items.reduce(
    (acc, item) => {
      const formattedDate = dayjs(item.driveItemCreatedAt).format('YYYY.MM.DD');

      // 기존 그룹이 있으면 복사, 없으면 새 배열 생성
      const currentGroup = acc[formattedDate] ?? [];
      const updatedGroup = [...currentGroup, item];

      return {
        ...acc,
        [formattedDate]: updatedGroup,
      };
    },
    {} as Record<string, T[]>,
  );
};

/**
 * 문자열의 <br />이 있을 경우 개행 \n을 변경하는 함수
 * @param {string} content - 변환할 문자열
 * @returns {string} - <br /> tag를 개행 문자로 변경함
 */
export const replaceBrWithNewline = (content: string = '') => content.replace(/<br\s*\/?>/gi, '\n');

/**
 * neact-query status 값 확인 > 통신 완료 유무 확인
 * @param {string} status - neact-query status 값
 * @returns {boolean} - 성공, 에러일 경우 true 그 외 false
 */
export const hasReactQueryCompleted = (status: string) => ['error', 'success'].includes(status);

/**
 * 썸네일 비주얼 클래스 받아오기
 * @param {SmartFolderItemResultFileType} fileType - 해당 파일 타입
 * @returns {IThumbnail['visualClassName']} - 해당 클래스
 */

export const visualClassName = (fileType: SmartFolderItemResultFileType): IThumbnail['visualClassName'] => {
  if (fileType === 'LECTURE_PLAN') {
    return 'type-card';
  }
  if (fileType === 'STORY_BOARD') {
    return 'type-folder';
  }
  return undefined;
};

/**
 * 파일 유형, 메모 수, 소유 여부에 따라 적절한 floating button 타입을 반환합니다.
 *
 * 이미지이면서 본인 소유이고 메모가 있을 경우: `FavoriteDropdownEdit`
 * 그 외의 경우: `FavoriteDropdown`
 *
 * @param {number} memoCount - 해당 항목에 연결된 메모 개수
 * @param {SmartFolderItemResultFileType} fileType - 항목의 파일 타입 (예: IMAGE, VIDEO 등)
 * @param {boolean} isMine - 사용자가 소유한 항목인지 여부
 * @returns {FLOATING_BUTTON_TYPE} 적절한 floating 버튼 타입
 */
export const floatingType = ({
  memoCount,
  fileType,
  isMine,
}: {
  memoCount: number;
  fileType: SmartFolderItemResultFileType;
  isMine: boolean;
}) => {
  if (fileType === 'IMAGE' && isMine && memoCount > 0) {
    return FLOATING_BUTTON_TYPE.FavoriteDropdownEdit;
  }
  return FLOATING_BUTTON_TYPE.FavoriteDropdown;
};

export const isRecommendTaskType = (taskType: string): (typeof TASK_TYPE)[keyof typeof TASK_TYPE] => {
  return taskType && taskType in TASK_TYPE ? TASK_TYPE[taskType as keyof typeof TASK_TYPE] : TASK_TYPE.ETC;
};
