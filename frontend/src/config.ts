// Defaults to the local Docker backend; set VITE_API_URL to point elsewhere (e.g. the deployed backend).
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
export const STREAM_URL = `${API_URL}/stream`;
