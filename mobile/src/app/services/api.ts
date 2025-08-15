import auth from '@react-native-firebase/auth';

const SERVER_URL = 'https://circlebuy-server.onrender.com';

async function getAuthToken() {
  const user = auth().currentUser;
  if (!user) throw new Error('Not authenticated');
  return await user.getIdToken();
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const response = await fetch(`${SERVER_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const productRequestsApi = {
  
  create: (data: { productName: string; description: string; contactDetails: string }) =>
    apiRequest('/product-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (status?: string) =>
    apiRequest(`/product-requests${status ? `?status=${status}` : ''}`),

  approve: (id: string) =>
    apiRequest(`/product-requests/${id}/approve`, { method: 'PUT' }),

  reject: (id: string, reason: string) =>
    apiRequest(`/product-requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
};

export const lostItemsApi = {
  create: (data: { itemName: string; description: string; contactDetails: string }) =>
    apiRequest('/lost-items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (status?: string) =>
    apiRequest(`/lost-items${status ? `?status=${status}` : ''}`),

  approve: (id: string) =>
    apiRequest(`/lost-items/${id}/approve`, { method: 'PUT' }),

  reject: (id: string, reason: string) =>
    apiRequest(`/lost-items/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
};

export const donationsApi = {
  create: (data: { itemName: string; description: string; contactDetails: string }) =>
    apiRequest('/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (status?: string) =>
    apiRequest(`/donations${status ? `?status=${status}` : ''}`),

  approve: (id: string) =>
    apiRequest(`/donations/${id}/approve`, { method: 'PUT' }),

  reject: (id: string, reason: string) =>
    apiRequest(`/donations/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
};

export const productsApi = {
  markAsSold: (id: string) =>
    apiRequest(`/products/${id}/mark-sold`, { method: 'PUT' }),
};

export const messagesApi = {
  send: (data: { receiverId: string; productId?: string; message: string }) =>
    apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (chatWith?: string) =>
    apiRequest(`/messages${chatWith ? `?chatWith=${chatWith}` : ''}`),
};

export const superAdminApi = {
  getStats: () => apiRequest('/super-admin/stats'),
  
  getMarketplaces: () => apiRequest('/marketplaces'),
  
  createMarketplace: (data: { name: string; domain: string; adminEmail: string }) =>
    apiRequest('/marketplaces/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  deleteMarketplace: (id: string) =>
    apiRequest(`/marketplaces/${id}`, { method: 'DELETE' }),
  
  cleanupOrphanedData: () =>
    apiRequest('/cleanup-orphaned-data', { method: 'POST' }),
  
  migrateUsers: () =>
    apiRequest('/migrate-users', { method: 'POST' }),
};