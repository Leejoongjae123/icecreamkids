export default function getValidateFileTypes(files: any[] | File[], allowedTypes: string[]): boolean {
  return files.every((file) => {
    // 파일확장자를 가져오는 로직
    const fileType = file instanceof File ? `.${file.name.split('.').pop()}` : file.type;
    if (!fileType) {
      // 파일에 확장자가 없다면 false를 반환합니다.
      return false;
    }
    return allowedTypes.includes(fileType);
  });
}
