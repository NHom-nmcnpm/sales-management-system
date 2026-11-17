# ERD

Thiết kế quan hệ được phê duyệt dưới đây. Schema và SQL constraints được hoàn thiện tại M1.

```mermaid
erDiagram
  User ||--o{ AuthSession : has
  User ||--o{ Invoice : creates
  User ||--o{ StockMovement : performs
  Category ||--o{ Product : contains
  Customer o|--o{ Invoice : purchases
  Promotion o|--o{ Invoice : applies
  Invoice ||--|{ InvoiceItem : contains
  Invoice ||--|| Payment : records
  Product ||--o{ InvoiceItem : sold_as
  Product ||--o{ StockMovement : changes
  Invoice o|--o{ StockMovement : generates
```

Money Decimal(18,0), percent Decimal, timestamps timestamptz. Snapshot invoice và item giữ lịch sử. Unique email/SKU/promotion code/phone có giá trị, unique người lập + idempotency key. FKs restrict delete. Index theo thời gian hóa đơn, người lập, khách hàng và stock movement sản phẩm.
