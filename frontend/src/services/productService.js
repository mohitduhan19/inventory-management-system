import apiClient from './apiClient.js';

const RESOURCE = '/products/';

export const listProducts = (params = {}) =>
  apiClient.get(RESOURCE, { params }).then((res) => res.data);

export const getProduct = (productId) =>
  apiClient.get(`${RESOURCE}${productId}`).then((res) => res.data);

export const createProduct = (payload) =>
  apiClient.post(RESOURCE, payload).then((res) => res.data);

export const updateProduct = (productId, payload) =>
  apiClient.put(`${RESOURCE}${productId}`, payload).then((res) => res.data);

export const deleteProduct = (productId) => apiClient.delete(`${RESOURCE}${productId}`);
