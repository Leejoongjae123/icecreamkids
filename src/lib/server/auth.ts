import { cookies } from 'next/headers';
import { decryptData } from '@/utils';

/**
 * 서버 전용: 현재 유저 확인
 * @param value 값
 * @param other 다른 값
 * @returns
 */
export function getCurrentUser() {
  const encrypted = cookies().get('userInfo')?.value;

  if (!encrypted) return null;

  try {
    const decoded = decodeURIComponent(encrypted);
    const user = decryptData(decoded); // ✅ 복호화 → user 객체

    return user; // 예: { id: 123, username: "홍길동" }
  } catch (err) {
    console.error('쿠키 복호화 실패:', err);
    return null;
  }
}
