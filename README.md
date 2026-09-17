# 🏪 Proyecto Minimarket Mamá

<p align="center">
  <img src="https://via.placeholder.com/1200x420?text=Proyecto+Minimarket+Mama" alt="Portada Proyecto Minimarket Mamá" width="100%">
</p>

<p align="center">
  <strong>Sistema web integral para la gestión de un minimarket</strong><br>
  Ventas · Caja · Inventario · Compras · Clientes · Créditos · Reportes · Proveedores
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Next.js%2016-black?logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Database-MySQL%208.4-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel" alt="Vercel">
  <img src="https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black" alt="Render">
  <img src="https://img.shields.io/badge/Database-Aiven-FF355E" alt="Aiven">
  <img src="https://img.shields.io/badge/Estado-En%20Desarrollo-yellow" alt="Estado">
</p>

---

## 📑 Índice

- [Descripción del Proyecto](#-descripción-del-proyecto)
- [Estado del proyecto](#-estado-del-proyecto)
- [Demostración de funciones y aplicaciones](#-demostración-de-funciones-y-aplicaciones)
- [Acceso al Proyecto](#-acceso-al-proyecto)
- [Tecnologías utilizadas](#-tecnologías-utilizadas)
- [Personas Contribuyentes](#-personas-contribuyentes)
- [Personas Desarrolladoras del Proyecto](#-personas-desarrolladoras-del-proyecto)
- [Licencia](#-licencia)

---

# 📌 Descripción del Proyecto

**Proyecto Minimarket Mamá** es una plataforma web desarrollada para digitalizar y centralizar las operaciones principales de un minimarket.

El sistema permite administrar de manera integrada:

- 🛒 Ventas
- 💵 Caja
- 📦 Productos
- 📊 Inventario
- 🚚 Compras
- 🏢 Proveedores
- 👥 Clientes
- 💳 Créditos
- 💸 Gastos
- 📈 Reportes
- 👤 Usuarios
- ⚙️ Configuración del negocio

El objetivo principal del sistema es reemplazar procesos manuales, reducir errores, mejorar el control de stock, optimizar el manejo de caja y disponer de información centralizada para la toma de decisiones.

La solución está construida con una arquitectura separada entre frontend, backend y base de datos.

```text
┌────────────────────────────────────┐
│              FRONTEND              │
│                                    │
│       Next.js 16 + React 19        │
│                                    │
│              Vercel                │
└─────────────────┬──────────────────┘
                  │
                  │ HTTPS
                  ▼
┌────────────────────────────────────┐
│              BACKEND               │
│                                    │
│        Node.js + Express 5         │
│                                    │
│              Render                │
└─────────────────┬──────────────────┘
                  │
                  │ SSL / TLS
                  ▼
┌────────────────────────────────────┐
│          BASE DE DATOS             │
│                                    │
│             MySQL 8.4              │
│                                    │
│              Aiven                 │
└────────────────────────────────────┘
🟡 EN DESARROLLO / FUNCIONAL
