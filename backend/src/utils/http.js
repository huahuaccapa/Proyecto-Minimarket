export class HttpError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const response = (res, data, message = 'Operación exitosa', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const required = (body, fields) => {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) throw new HttpError(400, `Faltan campos obligatorios: ${missing.join(', ')}`);
};
