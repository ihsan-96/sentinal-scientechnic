import { Icons } from '../lib/icons';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Compact chevron pager: ‹ page / total ›. */
export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="row" style={{ gap: 8 }}>
      <button
        className="btn btn-icon"
        disabled={page <= 1}
        style={{ opacity: page <= 1 ? 0.4 : 1 }}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <Icons.ChevronLeft size={15} />
      </button>
      <span className="mono faint" style={{ fontSize: 11, minWidth: 54, textAlign: 'center' }}>
        {page} / {totalPages}
      </span>
      <button
        className="btn btn-icon"
        disabled={page >= totalPages}
        style={{ opacity: page >= totalPages ? 0.4 : 1 }}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <Icons.ChevronRight size={15} />
      </button>
    </div>
  );
}
