import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import { Loading, ErrorState, EmptyState } from './States.jsx';

export function TableToolbar({ query, placeholder = 'Tìm kiếm…', children }) {
  return <div className="table-toolbar"><div className="search-field"><Search size={17} aria-hidden="true" /><input aria-label="Tìm kiếm" placeholder={placeholder} value={query.get('q')} onChange={event => query.update('q', event.target.value)} /></div><div className="table-filters">{children}</div></div>;
}
export function ActiveFilter({ query }) {
  return <select aria-label="Trạng thái" value={query.get('isActive')} onChange={event => query.update('isActive', event.target.value)}><option value="">Mọi trạng thái</option><option value="true">Đang hoạt động</option><option value="false">Ngừng hoạt động</option></select>;
}
export function DataTable({ resource, columns, query, emptyTitle, emptyDescription }) {
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorState message={resource.error} onRetry={resource.reload} />;
  const rows = resource.data?.data ?? [];
  const pagination = resource.data?.pagination;
  if (!rows.length) return <EmptyState title={emptyTitle || 'Không tìm thấy kết quả'} description={emptyDescription || 'Thử thay đổi từ khóa hoặc bộ lọc để tìm dữ liệu.'} />;
  return <><div className="table-scroll"><table><thead><tr>{columns.map(column => <th key={column.key} scope="col" aria-sort={column.sortable ? query.sortBy === column.key ? query.sortOrder === 'asc' ? 'ascending' : 'descending' : 'none' : undefined} className={column.className ?? ''}>{column.sortable ? <button className="sort-button" onClick={() => query.sort(column.key)}>{column.label}{query.sortBy === column.key ? query.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} /> : <ChevronsUpDown size={13} />}</button> : column.label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{columns.map(column => <td key={column.key} className={column.className ?? ''}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>
    {pagination && <div className="pagination"><span>{(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} trong {pagination.total} kết quả</span><div><select aria-label="Số dòng mỗi trang" value={pagination.pageSize} onChange={event => query.update('pageSize', event.target.value)}><option value="10">10 dòng</option><option value="20">20 dòng</option><option value="50">50 dòng</option></select><Button size="icon" variant="outline" disabled={pagination.page <= 1} onClick={() => query.update('page', pagination.page - 1)} aria-label="Trang trước"><ChevronLeft size={16} /></Button><span>{pagination.page} / {pagination.totalPages}</span><Button size="icon" variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => query.update('page', pagination.page + 1)} aria-label="Trang sau"><ChevronRight size={16} /></Button></div></div>}
  </>;
}
