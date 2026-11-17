import * as service from './customers.service.js';
export async function list(request, response) { response.json(await service.listCustomers(request.validated.query, request.user)); }
export async function detail(request, response) { response.json({ data: await service.getCustomer(request.validated.params.id, request.user) }); }
export async function create(request, response) { response.status(201).json({ data: await service.createCustomer(request.validated.body) }); }
export async function update(request, response) { response.json({ data: await service.updateCustomer(request.validated.params.id, request.validated.body) }); }
