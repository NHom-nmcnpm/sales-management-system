import * as service from './employees.service.js';
export async function list(request, response) { response.json(await service.listEmployees(request.validated.query)); }
export async function detail(request, response) { response.json({ data: await service.getEmployee(request.validated.params.id) }); }
export async function create(request, response) { response.status(201).json({ data: await service.createEmployee(request.validated.body) }); }
export async function update(request, response) { response.json({ data: await service.updateEmployee(request.validated.params.id, request.validated.body) }); }
export async function reset(request, response) { await service.resetEmployeePassword(request.validated.params.id, request.validated.body.password); response.json({ data: { message: 'Đã đặt lại mật khẩu và thu hồi các phiên đăng nhập.' } }); }
