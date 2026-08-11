# Endpoints disponibles

Base URL: `http://localhost:4000/api`

| Método | Ruta | Función |
|---|---|---|
| GET | `/health` | Estado del servidor |
| POST | `/auth/login` | Inicio de sesión demostrativo |
| GET/POST | `/products` | Listar o crear productos |
| GET | `/products/barcode/:barcode` | Buscar por código de barras |
| GET/PUT/DELETE | `/products/:id` | Consultar, editar o desactivar |
| GET/POST | `/sales` | Listar o registrar ventas |
| GET | `/sales/:id` | Detalle de venta |
| POST | `/inventory/adjust` | Entrada o salida manual |
| GET | `/inventory/movements` | Historial de stock |
| GET | `/inventory/low-stock` | Productos por reponer |
| GET/POST | `/purchases` | Listar o registrar compras |
| POST | `/purchases/document` | Recibir documento en memoria |
| GET/POST | `/expenses` | Listar o registrar gastos |
| DELETE | `/expenses/:id` | Eliminar gasto |
| GET | `/reports/summary` | Ingresos, costos y ganancia |
| GET | `/reports/top-products` | Productos más vendidos |
| GET | `/dashboard` | Datos del panel principal |

## Ejemplo de venta

```json
{
  "items": [
    { "productId": "p1", "quantity": 2 }
  ],
  "paymentMethod": "Efectivo",
  "received": 20
}
```
