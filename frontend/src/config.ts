// In production, use relative URLs (same origin)
// In development, use the backend URL
const getBackendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, API is served from the same origin
    return '';
  }
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8601';
};

const config = {
  backendUrl: getBackendUrl(),
};

export default config;

