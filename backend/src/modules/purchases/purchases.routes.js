import {
  Router,
} from 'express';

import {
  randomUUID,
} from 'node:crypto';

import {
  nextNumber,
  store,
} from '../../data/store.js';

import {
  HttpError,
  required,
  response,
} from '../../utils/http.js';

const router = Router();

/*
 * Limpia textos recibidos
 * desde frontend.
 */
const clean = (
  value = ''
) =>
  String(
    value ?? ''
  ).trim();

/*
 * =====================================
 * LISTAR COMPRAS
 * =====================================
 */
router.get(
  '/',
  (req, res) =>
    response(
      res,
      store.purchases
    )
);

/*
 * =====================================
 * PROVEEDORES
 * =====================================
 */

router.get(
  '/suppliers',
  (req, res) =>
    response(
      res,
      store.suppliers
    )
);

/*
 * CREAR PROVEEDOR
 */
router.post(
  '/suppliers',
  (req, res) => {
    required(
      req.body,
      [
        'businessName',
      ]
    );

    const supplier = {
      id: randomUUID(),

      businessName:
        clean(
          req.body
            .businessName
        ),

      ruc:
        clean(
          req.body.ruc
        ),

      phone:
        clean(
          req.body.phone
        ),

      email:
        clean(
          req.body.email
        ),

      address:
        clean(
          req.body.address
        ),

      notes:
        clean(
          req.body.notes
        ),

      representatives:
        Array.isArray(
          req.body
            .representatives
        )
          ? req.body.representatives.map(
              (
                representative
              ) => ({
                id:
                  representative.id ||
                  randomUUID(),

                name:
                  clean(
                    representative.name
                  ),

                position:
                  clean(
                    representative.position
                  ),

                phone:
                  clean(
                    representative.phone
                  ),

                email:
                  clean(
                    representative.email
                  ),

                notes:
                  clean(
                    representative.notes
                  ),
              })
            )
          : [],

      active: true,

      createdAt:
        new Date().toISOString(),
    };

    if (
      !supplier.businessName
    ) {
      throw new HttpError(
        400,
        'Ingresa el nombre o razón social del proveedor'
      );
    }

    store.suppliers.unshift(
      supplier
    );

    response(
      res,
      supplier,
      'Proveedor registrado',
      201
    );
  }
);

/*
 * ACTUALIZAR PROVEEDOR
 */
router.put(
  '/suppliers/:id',
  (req, res) => {
    const index =
      store.suppliers.findIndex(
        (item) =>
          item.id ===
          req.params.id
      );

    if (index < 0) {
      throw new HttpError(
        404,
        'Proveedor no encontrado'
      );
    }

    const current =
      store.suppliers[
        index
      ];

    const updated = {
      ...current,

      businessName:
        clean(
          req.body
            .businessName ??
            current.businessName
        ),

      ruc:
        clean(
          req.body.ruc ??
            current.ruc
        ),

      phone:
        clean(
          req.body.phone ??
            current.phone
        ),

      email:
        clean(
          req.body.email ??
            current.email
        ),

      address:
        clean(
          req.body.address ??
            current.address
        ),

      notes:
        clean(
          req.body.notes ??
            current.notes
        ),

      representatives:
        Array.isArray(
          req.body
            .representatives
        )
          ? req.body.representatives.map(
              (
                representative
              ) => ({
                id:
                  representative.id ||
                  randomUUID(),

                name:
                  clean(
                    representative.name
                  ),

                position:
                  clean(
                    representative.position
                  ),

                phone:
                  clean(
                    representative.phone
                  ),

                email:
                  clean(
                    representative.email
                  ),

                notes:
                  clean(
                    representative.notes
                  ),
              })
            )
          : current.representatives,

      updatedAt:
        new Date().toISOString(),
    };

    if (
      !updated.businessName
    ) {
      throw new HttpError(
        400,
        'Ingresa el nombre o razón social del proveedor'
      );
    }

    store.suppliers[
      index
    ] = updated;

    response(
      res,
      updated,
      'Proveedor actualizado'
    );
  }
);

/*
 * =====================================
 * OBTENER DETALLE COMPRA
 * =====================================
 */

router.get(
  '/:id',
  (req, res) => {
    const purchase =
      store.purchases.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!purchase) {
      throw new HttpError(
        404,
        'Compra no encontrada'
      );
    }

    response(
      res,
      purchase
    );
  }
);

/*
 * =====================================
 * CREAR BOLETA / FACTURA
 * =====================================
 */

router.post(
  '/',
  (req, res) => {
    required(
      req.body,
      [
        'supplierId',
        'documentType',
        'documentNumber',
        'date',
        'total',
      ]
    );

    /*
     * Comprobar proveedor.
     */
    const supplier =
      store.suppliers.find(
        (item) =>
          item.id ===
          req.body
            .supplierId
      );

    if (!supplier) {
      throw new HttpError(
        404,
        'Proveedor no encontrado'
      );
    }

    const total =
      Number(
        req.body.total
      );

    const items =
      Number(
        req.body.items ||
          0
      );

    /*
     * Validar total.
     */
    if (
      !Number.isFinite(
        total
      ) ||
      total < 0
    ) {
      throw new HttpError(
        400,
        'Monto de compra inválido'
      );
    }

    /*
     * Validar cantidad.
     */
    if (
      !Number.isFinite(
        items
      ) ||
      items < 0
    ) {
      throw new HttpError(
        400,
        'Cantidad de artículos inválida'
      );
    }

    /*
     * Imagen Base64.
     *
     * Esto es temporal mientras
     * trabajemos sin BD/almacenamiento.
     */
    const documentDataUrl =
      clean(
        req.body
          .documentDataUrl
      );

    /*
     * Control adicional para evitar
     * archivos demasiado grandes.
     */
    if (
      documentDataUrl.length >
      2_500_000
    ) {
      throw new HttpError(
        413,
        'La imagen del documento es demasiado grande'
      );
    }

    const purchase = {
      id: randomUUID(),

      number:
        nextNumber(
          'C',
          store.purchases
        ),

      /*
       * Relación con proveedor.
       */
      supplierId:
        supplier.id,

      supplier:
        supplier.businessName,

      /*
       * Datos del documento.
       */
      documentType:
        clean(
          req.body
            .documentType
        ),

      documentNumber:
        clean(
          req.body
            .documentNumber
        ),

      date:
        req.body.date,

      total,

      items,

      currency:
        clean(
          req.body.currency ||
            'PEN'
        ),

      notes:
        clean(
          req.body.notes
        ),

      /*
       * Imagen.
       */
      documentName:
        clean(
          req.body
            .documentName
        ),

      documentMimeType:
        clean(
          req.body
            .documentMimeType
        ),

      documentDataUrl,

      createdAt:
        new Date().toISOString(),
    };

    /*
     * La más reciente aparece
     * primero.
     */
    store.purchases.unshift(
      purchase
    );

    response(
      res,
      purchase,
      'Documento de compra registrado',
      201
    );
  }
);

export default router;