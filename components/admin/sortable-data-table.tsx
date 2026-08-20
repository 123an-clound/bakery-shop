"use client";

import { useState, useTransition, type ReactNode } from "react";
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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface AdminTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "bg-muted z-10")}
    >
      <TableCell className="w-8 px-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground flex size-6 cursor-grab items-center justify-center"
          aria-label="Kéo để sắp xếp"
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

/**
 * Lightweight table shell (no TanStack Table — v9's API diverges enough
 * from v8 that hand-rolled columns are simpler and fully typed) + optional
 * dnd-kit drag-reorder (mục 9.2/9.3/9.7: "kéo-thả đổi sort_order").
 * `getRowId` must return a stable string id.
 */
export function SortableDataTable<T>({
  columns,
  data,
  getRowId,
  onReorder,
  emptyMessage = "Chưa có dữ liệu.",
}: {
  columns: AdminTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  onReorder?: (orderedIds: string[]) => Promise<void> | void;
  emptyMessage?: string;
}) {
  const [items, setItems] = useState(data);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (items.length !== data.length || items.some((item, i) => getRowId(item) !== getRowId(data[i]!))) {
    // parent re-fetched with different rows (create/delete/external change) — resync
    setItems(data);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => getRowId(item) === active.id);
    const newIndex = items.findIndex((item) => getRowId(item) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    startTransition(() => {
      void onReorder?.(reordered.map(getRowId));
    });
  }

  const rowIds = items.map(getRowId);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {onReorder ? <TableHead className="w-8" /> : null}
            {columns.map((col) => (
              <TableHead key={col.id} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {onReorder ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                {items.map((row) => (
                  <SortableRow key={getRowId(row)} id={getRowId(row)}>
                    {columns.map((col) => (
                      <TableCell key={col.id} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </SortableRow>
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            items.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((col) => (
                  <TableCell key={col.id} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (onReorder ? 1 : 0)} className="text-muted-foreground py-8 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
