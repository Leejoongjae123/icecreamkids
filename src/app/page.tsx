'use client';

import { cn, buttonVariants, sizeVariants, cardVariants } from '@/utils/tailwind';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-primary-800 mb-4 leading-tight">
            Welcome to <span className="text-primary-600">Ice Cream Kids</span>
          </h1>
          <p className="text-xl text-secondary-600 mb-2">
            Tailwind CSS가 성공적으로 설정되었습니다! 🎉
          </p>
          <p className="text-secondary-500">
            이제 Tailwind CSS의 모든 기능을 사용할 수 있습니다.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center mb-8">
          <button 
            className={cn(
              buttonVariants.primary,
              sizeVariants.lg,
              'rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl'
            )}
          >
            시작하기
          </button>
          <button 
            className={cn(
              buttonVariants.outline,
              sizeVariants.lg,
              'bg-white hover:bg-primary-50 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl'
            )}
          >
            더 알아보기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className={cn(cardVariants.elevated, 'p-6')}>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-primary-600 text-2xl">🎨</span>
            </div>
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">커스텀 색상</h3>
            <p className="text-secondary-600 text-sm">
              프로젝트에 맞는 커스텀 색상 팔레트가 설정되었습니다.
            </p>
          </div>

          <div className={cn(cardVariants.elevated, 'p-6')}>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-primary-600 text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">빠른 개발</h3>
            <p className="text-secondary-600 text-sm">
              Tailwind CSS로 빠르고 효율적인 스타일링이 가능합니다.
            </p>
          </div>

          <div className={cn(cardVariants.elevated, 'p-6')}>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-primary-600 text-2xl">📱</span>
            </div>
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">반응형 디자인</h3>
            <p className="text-secondary-600 text-sm">
              모바일부터 데스크탑까지 완벽한 반응형 디자인을 지원합니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
