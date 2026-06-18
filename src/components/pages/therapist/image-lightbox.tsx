"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  label: string;
}

export function ImageLightbox({
  open,
  onOpenChange,
  url,
  label,
}: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-2 sm:p-4 bg-background">
        <DialogTitle className="text-sm font-medium px-2">{label}</DialogTitle>
        <div className="w-full max-h-[80vh] overflow-auto flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            className="max-w-full max-h-[78vh] object-contain rounded"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
