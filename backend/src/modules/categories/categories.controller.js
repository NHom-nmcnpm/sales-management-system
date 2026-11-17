import * as service from './categories.service.js';
export async function list(request, response) { response.json(await service.listCategories(request.validated.query, request.user)); }
export async function create(request, response) { response.status(201).json({ data: await service.createCategory(request.validated.body) }); }
export async function update(request, response) { response.json({ data: await service.updateCategory(request.validated.params.id, request.validated.body) }); }
