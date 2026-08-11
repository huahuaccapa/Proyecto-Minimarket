import './globals.css';

export const metadata = {
  title: 'Minimarket Mamá',
  description: 'Ventas, productos, inventario y ganancias del minimarket',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
