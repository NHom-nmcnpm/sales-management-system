import { z } from 'zod';
import {
  loginSchema,
  profileSchema,
  changePasswordSchema,
} from '../modules/auth/auth.validators.js';
import {
  categoryCreate,
  categoryUpdate,
  categoryQuery,
} from '../modules/categories/categories.validators.js';
import {
  productCreate,
  productUpdate,
  productQuery,
} from '../modules/products/products.validators.js';
import {
  customerCreate,
  customerUpdate,
  customerQuery,
} from '../modules/customers/customers.validators.js';
import {
  employeeCreate,
  employeeUpdate,
  employeeQuery,
  resetPassword,
} from '../modules/employees/employees.validators.js';
import {
  promotionCreate,
  promotionUpdate,
  promotionQuery,
} from '../modules/promotions/promotions.validators.js';
import { adjustmentSchema, movementQuery } from '../modules/inventory/inventory.validators.js';
import { saleInput } from '../modules/sales/sales.validators.js';
import { invoiceCreate, invoiceQuery } from '../modules/invoices/invoices.validators.js';
import { revenueQuery, productReportQuery } from '../modules/reports/reports.validators.js';

const reference = (name) => ({ $ref: `#/components/schemas/${name}` });
const identifier = { type: 'string', format: 'uuid' };
const timestamp = { type: 'string', format: 'date-time' };
const nullableString = { type: ['string', 'null'] };

function inputSchema(schema) {
  const json = z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' });
  delete json.$schema;
  return json;
}

function dataResponse(schema) {
  return {
    type: 'object',
    required: ['data'],
    properties: { data: typeof schema === 'string' ? reference(schema) : schema },
  };
}

function listResponse(schema) {
  return {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: { type: 'array', items: reference(schema) },
      pagination: reference('Pagination'),
    },
  };
}

function operation(summary, options = {}) {
  const {
    body,
    query,
    response = dataResponse('Message'),
    manager = false,
    write = false,
    publicAccess = false,
    params = [],
    idempotent = false,
    status = 200,
  } = options;
  const parameters = params.map((name) => ({
    in: 'path',
    name,
    required: true,
    schema: identifier,
  }));
  if (query) {
    const json = inputSchema(query);
    for (const [name, schema] of Object.entries(json.properties))
      parameters.push({
        in: 'query',
        name,
        required: json.required?.includes(name) ?? false,
        schema,
      });
  }
  if (idempotent)
    parameters.push({
      in: 'header',
      name: 'Idempotency-Key',
      required: true,
      schema: identifier,
      description: 'UUID giữ nguyên khi gửi lại đúng giao dịch. Key gắn với người lập.',
    });
  const success = {
    description: 'Thành công.',
    content: { 'application/json': { schema: response } },
  };
  const error = {
    description:
      'Yêu cầu không hợp lệ, phiên/quyền không đủ, xung đột nghiệp vụ, quá giới hạn hoặc lỗi dịch vụ.',
    content: { 'application/json': { schema: reference('Error') } },
  };
  return {
    summary,
    description: `${manager ? 'Quyền MANAGER. ' : ''}${write && !publicAccess ? 'Cần Origin hợp lệ, JSON và X-CSRF-Token từ phiên hiện tại. ' : ''}${idempotent ? 'Cùng key/nội dung trả bản ghi đã có, khác nội dung trả 409.' : ''}`,
    security: publicAccess ? [] : [write ? { cookieAuth: [], csrfToken: [] } : { cookieAuth: [] }],
    parameters,
    ...(body
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: inputSchema(body) } },
          },
        }
      : {}),
    responses: {
      [status]: success,
      ...(idempotent ? { 200: success } : {}),
      400: error,
      401: error,
      403: error,
      404: error,
      409: error,
      429: error,
      500: error,
      503: error,
    },
  };
}

