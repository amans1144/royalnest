import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@spb/types';

export interface ApiClientOptions {
  baseURL: string;
  getAccessToken?: () => string | null | undefined;
  onUnauthorized?: () => Promise<string | null> | string | null; // refresh hook
}

/**
 * Typed Axios client with:
 *  - bearer token injection,
 *  - a single-flight 401 → refresh → retry interceptor,
 *  - response unwrapping to the raw `data` payload.
 */
export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseURL,
    withCredentials: true,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = options.getAccessToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  let refreshing: Promise<string | null> | null = null;

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config as AxiosRequestConfig & { _retried?: boolean };
      const status = error.response?.status;

      if (status === 401 && options.onUnauthorized && !original._retried) {
        original._retried = true;
        refreshing ??= Promise.resolve(options.onUnauthorized()).finally(() => {
          refreshing = null;
        });
        const newToken = await refreshing;
        if (newToken) {
          original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
          return client(original);
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

/** Unwrap `{ success, data }` envelopes to the inner payload. */
export function unwrap<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data;
}
