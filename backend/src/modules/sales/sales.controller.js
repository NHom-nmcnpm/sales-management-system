import { quoteSale } from './sales.service.js';
export async function quote(request, response) {
  response.json({ data: await quoteSale(request.validated.body) });
}
