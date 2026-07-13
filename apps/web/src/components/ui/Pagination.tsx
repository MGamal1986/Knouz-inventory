import { Button } from "./Button";
import { Icon } from "./Icon";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-sm">
      <Button variant="ghost" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
        <Icon name="chevron_left" className="text-[18px]" />
        Prev
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        variant="ghost"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Next
        <Icon name="chevron_right" className="text-[18px]" />
      </Button>
    </div>
  );
}
