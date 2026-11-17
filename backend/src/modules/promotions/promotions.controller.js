import * as service from './promotions.service.js';
export async function list(request, response) {
  response.json(await service.listPromotions(request.validated.query));
}
export async function create(request, response) {
  response.status(201).json({ data: await service.createPromotion(request.validated.body) });
}
export async function update(request, response) {
  response.json({
    data: await service.updatePromotion(request.validated.params.id, request.validated.body),
  });
}
