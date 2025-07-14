export interface ITypeSelectionModal {
  isOpen: boolean;
  onSelect: (type: "A" | "B" | "C") => void;
  onCancel: () => void;
}

export type ReportType = "A" | "B" | "C";

export interface TypeOption {
  type: ReportType;
  imageUrl: string;
  description: string;
  buttonText: string;
} 