// Production uses the frontend's same-origin /api proxy. This avoids making
// browser requests depend on cross-origin Cloudflare Access/CORS policy.
// Local `npm start` continues to talk directly to the development API.
export const API_BASE_URL = import.meta.env.REACT_APP_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : '');
