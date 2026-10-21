// src/lib/apiClient.ts

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for uniform error response handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || 'An unexpected server error occurred.';

      // Handle Guardrail and Security Violations
      if (status === 400) {
        console.error('[Security Violation 400]:', message);
        return Promise.reject({ status, message, type: 'SECURITY_INJECTION' });
      }

      if (status === 403) {
        console.warn('[Domain Scope Guardrail 403]:', message);
        return Promise.reject({ status, message, type: 'OFF_TOPIC_GUARDRAIL' });
      }

      return Promise.reject({ status, message, type: 'API_ERROR' });
    }
    return Promise.reject({ status: 500, message: 'Network connection error.', type: 'NETWORK_ERROR' });
  }
);