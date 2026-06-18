import apiClient from './apiClient.js';

const RESOURCE = '/customers/';

export const listCustomers = (params = {}) =>
  apiClient.get(RESOURCE, { params }).then((res) => res.data);

export const getCustomer = (customerId) =>
  apiClient.get(`${RESOURCE}${customerId}`).then((res) => res.data);

export const createCustomer = (payload) =>
  apiClient.post(RESOURCE, payload).then((res) => res.data);

export const deleteCustomer = (customerId) => apiClient.delete(`${RESOURCE}${customerId}`);
