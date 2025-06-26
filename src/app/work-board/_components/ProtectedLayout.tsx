import { AuthRequired } from './AuthRequired';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthRequired
      fallback={
        <div>
          <h1>권한이 없습니다.</h1>
          <p>이 내용을 보기위해서는 로그인을 하시기 바랍니다.</p>
        </div>
      }
    >
      {children}
    </AuthRequired>
  );
}
