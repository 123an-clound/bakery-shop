"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { GripVertical, Star, Trash2, Upload } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

async function compressAndUpload(file: File, folder: string): Promise<string> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1.5,
    fileType: "image/webp",
    initialQuality: 0.85,
  });

  const formData = new FormData();
  formData.append("file", compressed, compressed.name.replace(/\.\w+$/, ".webp"));
  formData.append("folder", folder);

  const response = await fetch("/api/upload", { method: "POST", body: formData });
  const json = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !json.url) {
    throw new Error(json.error ?? "upload_failed");
  }
  return json.url;
}

function SortableThumb({
  url,
  isCover,
  onSetCover,
  onRemove,
}: {
  url: string;
  isCover: boolean;
  onSetCover: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-lg border",
        isDragging && "z-10 opacity-70",
        isCover && "ring-primary ring-2",
      )}
    >
      <Image src={url} alt="" fill sizes="120px" className="object-cover" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="bg-background/80 absolute top-1 left-1 flex size-6 cursor-grab items-center justify-center rounded-md opacity-0 group-hover:opacity-100"
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="size-3.5" />
      </button>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={onSetCover}
          className={cn(
            "bg-background/80 flex size-6 items-center justify-center rounded-md",
            isCover && "text-primary",
          )}
          aria-label="Đặt làm ảnh đại diện"
        >
          <Star className={cn("size-3.5", isCover && "fill-primary")} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="bg-background/80 text-destructive flex size-6 items-center justify-center rounded-md"
          aria-label="Xoá ảnh"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {isCover ? (
        <span className="bg-primary text-primary-foreground absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
          Đại diện
        </span>
      ) : null}
    </div>
  );
}

/**
 * Drag-drop multi-image uploader — mục 9.2: nén WebP ≤1600px trước khi
 * upload, sắp xếp lại, đặt ảnh đại diện (ảnh đầu tiên trong mảng), xoá.
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  max = 8,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: "products" | "categories" | "banners" | "posts" | "theme";
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${max} ảnh.`);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of list) {
      try {
        uploaded.push(await compressAndUpload(file, folder));
      } catch {
        toast.error(`Không tải lên được ảnh "${file.name}".`);
      }
    }
    setUploading(false);
    if (uploaded.length > 0) onChange([...value, ...uploaded]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.indexOf(String(active.id));
    const newIndex = value.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "border-input flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragOver && "border-primary bg-accent",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="text-muted-foreground size-6" />
        <p className="text-muted-foreground text-sm">Kéo thả ảnh vào đây, hoặc</p>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Đang tải lên..." : "Chọn ảnh"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value} strategy={horizontalListSortingStrategy}>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {value.map((url, i) => (
                <SortableThumb
                  key={url}
                  url={url}
                  isCover={i === 0}
                  onSetCover={() => onChange([url, ...value.filter((u) => u !== url)])}
                  onRemove={() => onChange(value.filter((u) => u !== url))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}
    </div>
  );
}
