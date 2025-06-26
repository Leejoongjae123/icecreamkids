const getSmartFolderPath = {
  UserFolder: 'folder',
  Photo: 'photo',
  EducationalData: 'docs',
} as const;

const getApiTypeForSlug = {
  folder: 'UserFolder',
  photo: 'Photo',
  docs: 'EducationalData',
} as const;

export { getSmartFolderPath, getApiTypeForSlug };
