import * as service from './reports.service.js';
export async function overview(request, response) {
  response.json({ data: await service.overview(request.validated.query) });
}
export async function revenue(request, response) {
  response.json({ data: await service.revenueReport(request.validated.query) });
}
export async function products(request, response) {
  response.json(await service.productReport(request.validated.query));
}
