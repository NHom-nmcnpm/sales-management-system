import { useSearchParams } from 'react-router-dom';
import { Wallet, ReceiptText, PackageCheck } from 'lucide-react';
import { useResource } from '../hooks/useResource.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { money, number, todayVietnam, periodLabel } from '../utilities/format.js';
import { PageHeading, Loading, ErrorState } from '../components/common/States.jsx';
import { StatCard } from '../components/common/StatCard.jsx';
import { RevenueChart } from '../components/common/Charts.jsx';
import { DataTable, TableToolbar } from '../components/common/DataTable.jsx';

export function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'products' ? 'products' : 'revenue';
  const query = useListQuery(tab === 'products' ? 'quantity' : 'period');
  const today = todayVietnam();
  const from = query.get('from') || `${today.slice(0, 7)}-01`;
  const to = query.get('to') || today;
  const groupBy = query.get('groupBy') || 'day';
  const dates = `from=${from}&to=${to}`;
  const overview = useResource(`/reports/overview?${dates}`);
  const revenue = useResource(
    tab === 'revenue' ? `/reports/revenue?${dates}&groupBy=${groupBy}` : null,
  );
  const products = useResource(
    tab === 'products' ? `/reports/products?${query.queryString}` : null,
  );
  function changeTab(value) {
    const next = new URLSearchParams(params);
    next.set('tab', value);
    for (const key of ['sortBy', 'sortOrder', 'page', 'q']) next.delete(key);
    setParams(next, { replace: true });
  }
  const revenueRows = (revenue.data?.data.data ?? []).filter(
    (row) =>
      row.period.includes(query.get('q')) ||
      periodLabel(row.period, groupBy).includes(query.get('q')),
  );
  const revenueSort = ['period', 'revenue', 'invoiceCount'].includes(query.sortBy)
    ? query.sortBy
    : 'period';
  revenueRows.sort((first, second) => {
    const left = revenueSort === 'period' ? first.period : BigInt(first[revenueSort]);
    const right = revenueSort === 'period' ? second.period : BigInt(second[revenueSort]);
    const comparison = left < right ? -1 : left > right ? 1 : 0;
    return comparison * (query.sortOrder === 'asc' ? 1 : -1);
  });
  const page = Math.max(1, Math.floor(Number(query.get('page')) || 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(Number(query.get('pageSize')) || 20)));
  const revenueTable = {
    ...revenue,
    data: {
      data: revenueRows
        .slice((page - 1) * pageSize, page * pageSize)
        .map((row) => ({ ...row, id: row.period })),
      pagination: {
        page,
        pageSize,
        total: revenueRows.length,
        totalPages: Math.max(1, Math.ceil(revenueRows.length / pageSize)),
      },
    },
  };
  const columns =
    tab === 'revenue'
      ? [
          {
            key: 'period',
            label: 'Kỳ thống kê',
            sortable: true,
            render: (row) =>
              groupBy === 'day'
                ? row.period.split('-').reverse().join('/')
                : periodLabel(row.period, groupBy),
          },
          {
            key: 'invoiceCount',
            label: 'Số hóa đơn',
            sortable: true,
            className: 'numeric',
            render: (row) => number(row.invoiceCount),
          },
          {
            key: 'revenue',
            label: 'Doanh thu sau giảm',
            sortable: true,
            className: 'numeric',
            render: (row) => <strong>{money(row.revenue)}</strong>,
          },
        ]
      : [
          {
            key: 'name',
            label: 'Sản phẩm',
            sortable: true,
            render: (row) => (
              <div>
                <strong>{row.name}</strong>
                <small className="cell-subtitle">{row.sku}</small>
              </div>
            ),
          },
          {
            key: 'quantity',
            label: 'Số lượng bán',
            sortable: true,
            className: 'numeric',
            render: (row) => number(row.quantity),
          },
          {
            key: 'subtotal',
            label: 'Thành tiền trước giảm',
            sortable: true,
            className: 'numeric',
            render: (row) => money(row.subtotal),
          },
        ];
  return (
    <>
      <PageHeading
        title="Báo cáo kinh doanh"
        description="Đối chiếu doanh thu và hàng hóa đã bán theo thời gian."
      />
      <div className="report-controls panel">
        <div className="report-tabs" role="tablist" aria-label="Loại báo cáo">
          <button role="tab" aria-selected={tab === 'revenue'} onClick={() => changeTab('revenue')}>
            Doanh thu
          </button>
          <button
            role="tab"
            aria-selected={tab === 'products'}
            onClick={() => changeTab('products')}
          >
            Sản phẩm bán ra
          </button>
        </div>
        <div className="report-dates">
          <label className="date-filter">
            Từ ngày
            <input
              aria-label="Từ ngày"
              type="date"
              value={from}
              onChange={(event) => query.update('from', event.target.value)}
            />
          </label>
          <label className="date-filter">
            Đến ngày
            <input
              aria-label="Đến ngày"
              type="date"
              value={to}
              onChange={(event) => query.update('to', event.target.value)}
            />
          </label>
          {tab === 'revenue' && (
            <select
              aria-label="Nhóm thời gian"
              value={groupBy}
              onChange={(event) => query.update('groupBy', event.target.value)}
            >
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
          )}
        </div>
      </div>
      {overview.loading ? (
        <Loading />
      ) : overview.error ? (
        <ErrorState message={overview.error} onRetry={overview.reload} />
      ) : (
        <div className="stats-grid three">
          <StatCard
            label="Doanh thu sau giảm"
            value={money(overview.data.data.revenue)}
            icon={Wallet}
          />
          <StatCard
            label="Hóa đơn đã thanh toán"
            value={number(overview.data.data.invoiceCount)}
            icon={ReceiptText}
            tone="purple"
          />
          <StatCard
            label="Số lượng bán"
            value={number(overview.data.data.unitsSold)}
            icon={PackageCheck}
            tone="green"
          />
        </div>
      )}
      {tab === 'revenue' && (
        <section className="panel chart-panel report-chart">
          <div className="panel-title-row">
            <h2>
              Doanh thu theo {groupBy === 'day' ? 'ngày' : groupBy === 'month' ? 'tháng' : 'năm'}
            </h2>
            <span>VND</span>
          </div>
          {revenue.loading ? (
            <Loading />
          ) : revenue.error ? (
            <ErrorState message={revenue.error} onRetry={revenue.reload} />
          ) : (
            <RevenueChart report={revenue.data.data} />
          )}
        </section>
      )}
      <section
        className="panel"
        role="tabpanel"
        aria-label={tab === 'revenue' ? 'Bảng doanh thu' : 'Bảng sản phẩm bán ra'}
      >
        <TableToolbar
          query={query}
          placeholder={tab === 'revenue' ? 'Tìm kỳ thống kê…' : 'Tìm tên hoặc mã sản phẩm…'}
        />
        <DataTable
          resource={tab === 'revenue' ? revenueTable : products}
          query={query}
          columns={columns}
        />
      </section>
    </>
  );
}
