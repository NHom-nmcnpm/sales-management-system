import * as service from './invoices.service.js';
export async function create(request, response) {
  const result = await service.createInvoice(request.user.id, request.idempotencyKey, request.validated.body);
  response.status(result.replayed ? 200 : 201).json({ data: result.invoice, replayed: result.replayed });
}
export async function detail(request, response) { response.json({ data: await service.getInvoice(request.validated.params.id, request.user) }); }
export async function byRequest(request, response) { response.json({ data: await service.getInvoiceByRequest(request.validated.params.key, request.user.id) }); }
export async function list(request, response) { response.json(await service.listInvoices(request.validated.query, request.user)); }
