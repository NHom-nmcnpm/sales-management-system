import { useRef, useState } from 'react';
import { Modal } from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';

export function FormModal({ title, description, onClose, onSubmit, children, submitLabel = 'Lưu thông tin', wide = false }) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  const summary = useRef(null);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setFailure(null);
    try { await onSubmit(); onClose(); }
    catch (error) {
      setFailure({ message: error.message, fields: error.response?.data?.fieldErrors ?? {} });
      requestAnimationFrame(() => summary.current?.focus());
    } finally { setBusy(false); }
  }
  return <Modal open onOpenChange={open => { if (!open && !busy) onClose(); }} title={title} description={description} className={wide ? 'wide' : ''}><form onSubmit={submit} className="form-stack">{failure && <div ref={summary} tabIndex={-1} className="form-alert" role="alert">{failure.message}</div>}{children(failure?.fields ?? {})}<div className="form-actions"><Button variant="outline" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : submitLabel}</Button></div></form></Modal>;
}

export function ConfirmDialog({ title, description, onConfirm, onClose }) {
  return <FormModal title={title} description={description} onClose={onClose} onSubmit={onConfirm} submitLabel="Xác nhận">{() => null}</FormModal>;
}
