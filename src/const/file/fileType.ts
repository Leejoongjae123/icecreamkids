// 파일 확장자 및 MIME 타입 관련 상수
const FILE_EXTENSIONS = {
  documents: [
    '.txt',
    '.pdf',
    '.hwp',
    '.hwpx',
    '.doc',
    '.docx',
    '.ppt',
    '.pptx',
    '.xls',
    '.xlsx',
    '.odt',
    '.ppsx',
    '.show',
    '.hwt',
    '.PSD',
    '.AI',
    '.PRPROJ', // 프리미어 프로 프로젝트
    '.csv',
  ],
  images: ['.apng', '.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp', '.svg'],
  videos: ['.avi', '.mp4', '.mpeg', '.webm', '.wmv', '.mov'],
  audio: ['.mp3', '.wav', '.weba', '.wma', '.m4a', '.flac'],
  archives: ['.gz', '.zip', '.7z', '.alz', '.egg'],
} as const;

// MIME type
const FILE_TYPES = {
  documents: [
    'text/plain',
    'application/pdf',
    'application/x-hwp',
    'application/haansoftphwp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
    'application/x-show',
    'application/x-hwt',
    'image/vnd.adobe.photoshop',
    'application/illustrator',
    'application/x-prproj',
    'text/csv',
  ],
  images: [
    'image/apng',
    'image/avif',
    'image/bmp',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/webp',
    'image/svg+xml',
  ],
  videos: ['video/x-msvideo', 'video/mp4', 'video/mpeg', 'video/webm', 'video/x-ms-wmv', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/x-ms-wma', 'audio/mp4', 'audio/flac'],
  archives: [
    'application/gzip',
    'application/zip',
    'application/x-7z-compressed',
    'application/x-alz',
    'application/x-egg',
  ],
};

const FILE_TYPE_MESSAGES = {
  documents: '문서 파일 (TXT, PDF, HWP, DOC, PPT, XLS 등)',
  images: '이미지 파일 (PNG, JPG, GIF, WEBP 등)',
  videos: '동영상 파일 (MP4, AVI, WEBM 등)',
  audio: '오디오 파일 (MP3, WAV, flac 등)',
  archives: '압축 파일 (ZIP, 7Z, ALZ 등)',
  all: '모든 파일',
};

export { FILE_EXTENSIONS, FILE_TYPES, FILE_TYPE_MESSAGES };
