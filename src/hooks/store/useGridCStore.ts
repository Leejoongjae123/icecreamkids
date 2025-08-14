import { create } from 'zustand';

export interface GridCImageData {
	gridId: string;
	driveItemKey?: string;
	keywordText?: string;
	isSelected?: boolean;
}

interface GridCStore {
	byGridId: Record<string, GridCImageData>;
	setImage: (gridId: string, driveItemKey?: string) => void;
	setKeyword: (gridId: string, keywordText: string) => void;
	setSelected: (gridId: string, isSelected: boolean) => void;
	remove: (gridId: string) => void;
	clearAll: () => void;
	getImagesPayload: () => { imageDriveItemKey: string; userTextForImage: string }[];
	getImagesForValidation: () => { imageDriveItemKey: string; userTextForImage: string }[];
}

const useGridCStore = create<GridCStore>((set, get) => ({
	byGridId: {},

	setImage: (gridId: string, driveItemKey?: string) => {
		set((state) => ({
			byGridId: {
				...state.byGridId,
				[gridId]: {
					gridId,
					driveItemKey,
					keywordText: state.byGridId[gridId]?.keywordText || '',
					isSelected: state.byGridId[gridId]?.isSelected || false,
				},
			},
		}));
	},

	setKeyword: (gridId: string, keywordText: string) => {
		set((state) => ({
			byGridId: {
				...state.byGridId,
				[gridId]: {
					gridId,
					driveItemKey: state.byGridId[gridId]?.driveItemKey,
					keywordText,
					isSelected: state.byGridId[gridId]?.isSelected || false,
				},
			},
		}));
	},

	setSelected: (gridId: string, isSelected: boolean) => {
		set((state) => ({
			byGridId: {
				...state.byGridId,
				[gridId]: {
					gridId,
					driveItemKey: state.byGridId[gridId]?.driveItemKey,
					keywordText: state.byGridId[gridId]?.keywordText || '',
					isSelected,
				},
			},
		}));
	},

	remove: (gridId: string) => {
		set((state) => {
			const next = { ...state.byGridId };
			delete next[gridId];
			return { byGridId: next };
		});
	},

	clearAll: () => set({ byGridId: {} }),

	getImagesPayload: () => {
		const map = get().byGridId;
		const entries = Object.values(map);
		return entries
			.filter((it) => 
				it.isSelected && 
				Boolean(it.driveItemKey) && 
				!String(it.driveItemKey).startsWith('local_')
			)
			.map((it) => ({
				imageDriveItemKey: it.driveItemKey as string,
				userTextForImage: (it.keywordText || '').trim(),
			}));
	},

	getImagesForValidation: () => {
		const map = get().byGridId;
		const entries = Object.values(map);
		// 검증용: 로컬 이미지도 포함하여 반환 (버튼 활성화 체크용)
		return entries
			.filter((it) => 
				it.isSelected && 
				Boolean(it.driveItemKey)
			)
			.map((it) => ({
				imageDriveItemKey: it.driveItemKey as string,
				userTextForImage: (it.keywordText || '').trim(),
			}));
	},
}));

export default useGridCStore;


