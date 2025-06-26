export interface termsContentItem {
  title?: string;
  contents: (string | string[])[] | (string | (string | string[])[])[];
}

export interface termsItem {
  title: string;
  contentItem: termsContentItem[];
}
