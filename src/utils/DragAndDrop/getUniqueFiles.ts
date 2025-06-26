/**
 * * 새로운 파일 목록과 기존 파일 목록을 비교하여 새로운 파일 목록에만 있는 파일들을 반환하는 함수
 * ! (file이 어떤 타입이든) 비교를 위해 id는 반드시 가지고 있어야 함.
 * @param newFiles 새로운 파일 목록
 * @param existingFiles 기존 파일 목록
 * @returns 새로운 파일 목록에만 있는 파일들
 */

type File = {
  id: number;
};

export default function getUniqueFiles(newFiles: File[], existingFiles: File[]) {
  const existingFileIds = new Set(existingFiles.map((file) => file.id));
  return newFiles.filter((newFile) => !existingFileIds.has(newFile.id));
}
