import { useAlertStore } from '@/hooks/store/useAlertStore';

// 윈도우 금지 문자
const INVALID_FILENAME_REGEX = /[\\/:*?"<>|]/;

// 이모지 (u 플래그 없이)
const EMOJI_REGEX = /[\uD83C][\uDF00-\uDFFF]|[\uD83D][\uDC00-\uDEFF]/;

/**
 * 파일명 유효성 검사 훅
 * @returns 파일명 검사 함수: 유효하지 않으면 alert 띄우고 true 반환
 */
export function useValidateFileName() {
  const { showAlert } = useAlertStore();

  /**
   * @param name 검사할 파일명
   * @returns true: 유효하지 않음 / false: 유효함
   */
  return (name: string, onConfirm?: () => void): boolean => {
    const rawName = name.normalize('NFC');
    const hasInvalidChars = INVALID_FILENAME_REGEX.test(rawName);
    const hasEmoji = EMOJI_REGEX.test(rawName);

    const isInvalid = hasInvalidChars || hasEmoji || rawName.startsWith('.') || rawName.endsWith('.');

    if (isInvalid) {
      showAlert({
        message:
          '파일명에 사용할 수 없는 문자가 포함되어 있습니다.<br/>허용되지 않는 문자: \\ / : * ? " < > | 및 이모지<br/>또는 파일명이 "."으로 시작/끝날 수 없습니다.',
        onConfirm: () => onConfirm?.(),
      });
      return true;
    }

    return false;
  };
}
