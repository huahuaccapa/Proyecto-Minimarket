const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'No se pudo completar la solicitud');
  return data;
}

export const api = {
  health: () => request('/health'),
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  dashboard: () => request('/dashboard'),
  products: () => request('/products'),
  createProduct: (product) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  findBarcode: (barcode) => request(`/products/barcode/${barcode}`),
  sales: () => request('/sales'),
  createSale: (sale) => request('/sales', { method: 'POST', body: JSON.stringify(sale) }),
  adjustStock: (payload) => request('/inventory/adjust', { method: 'POST', body: JSON.stringify(payload) }),
  movements: () => request('/inventory/movements'),
  purchases: () => request('/purchases'),
  createPurchase: (purchase) => request('/purchases', { method: 'POST', body: JSON.stringify(purchase) }),
  expenses: () => request('/expenses'),
  createExpense: (expense) => request('/expenses', { method: 'POST', body: JSON.stringify(expense) }),
  report: () => request('/reports/summary'),
};
