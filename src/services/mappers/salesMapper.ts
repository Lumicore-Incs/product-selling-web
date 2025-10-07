import { Sale as FrontSale, SaleItem as FrontSaleItem } from '../../models/sales';

function toStringId(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    try {
      return String((value as { toString?: () => string }).toString?.() ?? value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function mapOrderItemDtoToSaleItem(detail: unknown): FrontSaleItem {
  const d = (detail ?? {}) as Record<string, unknown>;

  // safe accessor (no any)
  const get = <T = unknown>(obj: Record<string, unknown>, path: string[]): T | undefined => {
    let cur: unknown = obj;
    for (const p of path) {
      if (cur == null) return undefined;
      if (typeof cur !== 'object') return undefined;
      cur = (cur as Record<string, unknown>)[p];
    }
    return cur as T | undefined;
  };

  const productIdRaw = get(d, ['productId', 'productId']) ?? 0;
  const productName = get(d, ['productId', 'name']) ?? '';
  const qty = Number(d['qty'] ?? 0);
  const price = Number(d['price'] ?? get(d, ['productId', 'price']) ?? 0);
  const total = Number(get(d, ['productId', 'price']) ?? qty * price);

  return {
    productId: toStringId(productIdRaw),
    productName: String(productName),
    qty,
    quantity: qty,
    price,
    total,
    orderDetailsId: d['orderDetailsId'] ? toStringId(d['orderDetailsId']) : undefined,
    orderId: d['orderId'] ? toStringId(d['orderId']) : undefined,
  };
}

export function mapOrderDtoToSale(order: unknown): FrontSale {
  const ord = (order ?? {}) as Record<string, unknown>;
  const customer = (ord['customer'] ?? {}) as Record<string, unknown>;

  const rawItems = Array.isArray(ord['orderDetails']) ? (ord['orderDetails'] as unknown[]) : [];

  const items: FrontSaleItem[] = rawItems.map((r) => mapOrderItemDtoToSaleItem(r));
  const qty = items.reduce(
    (sum: number, it: FrontSaleItem) => sum + (it.qty || it.quantity || 0),
    0
  );
  const totalPrice = Number(
    ord['totalPrice'] ?? ord['totalAmount'] ?? items.reduce((s, i) => s + i.total, 0)
  );

  return {
    id: toStringId(ord['orderId'] ?? ord['id'] ?? ord['customerId'] ?? ''),
    customerId: ord['customerId'] ? toStringId(ord['customerId']) : undefined,
    name: String((customer['name'] ?? ord['name'] ?? '') as string),
    address: String((customer['address'] ?? ord['address'] ?? '') as string),
    contact01: (customer['contact01'] ?? ord['contact01'] ?? ord['contact']) as string,
    contact02: (customer['contact02'] ?? ord['contact02']) as string,
    status: String(ord['status'] ?? ''),
    qty,
    remark: String(customer['remark'] ?? ord['remark'] ?? ''),
    items,
    totalPrice,
  };
}

export default { mapOrderDtoToSale, mapOrderItemDtoToSaleItem };
