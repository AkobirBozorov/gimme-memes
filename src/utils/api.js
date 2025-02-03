// gimme-memes-frontend/src/utils/api.js
export const isProduction = import.meta.env.PROD;
export const baseApiUrl = isProduction
  ? import.meta.env.VITE_API_URL
  : "http://localhost:5000";