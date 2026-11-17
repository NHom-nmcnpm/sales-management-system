import { Link, useParams } from 'react-router-dom';
import { Printer, ArrowLeft, Store, CheckCircle2 } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { money, number, dateTime, invoiceCode } from '../utilities/format.js';
import { Loading, ErrorState, PageHeading } from '../components/common/States.jsx';
import { Button } from '../components/ui/button.jsx';

export function InvoicePage() {
  const { id } = useParams();
  const resource = useResource(`/invoices/${id}`);
  if (resource.loading) return <Loading />;
  if (resource.error) return <ErrorState message={resource.error} onRetry={resource.reload} />;
  const invoice = resource.data.data;
  return (
    <>
      <PageHeading
        title={`Hóa đơn ${invoiceCode(invoice.number)}`}
        description="Chi tiết giao dịch đã được ghi nhận."
        action={
          <div className="heading-actions">
            <Button asChild variant="outline">
              <Link to="/ban-hang">
                <ArrowLeft size={16} />
                Về bán hàng
              </Link>
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={16} />
              In hóa đơn
            </Button>
          </div>
        }
      />
      <article className="invoice-sheet panel">
        <header className="invoice-brand">
          <div className="brand">
            <span className="brand-icon">
              <Store size={24} />
            </span>
            <span>
              Cửa hàng Văn Phòng<small>SỔ BÁN HÀNG</small>
            </span>
          </div>
          <div>
            <h2>HÓA ĐƠN BÁN HÀNG</h2>
            <strong>{invoiceCode(invoice.number)}</strong>
            <span className="badge green">
              <CheckCircle2 size={14} />
              Đã thanh toán
            </span>
          </div>
        </header>
        <div className="invoice-parties">
          <section>
            <span>KHÁCH HÀNG</span>
            <h3>{invoice.customerSnapshot.name}</h3>
            {invoice.customerSnapshot.phone && <p>{invoice.customerSnapshot.phone}</p>}
            {invoice.customerSnapshot.address && <p>{invoice.customerSnapshot.address}</p>}
          </section>
          <section>
            <span>THÔNG TIN GIAO DỊCH</span>
            <p>
              Thời gian <strong>{dateTime(invoice.paidAt)}</strong>
            </p>
            <p>
              Người lập <strong>{invoice.createdBy.name}</strong>
            </p>
            <p>
              Thanh toán{' '}
              <strong>{invoice.payment.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</strong>
            </p>
          </section>
        </div>
        <div className="table-scroll">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th className="numeric">Đơn giá</th>
                <th className="numeric">Số lượng</th>
                <th className="numeric">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small className="cell-subtitle">
                      {item.sku} · {item.unit}
                    </small>
                  </td>
                  <td className="numeric">{money(item.unitPrice)}</td>
                  <td className="numeric">{number(item.quantity)}</td>
                  <td className="numeric">
                    <strong>{money(item.subtotal)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="invoice-bottom">
          <div className="invoice-payment">
            <h3>Thông tin thanh toán</h3>
            {invoice.payment.method === 'CASH' ? (
              <>
                <p>
                  Tiền khách đưa <strong>{money(invoice.payment.cashReceived)}</strong>
                </p>
                <p>
                  Tiền thừa <strong>{money(invoice.payment.change)}</strong>
                </p>
              </>
            ) : (
              <p>
                Mã tham chiếu <strong>{invoice.payment.transferReference || '—'}</strong>
              </p>
            )}
            {invoice.promotionSnapshot && (
              <p>
                Khuyến mại <strong>{invoice.promotionSnapshot.name}</strong>
              </p>
            )}
          </div>
          <div className="invoice-totals">
            <div className="summary-row">
              <span>Tạm tính</span>
              <strong>{money(invoice.subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Giảm giá</span>
              <strong>−{money(invoice.discount)}</strong>
            </div>
            <div className="summary-row grand-total">
              <span>Đã thanh toán</span>
              <strong>{money(invoice.total)}</strong>
            </div>
          </div>
        </div>
        <footer className="invoice-footer">Cảm ơn quý khách đã mua hàng tại cửa hàng.</footer>
      </article>
    </>
  );
}
