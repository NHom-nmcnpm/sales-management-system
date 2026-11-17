import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ReceiptText, PackageCheck, TriangleAlert, ArrowUpRight, Plus } from 'lucide-react';
import { useAuth } from '../contexts/auth.js';
import { useResource } from '../hooks/useResource.js';
import { todayVietnam, money, number, dateTime, invoiceCode } from '../utilities/format.js';
import { StatCard } from '../components/common/StatCard.jsx';
import { RevenueChart, ProductChart } from '../components/common/Charts.jsx';
import { PageHeading, Loading, ErrorState, EmptyState } from '../components/common/States.jsx';
import { Button } from '../components/ui/button.jsx';

export function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const today = todayVietnam();
  let from = `${today.slice(0, 7)}-01`;
  if (period === 'year') from = `${today.slice(0, 4)}-01-01`;
  if (period === 'recent')
    from = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(new Date(`${today}T12:00:00+07:00`).getTime() - 29 * 86400000));
  const dates = `from=${from}&to=${today}`;
  const overview = useResource(`/reports/overview?${dates}`);
  const revenue = useResource(
    `/reports/revenue?${dates}&groupBy=${period === 'year' ? 'month' : 'day'}`,
  );
  const products = useResource(`/reports/products?${dates}&pageSize=5`);
  const data = overview.data?.data;
  return (
    <>
      <PageHeading
        title="Tổng quan"
        description={`Xin chào ${user.name}. Theo dõi hoạt động kinh doanh của cửa hàng.`}
        action={
          <div className="heading-actions">
            <select
              aria-label="Khoảng thống kê"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value="month">Tháng này</option>
              <option value="recent">30 ngày gần đây</option>
              <option value="year">Năm nay</option>
            </select>
            <Button asChild>
              <Link to="/ban-hang">
                <Plus size={17} />
                Bán hàng
              </Link>
            </Button>
          </div>
        }
      />
      {overview.loading ? (
        <Loading />
      ) : overview.error ? (
        <ErrorState message={overview.error} onRetry={overview.reload} />
      ) : (
        <div className="stats-grid">
          <StatCard
            label="Doanh thu"
            value={money(data.revenue)}
            icon={Wallet}
            detail="Sau giảm giá"
          />
          <StatCard
            label="Hóa đơn đã thanh toán"
            value={number(data.invoiceCount)}
            icon={ReceiptText}
            tone="purple"
          />
          <StatCard
            label="Số lượng đã bán"
            value={number(data.unitsSold)}
            icon={PackageCheck}
            tone="green"
          />
          <StatCard
            label="Sản phẩm sắp hết"
            value={number(data.lowStockCount)}
            icon={TriangleAlert}
            tone="amber"
            detail={
              <Link className="text-link inline-link" to="/ton-kho?stockStatus=low">
                Kiểm tra tồn kho
                <ArrowUpRight size={12} />
              </Link>
            }
          />
        </div>
      )}
      <div className="dashboard-charts">
        <section className="panel chart-panel">
          <div className="panel-title-row">
            <div>
              <h2>Doanh thu theo {period === 'year' ? 'tháng' : 'ngày'}</h2>
              <p>Đơn vị VND · Sau giảm giá</p>
            </div>
            <span className="chart-legend">
              <i />
              Doanh thu
            </span>
          </div>
          {revenue.loading ? (
            <Loading />
          ) : revenue.error ? (
            <ErrorState message={revenue.error} onRetry={revenue.reload} />
          ) : (
            <>
              <RevenueChart report={revenue.data.data} />
              <details className="chart-data-details">
                <summary>Xem dữ liệu doanh thu</summary>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Kỳ</th>
                        <th>Doanh thu</th>
                        <th>Hóa đơn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.data.data.data.map((row) => (
                        <tr key={row.period}>
                          <td>{row.period}</td>
                          <td>{money(row.revenue)}</td>
                          <td>{number(row.invoiceCount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </section>
        <section className="panel chart-panel">
          <div className="panel-title-row">
            <div>
              <h2>Sản phẩm bán chạy</h2>
              <p>Theo số lượng trong kỳ</p>
            </div>
            <Link
              to="/bao-cao?tab=products"
              className="icon-button"
              aria-label="Xem báo cáo sản phẩm"
            >
              <ArrowUpRight size={17} />
            </Link>
          </div>
          {products.loading ? (
            <Loading />
          ) : products.error ? (
            <ErrorState message={products.error} onRetry={products.reload} />
          ) : (
            <>
              <ProductChart rows={products.data.data} />
              <details className="chart-data-details">
                <summary>Xem số lượng chi tiết</summary>
                <ul>
                  {products.data.data.map((row) => (
                    <li key={row.id}>
                      <span>{row.name}</span>
                      <strong>{number(row.quantity)}</strong>
                    </li>
                  ))}
                </ul>
              </details>
            </>
          )}
        </section>
      </div>
      <section className="panel">
        <div className="panel-title-row recent-title">
          <h2>Giao dịch gần đây</h2>
          <Link className="text-link inline-link" to="/hoa-don">
            Xem tất cả
            <ArrowUpRight size={13} />
          </Link>
        </div>
        {overview.loading ? (
          <Loading />
        ) : overview.error ? (
          <ErrorState message={overview.error} onRetry={overview.reload} />
        ) : !data.recentInvoices.length ? (
          <EmptyState
            title="Chưa phát sinh giao dịch"
            description="Hóa đơn đã thanh toán sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Mã hóa đơn</th>
                  <th>Khách hàng</th>
                  <th>Thời gian</th>
                  <th>Thanh toán</th>
                  <th className="numeric">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link className="text-link inline-link" to={`/hoa-don/${invoice.id}`}>
                        {invoiceCode(invoice.number)}
                      </Link>
                    </td>
                    <td>{invoice.customerSnapshot.name}</td>
                    <td>{dateTime(invoice.paidAt)}</td>
                    <td>
                      <span className="badge gray">
                        {invoice.payment.method === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                      </span>
                    </td>
                    <td className="numeric">
                      <strong>{money(invoice.total)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
