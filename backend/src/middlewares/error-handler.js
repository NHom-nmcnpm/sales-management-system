import { HttpError } from '../utilities/http-error.js';
import { env } from '../config/env.js';

export function errorHandler(error, request, response, _next) {
  let failure = error;
  if (error.code === 'P2002')
    failure = new HttpError(409, 'DUPLICATE', 'Thông tin đã tồn tại. Vui lòng kiểm tra lại.');
  if (error.code === 'P2025') failure = new HttpError(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu.');
  if (error.code === 'P2003')
    failure = new HttpError(409, 'REFERENCED_DATA', 'Dữ liệu liên quan không còn hợp lệ.');
  if (error.code === 'P2034')
    failure = new HttpError(
      503,
      'RETRY_LATER',
      'Hệ thống đang xử lý giao dịch khác. Vui lòng thử lại.',
    );
  if (error.type === 'entity.parse.failed')
    failure = new HttpError(400, 'INVALID_JSON', 'Nội dung JSON không hợp lệ.');
  if (error.type === 'entity.too.large')
    failure = new HttpError(413, 'REQUEST_TOO_LARGE', 'Nội dung gửi lên quá lớn.');
  if (!(failure instanceof HttpError)) {
    if (env.NODE_ENV !== 'test')
      console.error(
        JSON.stringify({ requestId: request.id, name: error.name, code: error.code ?? 'UNKNOWN' }),
      );
    failure = new HttpError(500, 'INTERNAL_ERROR', 'Có lỗi hệ thống. Vui lòng thử lại sau.');
  }
  response
    .status(failure.status)
    .json({
      code: failure.code,
      message: failure.message,
      fieldErrors: failure.fieldErrors,
      requestId: request.id,
    });
}
