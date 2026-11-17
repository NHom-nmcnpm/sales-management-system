import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Plus, Minus, Trash2, ShoppingBag, UserRound, X, TicketPercent, ArrowRight, Banknote, CreditCard, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../contexts/cart.js';
import { useToast } from '../contexts/toast.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { useResource } from '../hooks/useResource.js';
import { api } from '../services/api.js';
import { money, number } from '../utilities/format.js';
import { Button } from '../components/ui/button.jsx';
import { Field } from '../components/common/Field.jsx';
import { FormModal, ConfirmDialog } from '../components/common/FormModal.jsx';
import { CustomerForm } from '../components/common/CustomerForm.jsx';
import { PageHeading, Loading, ErrorState, EmptyState } from '../components/common/States.jsx';

export function PosPage() {
  const { cart, setCart, clearCart, pending, setPending } = useCart();
  const notify = useToast();
  const navigate = useNavigate();
  const query = useListQuery('name');
  const products = useResource(`/products?${query.queryString}&sellable=true&pageSize=12`);
  const categories = useResource('/categories?isActive=true&pageSize=100&sortBy=name&sortOrder=asc');
  const [customerSearch, setCustomerSearch] = useState('');
  const customers = useResource(customerSearch ? `/customers?q=${encodeURIComponent(customerSearch)}&pageSize=10` : null);
  const [quote, setQuote] = useState({ data: null, loading: false, error: null });
  const [newCustomer, setNewCustomer] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [method, setMethod] = useState('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const quoteInput = JSON.stringify({ items: cart.items.map(item => ({ productId: item.id, quantity: item.quantity })), customerId: cart.customer?.id ?? null, promotionId: cart.promotionId });

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const input = JSON.parse(quoteInput);
      if (!input.items.length) { setQuote({ data: null, loading: false, error: null }); return; }
      setQuote(previous => ({ ...previous, loading: true, error: null }));
      try {
        const { data } = await api.post('/sales/quote', input, { signal: controller.signal });
        if (!controller.signal.aborted) setQuote({ data: data.data, loading: false, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setQuote({ data: null, loading: false, error: error.message });
      }
    }, 120);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [quoteInput]);

  function addProduct(product) {
    if (pending) return;
    const existing = cart.items.find(item => item.id === product.id);
    if ((existing?.quantity ?? 0) >= product.stock) { notify('Số lượng trong giỏ đã đạt tồn hiện có.', 'error'); return; }
    if (!existing && cart.items.length >= 100) { notify('Mỗi hóa đơn tối đa 100 sản phẩm.', 'error'); return; }
    setCart(previous => ({ ...previous, items: existing ? previous.items.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...previous.items, { id: product.id, name: product.name, sku: product.sku, price: product.price, unit: product.unit, quantity: 1 }] }));
  }
  function changeQuantity(id, value) {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000000 || pending) return;
    setCart(previous => ({ ...previous, items: previous.items.map(item => item.id === id ? { ...item, quantity } : item) }));
  }
  function selectCustomer(customer) {
    setCart(previous => ({ ...previous, customer: { id: customer.id, name: customer.name, phone: customer.phone } }));
    setCustomerSearch('');
  }
  function openPayment() {
    setMethod('CASH'); setCashReceived(quote.data.total); setTransferReference(''); setTransferConfirmed(false); setPaymentOpen(true);
  }
  function finish(invoice) {
    setPending(null); clearCart(); setPaymentOpen(false);
    notify('Đã ghi nhận thanh toán và cập nhật tồn kho.');
    navigate(`/hoa-don/${invoice.id}`);
  }
  async function sendCheckout(record) {
    try {
      const { data } = await api.post('/invoices', record.payload, { headers: { 'Idempotency-Key': record.key }, timeout: 20000 });
      finish(data.data);
    } catch (error) {
      const status = error.response?.status;
      if (status && status < 500 && error.response?.data?.code !== 'KEY_CONFLICT') setPending(null);
      if (error.response?.data?.code === 'QUOTE_CHANGED') {
        const { data } = await api.post('/sales/quote', JSON.parse(quoteInput));
        setQuote({ data: data.data, loading: false, error: null });
        setCashReceived(data.data.total);
      }
      throw error;
    }
  }
  async function checkout() {
    if (pending) { await sendCheckout(pending); return; }
    const payment = method === 'CASH' ? { method, cashReceived } : { method, confirmed: transferConfirmed, transferReference };
    const record = { key: crypto.randomUUID(), payload: { ...JSON.parse(quoteInput), quoteHash: quote.data.quoteHash, payment } };
    setPending(record);
    await sendCheckout(record);
  }
  async function recover() {
    setRecovering(true);
    try {
      try {
        const { data } = await api.get(`/invoices/by-request/${pending.key}`);
        finish(data.data);
      } catch (error) {
        if (error.response?.status !== 404) throw error;
        await sendCheckout(pending);
      }
    } catch (error) { notify(error.message, 'error'); }
    finally { setRecovering(false); }
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = quote.data?.total ?? '0';
  const cashEnough = /^\d+$/.test(cashReceived) && BigInt(cashReceived) >= BigInt(total);
  const quoteMatchesCart = quote.data && quote.data.items.length === cart.items.length && quote.data.items.every(item => cart.items.some(line => line.id === item.productId && line.quantity === item.quantity)) && (quote.data.customer.id ?? null) === (cart.customer?.id ?? null) && (quote.data.promotion?.id ?? null) === cart.promotionId;
  const canCheckout = cart.items.length > 0 && quoteMatchesCart && !quote.loading && !quote.error && !pending;

  return <>
    <PageHeading title="Bán hàng" description="Chọn sản phẩm, kiểm tra giỏ hàng và ghi nhận thanh toán." action={<span className="badge green"><span className="status-dot" />Sẵn sàng bán hàng</span>} />
    {pending && <div className="pending-banner" role="status"><AlertCircle size={20} /><div><strong>Giao dịch đang chờ kiểm tra kết quả</strong><p>Kiểm tra hoặc gửi lại đúng yêu cầu đã xác nhận để tiếp tục.</p></div><Button disabled={recovering} onClick={recover}>{recovering ? 'Đang kiểm tra…' : 'Kiểm tra giao dịch'}</Button></div>}
    <div className="pos-grid">
      <section className="pos-products"><div className="pos-search search-field"><Search size={19} aria-hidden="true" /><input aria-label="Tìm sản phẩm" placeholder="Tìm tên sản phẩm hoặc mã SKU…" value={query.get('q')} onChange={event => query.update('q', event.target.value)} /></div>
        <div className="category-chips" aria-label="Lọc danh mục"><button className={!query.get('categoryId') ? 'selected' : ''} onClick={() => query.update('categoryId', '')}>Tất cả sản phẩm</button>{categories.data?.data.map(category => <button key={category.id} className={query.get('categoryId') === category.id ? 'selected' : ''} onClick={() => query.update('categoryId', category.id)}>{category.name}</button>)}</div>
        {products.loading ? <Loading /> : products.error ? <ErrorState message={products.error} onRetry={products.reload} /> : !products.data?.data.length ? <EmptyState title="Không tìm thấy sản phẩm" description="Thử tên hoặc mã SKU khác." /> : <div className="product-grid">{products.data.data.map(product => <button className="product-card" key={product.id} disabled={product.stock === 0 || !!pending} onClick={() => addProduct(product)} aria-label={`Thêm ${product.name}`}><div className="product-card-top"><span className="product-card-icon"><Package size={30} aria-hidden="true" /></span><span className={`badge ${product.stock <= product.lowStockThreshold ? 'amber' : 'gray'}`}>{product.stock === 0 ? 'Hết hàng' : `Còn ${number(product.stock)}`}</span></div><small>{product.sku}</small><h2>{product.name}</h2><div className="product-card-bottom"><strong>{money(product.price)}</strong><span className="add-product"><Plus size={18} /></span></div></button>)}</div>}
        {products.data?.pagination && <div className="pos-pagination"><span>{products.data.pagination.total} sản phẩm</span><div><Button variant="outline" size="icon" aria-label="Trang sản phẩm trước" disabled={products.data.pagination.page <= 1} onClick={() => query.update('page', products.data.pagination.page - 1)}><ChevronLeft size={16} /></Button><span>{products.data.pagination.page} / {products.data.pagination.totalPages}</span><Button variant="outline" size="icon" aria-label="Trang sản phẩm sau" disabled={products.data.pagination.page >= products.data.pagination.totalPages} onClick={() => query.update('page', products.data.pagination.page + 1)}><ChevronRight size={16} /></Button></div></div>}
      </section>
      <section id="pos-cart" className="panel cart-panel" aria-label="Giỏ hàng">
        <div className="cart-heading"><div><ShoppingBag size={18} /><h2>Giỏ hàng</h2><span>{cart.items.length}</span></div><button className="icon-button" aria-label="Xóa giỏ hàng" disabled={!cart.items.length || !!pending} onClick={() => setClearConfirm(true)}><Trash2 size={17} /></button></div>
        <div className="customer-picker"><div className="customer-picker-label"><UserRound size={15} /><strong>Khách hàng</strong><button disabled={!!pending} onClick={() => setNewCustomer(true)}><Plus size={14} />Thêm mới</button></div>
          {cart.customer ? <div className="selected-customer"><div><strong>{cart.customer.name}</strong><small>{cart.customer.phone}</small></div><button className="icon-button" aria-label="Bỏ chọn khách hàng" disabled={!!pending} onClick={() => setCart({ ...cart, customer: null })}><X size={15} /></button></div> : <div className="customer-lookup"><input aria-label="Tìm khách hàng" placeholder="Khách lẻ · Tìm tên, điện thoại…" disabled={!!pending} value={customerSearch} onChange={event => setCustomerSearch(event.target.value)} />{customerSearch && <div className="customer-results">{customers.loading ? <p>Đang tìm…</p> : customers.error ? <p role="alert">{customers.error}</p> : customers.data?.data.length ? customers.data.data.map(customer => <button key={customer.id} onClick={() => selectCustomer(customer)}><strong>{customer.name}</strong><small>{customer.phone || 'Chưa có điện thoại'}</small></button>) : <p>Chưa tìm thấy khách hàng.</p>}</div>}</div>}
        </div>
        {!cart.items.length ? <EmptyState title="Giỏ hàng đang trống" description="Chọn sản phẩm bên trái để bắt đầu." /> : <div className="cart-items">{cart.items.map(item => {
          const priced = quote.data?.items.find(line => line.productId === item.id);
          return <div className="cart-item" key={item.id}><div className="cart-item-name"><strong>{item.name}</strong><small>{money(priced?.unitPrice ?? item.price)} / {item.unit}</small></div><button className="remove-line" aria-label={`Xóa ${item.name}`} disabled={!!pending} onClick={() => setCart({ ...cart, items: cart.items.filter(line => line.id !== item.id) })}><X size={15} /></button><div className="quantity-control"><button aria-label={`Giảm ${item.name}`} disabled={item.quantity <= 1 || !!pending} onClick={() => changeQuantity(item.id, item.quantity - 1)}><Minus size={13} /></button><input aria-label={`Số lượng ${item.name}`} type="number" min="1" max="1000000" disabled={!!pending} value={item.quantity} onChange={event => changeQuantity(item.id, event.target.value)} /><button aria-label={`Tăng ${item.name}`} disabled={!!pending} onClick={() => changeQuantity(item.id, item.quantity + 1)}><Plus size={13} /></button></div><strong className="cart-line-total">{money(priced?.subtotal ?? item.price)}</strong></div>;
        })}</div>}
        <div className="cart-summary"><label className="promotion-label" htmlFor="pos-promotion"><TicketPercent size={16} />Khuyến mại</label><select id="pos-promotion" value={cart.promotionId ?? ''} disabled={!!pending || !cart.items.length} onChange={event => setCart({ ...cart, promotionId: event.target.value || null })}><option value="">Không áp dụng</option>{quote.data?.eligiblePromotions.map(promotion => <option key={promotion.id} value={promotion.id}>{promotion.code} · Giảm {money(promotion.discount)}</option>)}{cart.promotionId && !quote.data?.eligiblePromotions.some(promotion => promotion.id === cart.promotionId) && <option value={cart.promotionId}>Ưu đãi cần kiểm tra lại</option>}</select>
          {quote.error && <div className="form-alert" role="alert">{quote.error}{cart.promotionId && <button className="text-link" onClick={() => setCart({ ...cart, promotionId: null })}>Bỏ ưu đãi và tính lại</button>}</div>}
          <div className="summary-row"><span>Tạm tính</span><strong>{money(quote.data?.subtotal)}</strong></div><div className="summary-row"><span>Giảm giá</span><strong className="positive">−{money(quote.data?.discount)}</strong></div><div className="summary-row grand-total"><span>Tổng thanh toán</span><strong>{money(total)}</strong></div>
          <Button className="w-full min-h-12" disabled={!canCheckout} onClick={openPayment}>{quote.loading || (cart.items.length > 0 && !quoteMatchesCart && !quote.error) ? 'Đang tính tiền…' : 'Thanh toán'}<ArrowRight size={17} /></Button><p className="cart-footnote">{number(itemCount)} sản phẩm · Giá và ưu đãi được kiểm tra khi chốt đơn</p>
        </div>
      </section>
    </div>
    <div className="mobile-cart-bar"><span><ShoppingBag size={18} />{itemCount} sản phẩm <strong>{money(total)}</strong></span><Button size="sm" onClick={() => document.getElementById('pos-cart').scrollIntoView({ behavior: 'smooth' })}>Xem giỏ hàng</Button></div>
    {clearConfirm && <ConfirmDialog title="Xóa giỏ hàng hiện tại?" description="Các sản phẩm đã chọn sẽ được bỏ khỏi giỏ." onClose={() => setClearConfirm(false)} onConfirm={async () => clearCart()} />}
    {newCustomer && <CustomerForm onClose={() => setNewCustomer(false)} onSaved={customer => { selectCustomer(customer); notify('Đã thêm khách hàng vào giao dịch.'); }} />}
    {paymentOpen && <FormModal title="Xác nhận thanh toán" description="Kiểm tra số tiền và xác nhận đã nhận thanh toán trước khi lập hóa đơn." onClose={() => setPaymentOpen(false)} onSubmit={checkout} submitLabel={pending ? 'Gửi lại đúng giao dịch' : 'Xác nhận và lập hóa đơn'} submitDisabled={!pending && (method === 'CASH' ? !cashEnough : !transferConfirmed)}>{errors => <><div className="payment-total"><span>Tổng thanh toán</span><strong>{money(total)}</strong></div><Field label="Hình thức thanh toán" value={method} disabled={!!pending} onChange={event => { setMethod(event.target.value); setTransferConfirmed(false); }}><option value="CASH">Tiền mặt</option><option value="BANK_TRANSFER">Chuyển khoản</option></Field>{method === 'CASH' ? <><Field label="Tiền khách đưa (VND)" inputMode="numeric" required disabled={!!pending} value={cashReceived} onChange={event => setCashReceived(event.target.value.replace(/\D/g, ''))} error={errors.cashReceived} /><div className="info-strip"><span><Banknote size={16} />Tiền thừa trả khách</span><strong>{cashEnough ? money((BigInt(cashReceived) - BigInt(total)).toString()) : 'Chưa đủ tiền'}</strong></div></> : <><Field label="Mã tham chiếu chuyển khoản" disabled={!!pending} value={transferReference} onChange={event => setTransferReference(event.target.value)} /><label className="checkbox-row"><input type="checkbox" checked={transferConfirmed} disabled={!!pending} onChange={event => setTransferConfirmed(event.target.checked)} /><CreditCard size={17} /><span>Tôi xác nhận đã nhận đủ tiền chuyển khoản.</span></label></>}{pending && <div className="form-alert">Đang giữ nguyên yêu cầu đã xác nhận. Gửi lại để kiểm tra kết quả an toàn.</div>}</>}</FormModal>}
  </>;
}