const schemas = {
  Money: {
    type: 'string',
    pattern: '^\\d+$',
    description: 'Số nguyên VND, chuỗi để giữ chính xác.',
  },
  Message: { type: 'object', properties: { message: { type: 'string' } } },
  Error: {
    type: 'object',
    required: ['code', 'message', 'requestId'],
    properties: {
      code: { type: 'string' },
      message: { type: 'string' },
      requestId: identifier,
      fieldErrors: { type: 'object', additionalProperties: { type: 'string' } },
    },
  },
  Pagination: {
    type: 'object',
    required: ['page', 'pageSize', 'total', 'totalPages'],
    properties: {
      page: { type: 'integer' },
      pageSize: { type: 'integer', maximum: 100 },
      total: { type: 'integer' },
      totalPages: { type: 'integer' },
    },
  },
  User: {
    type: 'object',
    required: ['id', 'email', 'name', 'role', 'isActive'],
    properties: {
      id: identifier,
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['MANAGER', 'STAFF'] },
      isActive: { type: 'boolean' },
      createdAt: timestamp,
    },
  },
  Session: {
    type: 'object',
    required: ['user', 'csrfToken'],
    properties: { user: reference('User'), csrfToken: { type: 'string' } },
  },
  Category: {
    type: 'object',
    required: ['id', 'name', 'isActive'],
    properties: {
      id: identifier,
      name: { type: 'string' },
      description: { type: 'string' },
      isActive: { type: 'boolean' },
      _count: { type: 'object', properties: { products: { type: 'integer' } } },
    },
  },
  Product: {
    type: 'object',
    required: ['id', 'sku', 'name', 'price', 'stock'],
    properties: {
      id: identifier,
      sku: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      unit: { type: 'string' },
      categoryId: identifier,
      category: reference('Category'),
      price: reference('Money'),
      stock: { type: 'integer', minimum: 0 },
      lowStockThreshold: { type: 'integer' },
      isActive: { type: 'boolean' },
    },
  },
  Customer: {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: identifier,
      name: { type: 'string' },
      phone: nullableString,
      email: nullableString,
      address: { type: 'string' },
      isActive: { type: 'boolean' },
      summary: {
        type: 'object',
        description: 'Chỉ MANAGER.',
        properties: {
          invoiceCount: { type: 'integer' },
          totalSpent: reference('Money'),
          lastPurchaseAt: { type: ['string', 'null'], format: 'date-time' },
        },
      },
    },
  },
  Promotion: {
    type: 'object',
    properties: {
      id: identifier,
      code: { type: 'string' },
      name: { type: 'string' },
      discountType: { type: 'string', enum: ['PERCENT', 'FIXED'] },
      discountValue: { type: 'string' },
      minSubtotal: reference('Money'),
      maxDiscount: { type: ['string', 'null'] },
      startsAt: timestamp,
      endsAt: timestamp,
      isActive: { type: 'boolean' },
      discount: reference('Money'),
    },
  },
  Movement: {
    type: 'object',
    properties: {
      id: identifier,
      productId: identifier,
      actorId: identifier,
      invoiceId: { type: ['string', 'null'], format: 'uuid' },
      kind: { type: 'string', enum: ['OPENING', 'ADJUSTMENT', 'SALE'] },
      delta: { type: 'integer' },
      quantityAfter: { type: 'integer', minimum: 0 },
      reason: { type: 'string' },
      createdAt: timestamp,
      product: reference('Product'),
      actor: { type: 'object', properties: { name: { type: 'string' } } },
    },
  },
  InvoiceItem: {
    type: 'object',
    properties: {
      id: identifier,
      productId: identifier,
      sku: { type: 'string' },
      name: { type: 'string' },
      unit: { type: 'string' },
      quantity: { type: 'integer', minimum: 1 },
      unitPrice: reference('Money'),
      subtotal: reference('Money'),
    },
  },
  Payment: {
    type: 'object',
    properties: {
      method: { type: 'string', enum: ['CASH', 'BANK_TRANSFER'] },
      amount: reference('Money'),
      cashReceived: { type: ['string', 'null'] },
      change: reference('Money'),
      transferReference: nullableString,
    },
  },
  Invoice: {
    type: 'object',
    required: ['id', 'number', 'total', 'paidAt', 'payment'],
    properties: {
      id: identifier,
      number: { type: 'integer' },
      code: { type: 'string' },
      status: { type: 'string', enum: ['PAID'] },
      paidAt: timestamp,
      subtotal: reference('Money'),
      discount: reference('Money'),
      total: reference('Money'),
      customerSnapshot: {
        type: 'object',
        properties: {
          id: identifier,
          name: { type: 'string' },
          phone: nullableString,
          email: nullableString,
          address: { type: 'string' },
        },
      },
      promotionSnapshot: { anyOf: [reference('Promotion'), { type: 'null' }] },
      createdBy: { type: 'object', properties: { id: identifier, name: { type: 'string' } } },
      items: { type: 'array', items: reference('InvoiceItem') },
      payment: reference('Payment'),
    },
  },
  Quote: {
    type: 'object',
    required: ['items', 'subtotal', 'discount', 'total', 'quoteHash', 'eligiblePromotions'],
    properties: {
      items: { type: 'array', items: reference('InvoiceItem') },
      customer: { type: 'object' },
      promotion: { anyOf: [reference('Promotion'), { type: 'null' }] },
      subtotal: reference('Money'),
      discount: reference('Money'),
      total: reference('Money'),
      quoteHash: { type: 'string', pattern: '^[a-f0-9]{64}$' },
      eligiblePromotions: { type: 'array', items: reference('Promotion') },
    },
  },
  Overview: {
    type: 'object',
    properties: {
      from: { type: 'string', format: 'date' },
      to: { type: 'string', format: 'date' },
      revenue: reference('Money'),
      discount: reference('Money'),
      invoiceCount: { type: 'integer' },
      unitsSold: { type: 'string' },
      lowStockCount: { type: 'integer' },
      recentInvoices: { type: 'array', items: reference('Invoice') },
    },
  },
  RevenueReport: {
    type: 'object',
    properties: {
      from: { type: 'string', format: 'date' },
      to: { type: 'string', format: 'date' },
      groupBy: { type: 'string', enum: ['day', 'month', 'year'] },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            period: { type: 'string', format: 'date' },
            revenue: reference('Money'),
            invoiceCount: { type: 'integer' },
          },
        },
      },
    },
  },
  ProductReport: {
    type: 'object',
    properties: {
      id: identifier,
      name: { type: 'string' },
      sku: { type: 'string' },
      quantity: { type: 'string' },
      subtotal: reference('Money'),
    },
  },
};

