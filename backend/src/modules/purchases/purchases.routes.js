import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { nextNumber, store } from '../../data/store.js';
import { HttpError, required, response } from '../../utils/http.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', (req, res) => response(res, store.purchases));

router.post('/', (req, res) => {
  required(req.body, ['supplier', 'date', 'total', 'items']);
  const purchase = { id: randomUUID(), number: nextNumber('C', store.purchases), supplier: req.body.supplier, date: req.body.date, total: Number(req.body.total), items: Number(req.body.items), document: req.body.document || '', createdAt: new Date().toISOString() };
  if (purchase.total < 0 || purchase.items <= 0) throw new HttpError(400, 'Monto o cantidad inválidos');
  store.purchases.push(purchase);
  response(res, purchase, 'Compra registrada', 201);
});

router.post('/document', upload.single('document'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Selecciona un documento');
  response(res, { filename: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size }, 'Documento recibido en memoria', 201);
});

export default router;
