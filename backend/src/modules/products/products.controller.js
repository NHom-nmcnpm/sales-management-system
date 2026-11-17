import * as service from './products.service.js';
export async function list(request, response) { response.json(await service.listProducts(request.validated.query, request.user)); }
export async function detail(request, response) { response.json({ data: await service.getProduct(request.validated.params.id, request.user) }); }
export async function create(request, response) { response.status(201).json({ data: await service.createProduct(request.validated.body) }); }
export async function update(request, response) { response.json({ data: await service.updateProduct(request.validated.params.id, request.validated.body) }); }
