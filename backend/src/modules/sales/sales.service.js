import { prisma, Prisma } from '../../prisma/client.js';
import { HttpError } from '../../utilities/http-error.js';
import { hashValue } from '../../utilities/hash.js';

export function calculateDiscount(subtotal, promotion) {
  if (!promotion) return new Prisma.Decimal(0);
  let discount =
    promotion.discountType === 'PERCENT'
      ? subtotal
          .mul(promotion.discountValue)
          .div(100)
          .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
      : new Prisma.Decimal(promotion.discountValue);
  if (promotion.maxDiscount !== null && promotion.maxDiscount !== undefined)
    discount = Prisma.Decimal.min(discount, promotion.maxDiscount);
  return Prisma.Decimal.max(0, Prisma.Decimal.min(discount, subtotal));
}

function promotionSnapshot(promotion) {
  return {
    id: promotion.id,
    code: promotion.code,
    name: promotion.name,
    discountType: promotion.discountType,
    discountValue: promotion.discountValue.toString(),
    minSubtotal: promotion.minSubtotal.toFixed(0),
    maxDiscount: promotion.maxDiscount?.toFixed(0) ?? null,
    startsAt: promotion.startsAt.toISOString(),
    endsAt: promotion.endsAt.toISOString(),
  };
}

export async function quoteSale(input, client = prisma, now = new Date()) {
  const requested = [...input.items].sort((first, second) =>
    first.productId.localeCompare(second.productId),
  );
  const products = await client.product.findMany({
    where: { id: { in: requested.map((item) => item.productId) } },
    include: { category: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const items = requested.map((item) => {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive || !product.category.isActive)
      throw new HttpError(
        409,
        'PRODUCT_UNAVAILABLE',
        'Có sản phẩm đã ngừng kinh doanh. Vui lòng kiểm tra giỏ hàng.',
      );
    if (product.stock < item.quantity)
      throw new HttpError(
        409,
        'INSUFFICIENT_STOCK',
        `${product.name} chỉ còn ${product.stock} ${product.unit}.`,
      );
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unit: product.unit,
      unitPrice: product.price.toFixed(0),
      quantity: item.quantity,
      subtotal: product.price.mul(item.quantity).toFixed(0),
    };
  });
  const subtotal = items.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
  if (subtotal.gt('999999999999999999'))
    throw new HttpError(400, 'AMOUNT_TOO_LARGE', 'Tổng tiền vượt giới hạn của hệ thống.');
  let customer = { name: 'Khách lẻ', phone: null, email: null, address: '' };
  if (input.customerId) {
    const found = await client.customer.findFirst({
      where: { id: input.customerId, isActive: true },
    });
    if (!found)
      throw new HttpError(
        409,
        'CUSTOMER_UNAVAILABLE',
        'Khách hàng đã ngừng hoạt động hoặc không tồn tại.',
      );
    customer = {
      id: found.id,
      name: found.name,
      phone: found.phone,
      email: found.email,
      address: found.address,
    };
  }
  const promotions = await client.promotion.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gt: now },
      minSubtotal: { lte: subtotal },
    },
    orderBy: { code: 'asc' },
  });
  const selected = input.promotionId
    ? promotions.find((promotion) => promotion.id === input.promotionId)
    : null;
  if (input.promotionId && !selected)
    throw new HttpError(
      409,
      'PROMOTION_UNAVAILABLE',
      'Khuyến mại không còn hiệu lực hoặc chưa đủ điều kiện áp dụng.',
    );
  const discount = calculateDiscount(subtotal, selected);
  const quote = {
    items,
    customer,
    promotion: selected ? promotionSnapshot(selected) : null,
    subtotal: subtotal.toFixed(0),
    discount: discount.toFixed(0),
    total: subtotal.sub(discount).toFixed(0),
  };
  return {
    ...quote,
    quoteHash: hashValue(quote),
    eligiblePromotions: promotions.map((promotion) => ({
      ...promotionSnapshot(promotion),
      discount: calculateDiscount(subtotal, promotion).toFixed(0),
    })),
  };
}
