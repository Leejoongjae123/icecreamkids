/**
 * 허용할 파일 확장자 리스트를 받아 MIME Type으로 변환
 * @param allowedTypes 허용할 파일 확장자 리스트
 * @example getAcceptedMIMEType(['jpg', 'png', 'gif'])
 * @returns '.jpg,.png,.gif'
 */
export default function getAcceptedMIMEType(allowedTypes: string[] | string): string {
  if (Array.isArray(allowedTypes)) {
    return allowedTypes.map((type) => `.${type}`).join(',');
  }

  return `${allowedTypes}`;
}