const paths = {
  '/auth/login': {
    post: operation('Đăng nhập, đặt cookie HttpOnly tám giờ', {
      body: loginSchema,
      publicAccess: true,
      response: dataResponse('Session'),
    }),
  },
  '/auth/me': {
    get: operation('Thông tin người dùng và CSRF của phiên', { response: dataResponse('Session') }),
  },
  '/auth/csrf': {
    get: operation('Lấy CSRF token', {
      response: dataResponse({ type: 'object', properties: { csrfToken: { type: 'string' } } }),
    }),
  },
  '/auth/logout': { post: operation('Đăng xuất và thu hồi phiên', { write: true }) },
  '/auth/profile': {
    patch: operation('Cập nhật họ tên của chính mình', {
      body: profileSchema,
      write: true,
      response: dataResponse('User'),
    }),
  },
  '/auth/change-password': {
    post: operation('Đổi mật khẩu và thu hồi mọi phiên của mình', {
      body: changePasswordSchema,
      write: true,
    }),
  },
  '/employees/{id}/reset-password': {
    post: operation('Đặt lại mật khẩu STAFF và thu hồi phiên', {
      params: ['id'],
      body: resetPassword,
      manager: true,
      write: true,
    }),
  },
  '/inventory': {
    get: operation('Danh sách tồn kho', {
      query: productQuery,
      manager: true,
      response: listResponse('Product'),
    }),
  },
  '/inventory/movements': {
    get: operation('Sổ biến động tồn kho', {
      query: movementQuery,
      manager: true,
      response: listResponse('Movement'),
    }),
  },
  '/inventory/adjustments': {
    post: operation('Điều chỉnh tồn có lý do và chống lặp', {
      body: adjustmentSchema,
      manager: true,
      write: true,
      idempotent: true,
      status: 201,
      response: dataResponse('Movement'),
    }),
  },
  '/sales/quote': {
    post: operation('Tính giá và ưu đãi từ database', {
      body: saleInput,
      write: true,
      response: dataResponse('Quote'),
    }),
  },
  '/invoices': {
    get: operation('Tra hóa đơn, STAFF giới hạn người lập', {
      query: invoiceQuery,
      response: listResponse('Invoice'),
    }),
    post: operation('Chốt hóa đơn, thanh toán và kho trong transaction', {
      body: invoiceCreate,
      write: true,
      idempotent: true,
      status: 201,
      response: dataResponse('Invoice'),
    }),
  },
  '/invoices/{id}': {
    get: operation('Chi tiết snapshot hóa đơn theo quyền', {
      params: ['id'],
      response: dataResponse('Invoice'),
    }),
  },
  '/invoices/by-request/{key}': {
    get: operation('Tra key thuộc chính người đang đăng nhập, kể cả MANAGER', {
      params: ['key'],
      response: dataResponse('Invoice'),
    }),
  },
  '/customers/{id}/invoices': {
    get: operation('Lịch sử mua của khách hàng', {
      params: ['id'],
      query: invoiceQuery,
      manager: true,
      response: listResponse('Invoice'),
    }),
  },
  '/reports/overview': {
    get: operation('KPI và các giao dịch gần đây', {
      query: revenueQuery,
      manager: true,
      response: dataResponse('Overview'),
    }),
  },
  '/reports/revenue': {
    get: operation('Doanh thu ngày/tháng/năm theo giờ Việt Nam', {
      query: revenueQuery,
      manager: true,
      response: dataResponse('RevenueReport'),
    }),
  },
  '/reports/products': {
    get: operation('Số lượng bán và thành tiền trước giảm theo sản phẩm', {
      query: productReportQuery,
      manager: true,
      response: listResponse('ProductReport'),
    }),
  },
  '/health/live': {
    get: operation('Liveness', {
      publicAccess: true,
      response: dataResponse({ type: 'object', properties: { status: { const: 'ok' } } }),
    }),
  },
  '/health/ready': {
    get: operation('Readiness với PostgreSQL', {
      publicAccess: true,
      response: dataResponse({ type: 'object', properties: { status: { const: 'ready' } } }),
    }),
  },
};

