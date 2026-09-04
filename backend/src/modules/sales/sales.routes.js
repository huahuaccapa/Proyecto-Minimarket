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

const router =
  Router();

/*
 * Recargo fijo por bebida helada.
 */
const CHILLED_SURCHARGE =
  1;

/*
 * Normalizar texto.
 */
const normalizeText = (
  value = ''
) =>
  value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .trim()
    .toLowerCase();

/*
 * Saber si determinado producto
 * pertenece a la categoría Bebidas.
 */
const isBeverageProduct = (
  product
) => {
  const category =
    store.categories.find(
      (item) =>
        item.id ===
        product.categoryId
    );

  return (
    normalizeText(
      category?.name
    ) === 'bebidas'
  );
};

/*
 * =====================================
 * LISTAR VENTAS
 * =====================================
 */
router.get(
  '/',
  (req, res) =>
    response(
      res,
      store.sales
    )
);

/*
 * =====================================
 * OBTENER VENTA
 * =====================================
 */
router.get(
  '/:id',
  (req, res) => {
    const sale =
      store.sales.find(
        (item) =>
          item.id ===
          req.params.id
      );

    if (!sale) {
      throw new HttpError(
        404,
        'Venta no encontrada'
      );
    }

    response(
      res,
      sale
    );
  }
);

/*
 * =====================================
 * REGISTRAR VENTA
 * =====================================
 */
