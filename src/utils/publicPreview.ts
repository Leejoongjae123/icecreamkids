import { IPathCondition } from '@/app/api/[service]/[...path]/types';

const PUBLIC_PREVIEW_PATHS: IPathCondition[] = [
  {
    required: ['public-url-item'],
    optional: ['detailed-info', 'recommand-items-for-detailed-info'],
  },
  {
    required: ['v2', 'drive-items', 'presigned-urls'],
  },
  {
    required: ['open-api'],
  },
];

export const isPublicPreview = (path: string[] | undefined): boolean => {
  if (!path) return false;

  return PUBLIC_PREVIEW_PATHS.some(({ required, optional }) => {
    const hasRequired = required.every((key) => path.includes(key));
    const hasOptional = optional ? optional.some((key) => path.includes(key)) : true;
    return hasRequired && hasOptional;
  });
};
