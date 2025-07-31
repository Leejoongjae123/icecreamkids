import bundleAnalyzer from '@next/bundle-analyzer'; // 빌드 분석도구 추가

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: true, // SWC로 코드 압축
  optimizeFonts: true, // 폰트 최적화
  compress: true, // gzip 압축 활성화
  trailingSlash: false, // 불필요한 리디렉션 방지
  productionBrowserSourceMaps: false, // 운영배포시 소스맵 비활성화
  cleanDistDir: true, // 매 빌드 시 .next 디렉터리 정리 -> 빌드속도 증가
  async rewrites() {
    return [
      {
        source: '/s3/:path*',
        destination: `${process.env.NEXT_PUBLIC_S3_URL}/:path*`,
      },
    ];
  },
  compiler: {
    /**
     * @title removeConsole
     * @see https://nextjs.org/docs/architecture/nextjs-compiler#remove-console
     * Turbopack과 충돌하므로 production에서만 활성화
     */
    ...(process.env.NODE_ENV === 'production' && {
      removeConsole: {
        exclude: ['error'],
      },
    }),
  },
  images: {
    remotePatterns:
      // 여기에 허용할 호스트네임 추가
      [
        {
          protocol: 'https',
          hostname: 'picsum.photos',
        },

        {
          protocol: 'https',
          hostname: 's3.ap-northeast-2.amazonaws.com',
        },
        
        {
          protocol: 'https',
          hostname: 'icecreamkids.s3.ap-northeast-2.amazonaws.com',
        },
      ],
  },
  webpack: (config, { isServer, dev }) => {
    // 클라이언트 예외처리
    if (!isServer) {
      config.module.rules.push({
        test: /hwp\.js/, // hwp.js 체크
        resolve: {
          fallback: {
            fs: false, // hwp.js 내부에서만 fs 제거
          },
        },
      });
      
      // Konva를 위한 canvas 모듈 fallback 설정
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    // 서버 사이드에서 Konva 관련 모듈 제외
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }
    
    // Windows 환경에서 HMR 개선을 위한 설정
    if (dev && process.platform === 'win32') {
      config.watchOptions = {
        poll: 1000, // 1초마다 파일 변경 감지
        aggregateTimeout: 200, // 변경 감지 후 200ms 대기
        ignored: [
          /node_modules/,
          /.next/,
          /.git/,
          /public/,
          /out/,
          /dist/,
          /build/,
          /coverage/,
          /tmp/,
          /temp/,
        ],
      };
    }
    
    return config;
  },
  async headers() {
    return [
      {
        // 이미지에 대한 캐싱 정책
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // favicon 등 루트 레벨 파일: 1시간 캐시
      {
        source: '/:file(favicon\\.png|next\\.svg|vercel\\.svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
  experimental: {
    proxyTimeout: 5 * 60 * 1000,
  },
};

const withAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: process.env.ANALYZE === 'true',
});


export default withAnalyzer(nextConfig);