router.post(
  '/',
  (req, res) => {
    required(
      req.body,
      [
        'items',
        'paymentMethod',
      ]
    );

    /*
     * ===================================
     * MÉTODO DE PAGO
     * ===================================
     *
     * Por ahora únicamente aceptamos
     * EFECTIVO.
     *
     * Aunque alguien intente enviar
     * "Yape" o "Tarjeta" directamente
     * mediante la API, será rechazado.
     */
    if (
      req.body
        .paymentMethod !==
      'Efectivo'
    ) {
      throw new HttpError(
        400,
        'Por el momento solo se aceptan pagos en efectivo'
      );
    }

    /*
     * Debe existir por lo menos
     * un producto.
     */
    if (
      !Array.isArray(
        req.body.items
      ) ||
      !req.body.items.length
    ) {
      throw new HttpError(
        400,
        'La venta debe contener productos'
      );
    }

    /*
     * ===================================
     * CREAR DETALLE DE VENTA
     * ===================================
     */
    const detail =
      req.body.items.map(
        (item) => {
          const product =
            store.products.find(
              (
                candidate
              ) =>
                candidate.id ===
                  item.productId &&
                candidate.active
            );

          const quantity =
            Number(
              item.quantity
            );

          /*
           * PRODUCTO
           */
          if (!product) {
            throw new HttpError(
              404,
              `Producto no encontrado: ${item.productId}`
            );
          }

          /*
           * CANTIDAD
           */
          if (
            !Number.isFinite(
              quantity
            ) ||
            quantity <= 0
          ) {
            throw new HttpError(
              400,
              `Cantidad inválida para ${product.name}`
            );
          }

          /*
           * Productos vendidos por unidad
           * solamente aceptan enteros.
           */
          if (
            product.saleUnit ===
              'unidad' &&
            !Number.isInteger(
              quantity
            )
          ) {
            throw new HttpError(
              400,
              `${product.name} solo se vende en unidades completas`
            );
          }

          /*
           * STOCK
           */
          if (
            product.stock <
            quantity
          ) {
            throw new HttpError(
              409,
              `Stock insuficiente para ${product.name}`
            );
          }

          /*
           * =================================
           * BEBIDA HELADA
           * =================================
           */
          const isChilled =
            item.isChilled ===
            true;

          const isBeverage =
            isBeverageProduct(
              product
            );

          /*
           * Protección:
           * solamente las bebidas pueden
           * tener recargo por frío.
           */
          if (
            isChilled &&
            !isBeverage
          ) {
            throw new HttpError(
              400,
              'El recargo por bebida helada solo aplica a productos de la categoría Bebidas'
            );
          }

          const chilledSurcharge =
            isChilled
              ? CHILLED_SURCHARGE
              : 0;

          /*
           * PRECIO BASE
           */
          const baseUnitPrice =
            Number(
              product.salePrice
            );

          /*
           * PRECIO FINAL
           */
          const unitPrice =
            Number(
              (
                baseUnitPrice +
                chilledSurcharge
              ).toFixed(
                2
              )
            );

          /*
           * COSTO DEL PRODUCTO
           */
          const unitCost =
            Number(
              product.unitCost ??
                product.purchasePrice ??
                0
            );

          return {
            productId:
              product.id,

            barcode:
              product.barcode,

            name:
              product.name,

            saleUnit:
              product.saleUnit,

            quantity,

            /*
             * Precio registrado originalmente.
             */
            baseUnitPrice,

            /*
             * Bebida helada.
             */
            isChilled,

            /*
             * Recargo.
             */
            chilledSurcharge,

            /*
             * Precio vendido.
             */
            unitPrice,

            /*
             * Costo.
             */
            unitCost,

            /*
             * Subtotal.
             */
            subtotal:
              Number(
                (
                  unitPrice *
                  quantity
                ).toFixed(
                  2
                )
              ),
          };
        }
      );

    /*
     * ===================================
     * TOTAL
     * ===================================
     */
    const total =
      Number(
        detail
          .reduce(
            (
              sum,
              item
            ) =>
              sum +
              item.subtotal,

            0
          )
          .toFixed(
            2
          )
      );

    /*
     * ===================================
     * COSTO TOTAL
     * ===================================
     */
    const cost =
      Number(
        detail
          .reduce(
            (
              sum,
              item
            ) =>
              sum +
              item.unitCost *
                item.quantity,

            0
          )
          .toFixed(
            2
          )
      );

    /*
     * ===================================
     * EFECTIVO RECIBIDO
     * ===================================
     */
    const received =
      Number(
        req.body.received
      );

    if (
      !Number.isFinite(
        received
      ) ||
      received < 0
    ) {
      throw new HttpError(
        400,
        'Ingresa un monto de efectivo válido'
      );
    }

    /*
     * Comprobar que el cliente entregó
     * suficiente dinero.
     */
    if (
      received <
      total
    ) {
      throw new HttpError(
        400,
        'El efectivo recibido es menor al total'
      );
    }

    /*
     * ===================================
     * VUELTO
     * ===================================
     */
    const change =
      Number(
        (
          received -
          total
        ).toFixed(
          2
        )
      );

    /*
     * ===================================
     * DESCONTAR INVENTARIO
     * ===================================
     */
    detail.forEach(
      (item) => {
        const product =
          store.products.find(
            (
              candidate
            ) =>
              candidate.id ===
              item.productId
          );

        product.stock =
          Number(
            (
              product.stock -
              item.quantity
            ).toFixed(
              3
            )
          );

        /*
         * Registrar movimiento.
         */
        store.inventoryMovements.push(
          {
            id:
              randomUUID(),

            productId:
              product.id,

            productName:
              product.name,

            type:
              'salida',

            quantity:
              item.quantity,

            reason:
              'Venta',

            stockAfter:
              product.stock,

            date:
              new Date().toISOString(),
          }
        );
      }
    );

    /*
     * ===================================
     * CREAR VENTA
     * ===================================
     */
    const sale = {
      id:
        randomUUID(),

      number:
        nextNumber(
          'V',
          store.sales
        ),

      date:
        new Date().toISOString(),

      total,

      cost,

      /*
       * Por ahora siempre será:
       * Efectivo
       */
      paymentMethod:
        'Efectivo',

      /*
       * Dinero entregado.
       */
      received,

      /*
       * Vuelto entregado.
       */
      change,

      /*
       * Cantidad de productos vendidos.
       */
      items:
        detail.reduce(
          (
            sum,
            item
          ) =>
            sum +
            item.quantity,

          0
        ),

      /*
       * Detalle de productos.
       */
      detail,
    };

    /*
     * GUARDAR VENTA
     */
    store.sales.push(
      sale
    );

    response(
      res,
      sale,
      'Venta registrada',
      201
    );
  }
);

export default router;