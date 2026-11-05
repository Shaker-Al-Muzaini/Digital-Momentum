export function validateOrder(order, services) {
  const service = services.find((s) => s.id === order.service_id);
  if (!service) throw Error('خدمة غير متاحة / Unknown service');
  if (
    !Number.isSafeInteger(order.quantity) ||
    order.quantity < service.min ||
    order.quantity > service.max
  )
    throw Error('الكمية خارج حدود الخدمة / Quantity outside service limits');
  if (!/^https?:\/\//i.test(order.link) || !URL.canParse(order.link))
    throw Error('رابط غير صالح / Invalid URL');
  return order;
}
export function parseBatch(text, services) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line, i) => {
      try {
        const fields = line.split('|').map((x) => x.trim());
        if (fields.length !== 3) throw Error('service | URL | quantity');
        return validateOrder(
          {
            service_id: Number(fields[0]),
            link: fields[1],
            quantity: Number(fields[2]),
          },
          services
        );
      } catch (e) {
        throw Error('#' + (i + 1) + ' · ' + e.message);
      }
    });
}
