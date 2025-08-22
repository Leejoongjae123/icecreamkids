"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ApplyModalProps {
  children: React.ReactNode;
  title?: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ApplyModal({
  children,
  title,
  description,
  cancelText = "취소",
  confirmText = "적용",
  onConfirm,
  onCancel,
  open: controlledOpen,
  onOpenChange,
}: ApplyModalProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  // controlled vs uncontrolled 모드 처리
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const handleCancel = () => {
    setOpen(false);
    onCancel?.();
  };

  const handleConfirm = () => {
    setOpen(false);
    onConfirm?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="">
        <div className="flex overflow-hidden flex-col pt-9 text-base tracking-tight rounded-3xl max-w-[400px] shadow-[1px_1px_4px_rgba(140,194,215,0.1)]">
          {title && (
            <div className="self-center font-semibold text-lg text-gray-900 mb-4 px-6">
              {title}
            </div>
          )}
          <div className="self-center font-medium leading-6 text-center text-gray-700 px-6 whitespace-pre-line">
            {description}
          </div>
          <div className="flex mt-9 w-full font-semibold leading-none whitespace-nowrap">
            <button
              onClick={handleCancel}
              className="flex overflow-hidden flex-col justify-center items-center px-16 py-4 text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors flex-1"
            >
              <div>{cancelText}</div>
            </button>
            <button
              onClick={handleConfirm}
              className="flex overflow-hidden flex-col justify-center items-center px-16 py-4 text-white bg-primary hover:bg-primary/80 transition-colors flex-1"
            >
              <div>{confirmText}</div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ApplyModal;
