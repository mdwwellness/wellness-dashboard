"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, User, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";

interface ProfilePicUploaderProps {
  value: string | undefined;
  onChange: (url: string) => void;
  name?: string;
  /** "lg" for the detail header, "md" for inline forms. */
  size?: "md" | "lg";
}

export function ProfilePicUploader({
  value,
  onChange,
  name,
  size = "md",
}: ProfilePicUploaderProps) {
  const [previewError, setPreviewError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("therapistProfileImage", {
    onClientUploadComplete: (res) => {
      const url =
        res?.[0]?.serverData?.url ?? res?.[0]?.ufsUrl ?? res?.[0]?.url;
      if (url) {
        onChange(url);
        setPreviewError(false);
        toast.success("Profile picture uploaded");
      }
    },
    onUploadError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload([file]);
    e.target.value = "";
  }

  const initials =
    (name ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "";

  const dim = size === "lg" ? "h-24 w-24" : "h-20 w-20";
  const hasImage = Boolean(value) && !previewError;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label={hasImage ? "Change profile picture" : "Upload profile picture"}
          className={cn(
            "group relative rounded-full overflow-hidden border-2 border-border bg-muted",
            "flex items-center justify-center shrink-0 cursor-pointer",
            "ring-offset-background transition-shadow",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "hover:shadow-md",
            dim,
          )}
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt={name ? `${name}'s profile` : "Profile"}
              className="h-full w-full object-cover"
              onError={() => setPreviewError(true)}
            />
          ) : initials ? (
            <span className="text-xl font-semibold text-muted-foreground">
              {initials}
            </span>
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}

          {/* hover/focus overlay */}
          <span
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-0.5",
              "bg-black/55 text-white opacity-0 transition-opacity duration-200",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
              isUploading && "opacity-0",
            )}
          >
            <Camera className="h-5 w-5" />
            <span className="text-[10px] font-medium">
              {hasImage ? "Change" : "Upload"}
            </span>
          </span>

          {isUploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
        </button>

        {hasImage && !isUploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove profile picture"
            className={cn(
              "absolute -top-1 -right-1 h-6 w-6 rounded-full",
              "bg-destructive text-white shadow-sm",
              "flex items-center justify-center cursor-pointer",
              "transition-transform hover:scale-110",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={isUploading}
        />
      </div>

      <span className="text-[11px] text-muted-foreground">
        {isUploading ? "Uploading…" : hasImage ? "Tap to change" : "Tap to upload"}
      </span>
    </div>
  );
}
