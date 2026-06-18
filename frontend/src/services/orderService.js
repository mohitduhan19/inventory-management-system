import apiClient from './apiClient.js';

const RESOURCE = '/orders/';

export const listOrders = (params = {}) =>
  apiClient.get(RESOURCE, { params }).then((res) => res.data);

export const getOrder = (orderId) => apiClient.get(`${RESOURCE}${orderId}`).then((res) => res.data);

export const createOrder = (payload) =>
  apiClient.post(RESOURCE, payload).then((res) => res.data);

export const deleteOrder = (orderId) => apiClient.delete(`${RESOURCE}${orderId}`);
