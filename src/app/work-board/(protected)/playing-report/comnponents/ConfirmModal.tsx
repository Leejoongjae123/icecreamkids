"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  children: ReactNode;
  title?: string;
  description?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

export default function ConfirmModal({
  children,
  title = "확인",
  description = "작업을 진행하시겠습니까?",
  confirmText = "확인",
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="gap-y-2 w-full max-w-[300px]">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center py-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Button
            className="px-8 py-2 bg-primary hover:bg-primary/80 text-white"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 