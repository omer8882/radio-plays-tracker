// Production uses the frontend's same-origin /api proxy. This avoids making
// browser requests depend on cross-origin Cloudflare Access/CORS policy.
// Local `npm start` continues to talk directly to the development API.
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