const resources = [
  {
    path: '/categories',
    name: 'Category',
    create: categoryCreate,
    update: categoryUpdate,
    query: categoryQuery,
    label: 'danh mục',
  },
  {
    path: '/products',
    name: 'Product',
    create: productCreate,
    update: productUpdate,
    query: productQuery,
    label: 'sản phẩm',
    detail: true,
  },
  {
    path: '/customers',
    name: 'Customer',
    create: customerCreate,
    update: customerUpdate,
    query: customerQuery,
    label: 'khách hàng',
    detail: true,
    staffCreate: true,
  },
  {
    path: '/employees',
    name: 'User',
    create: employeeCreate,
    update: employeeUpdate,
    query: employeeQuery,
    label: 'nhân viên STAFF',
    detail: true,
    managerRead: true,
  },
  {
    path: '/promotions',
    name: 'Promotion',
    create: promotionCreate,
    update: promotionUpdate,
    query: promotionQuery,
    label: 'khuyến mại',
    managerRead: true,
  },
];
for (const resource of resources) {
  paths[resource.path] = {
    get: operation(`Danh sách ${resource.label}`, {
      query: resource.query,
      manager: resource.managerRead,
      response: listResponse(resource.name),
    }),
    post: operation(`Tạo ${resource.label}`, {
      body: resource.create,
      manager: !resource.staffCreate,
      write: true,
      status: 201,
      response: dataResponse(resource.name),
    }),
  };
  paths[`${resource.path}/{id}`] = {
    ...(resource.detail
      ? {
          get: operation(`Chi tiết ${resource.label}`, {
            params: ['id'],
            manager: resource.managerRead,
            response: dataResponse(resource.name),
          }),
        }
      : {}),
    patch: operation(`Cập nhật ${resource.label}, bảo toàn trường không gửi`, {
      params: ['id'],
      body: resource.update,
      manager: true,
      write: true,
      response: dataResponse(resource.name),
    }),
  };
}

export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Sổ Bán Hàng API',
    version: '1.0.0',
    description:
      'Một cửa hàng, VND, Asia/Ho_Chi_Minh. Đăng nhập ở giao diện trước khi dùng Try it out. Giao dịch PAID bất biến, giá backend, Decimal và idempotency theo người lập.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'sales_session' },
      csrfToken: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' },
    },
    schemas,
  },
  paths,
};
