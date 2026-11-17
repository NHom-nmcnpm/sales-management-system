import * as service from './inventory.service.js';
import { listProducts } from '../products/products.service.js';
export async function list(request, response) {
  response.json(await listProducts(request.validated.query, request.user));
}
export async function movements(request, response) {
  response.json(await service.listMovements(request.validated.query));
}
export async function adjust(request, response) {
  response
    .status(201)
    .json({
      data: await service.adjustStock(
        request.user.id,
        request.idempotencyKey,
        request.validated.body,
      ),
    });
}
