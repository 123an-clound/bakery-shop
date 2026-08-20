"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import type { ThemeData } from "@/lib/bakery/schemas";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  categories: "Danh mục",
  featured: "Sản phẩm nổi bật",
  custom_cake: "Đặt bánh riêng",
  best_sellers: "Bán chạy",
  story: "Câu chuyện",
  testimonials: "Đánh giá khách hàng",
  blog: "Tin tức",
  instagram: "Instagram",
  newsletter: "Đăng ký nhận tin",
};

type Section = ThemeData["sections"][number];

function SortableSectionRow({ section, onToggle, onLimitChange }: { section: Section; onToggle: (enabled: boolean) => void; onLimitChange?: (limit: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border p-3 ${isDragging ? "bg-muted z-10" : ""}`}
    >
      <button type="button" {...attributes} {...listeners} className="text-muted-foreground cursor-grab" aria-label="Kéo để sắp xếp">
        <GripVertical className="size-4" />
      </button>
      <span className="flex-1 text-sm font-medium">{SECTION_LABELS[section.key] ?? section.key}</span>
      {(section.key === "featured" || section.key === "best_sellers") && onLimitChange ? (
        <div className="flex items-center gap-1.5">
          <Label htmlFor={`limit-${section.key}`} className="text-muted-foreground text-xs">
            Số lượng
          </Label>
          <Input
            id={`limit-${section.key}`}
            type="number"
            min={2}
            max={20}
            className="h-8 w-16"
            value={typeof section.props?.limit === "number" ? section.props.limit : 8}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          />
        </div>
      ) : null}
      <Switch checked={section.enabled} onCheckedChange={onToggle} />
    </div>
  );
}

export function SectionsPanel({ sections, onChange }: { sections: Section[]; onChange: (sections: Section[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex((s) => s.key === active.id);
    const newIndex = sorted.findIndex((s) => s.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sorted, oldIndex, newIndex).map((s, i) => ({ ...s, order: i + 1 }));
    onChange(reordered);
  }

  function updateSection(key: string, patch: Partial<Section>) {
    onChange(sections.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map((s) => s.key)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sorted.map((section) => (
            <SortableSectionRow
              key={section.key}
              section={section}
              onToggle={(enabled) => updateSection(section.key, { enabled })}
              onLimitChange={
                section.key === "featured" || section.key === "best_sellers"
                  ? (limit) => updateSection(section.key, { props: { ...section.props, limit } })
                  : undefined
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
