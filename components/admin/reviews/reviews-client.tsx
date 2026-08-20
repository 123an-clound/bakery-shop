"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Check, X } from "lucide-react";

import type { AdminReviewRow } from "@/lib/bakery/admin/reviews";
import { approveReview, rejectReview } from "@/lib/actions/admin/reviews";
import { REVIEW_STATUS_LABELS } from "@/lib/bakery/admin/labels";
import { formatDateTime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ReviewsClient({ reviews, productNames }: { reviews: AdminReviewRow[]; productNames: Map<number, string> }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isPending, startTransition] = useTransition();

  const filtered = statusFilter === "all" ? reviews : reviews.filter((r) => r.status === statusFilter);

  function handleApprove(id: number, productId: number | null) {
    startTransition(async () => {
      const result = await approveReview(id, productId);
      if (result.ok) {
        toast.success("Đã duyệt đánh giá.");
        router.refresh();
      }
    });
  }

  function handleReject(id: number, productId: number | null) {
    startTransition(async () => {
      const result = await rejectReview(id, productId);
      if (result.ok) {
        toast.success("Đã từ chối đánh giá.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Chờ duyệt</SelectItem>
          <SelectItem value="approved">Đã duyệt</SelectItem>
          <SelectItem value="rejected">Đã từ chối</SelectItem>
          <SelectItem value="all">Tất cả</SelectItem>
        </SelectContent>
      </Select>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Người đánh giá</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((review) => (
              <TableRow key={review.id}>
                <TableCell>{review.productId !== null ? (productNames.get(review.productId) ?? `#${review.productId}`) : "—"}</TableCell>
                <TableCell>
                  <div className="font-medium">{review.data.author}</div>
                  <div className="text-muted-foreground max-w-56 truncate text-xs">{review.data.content}</div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={i < review.data.rating ? "fill-primary text-primary size-3.5" : "text-muted size-3.5"} />
                    ))}
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(review.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={review.status === "approved" ? "default" : review.status === "rejected" ? "destructive" : "secondary"}>
                    {REVIEW_STATUS_LABELS[review.status] ?? review.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {review.status !== "approved" ? (
                    <Button size="icon" variant="ghost" disabled={isPending} onClick={() => handleApprove(review.id, review.productId)}>
                      <Check className="text-success size-4" />
                    </Button>
                  ) : null}
                  {review.status !== "rejected" ? (
                    <Button size="icon" variant="ghost" disabled={isPending} onClick={() => handleReject(review.id, review.productId)}>
                      <X className="text-destructive size-4" />
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Không có đánh giá nào.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
