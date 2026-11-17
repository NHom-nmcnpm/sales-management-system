import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { Button } from '../ui/button.jsx';

export function Loading({ label = 'Đang tải dữ liệu…' }) {
  return (
    <div className="state-panel" role="status">
      <LoaderCircle className="animate-spin" size={24} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <div className="state-panel error-state" role="alert">
      <AlertCircle size={26} aria-hidden="true" />
      <p>{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
export function EmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Dữ liệu sẽ xuất hiện khi có phát sinh.',
  action,
}) {
  return (
    <div className="state-panel">
      <span className="empty-icon">
        <Inbox size={28} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function PageHeading({ title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
