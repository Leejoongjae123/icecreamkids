export type ReportTypeABC = 'TypeA' | 'TypeB' | 'TypeC';

export interface BackgroundImage {
  id: number;
  categoryId: number;
  type: 'Background';
  name: string;
  thumbUrl: string;
  imageUrl: string;
  createdAt: string;
}

export interface DecorationItem {
  id: number;
  type: 'DecorationItem';
  name: string;
  thumbUrl: string;
  imageUrl: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface ThemeItem {
  id: number;
  reportType: ReportTypeABC;
  name: string;
  thumbUrl: string;
  createdAt: string;
  backgroundImage: BackgroundImage;
  decorationItems: DecorationItem[];
}

export interface ThemeItemListResponse {
  status: number;
  result: ThemeItem[];
  timestamp: string;
}


