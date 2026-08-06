
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
  // Automatically grab the token
  const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
  const expiry = localStorage.getItem("tokenExpiry");

  if (expiry && new Date().getTime() > parseInt(expiry)) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }

  const isFormData = options.body instanceof FormData;

  // Merge the standard headers with any custom ones you pass in
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Make the actual request
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    console.error("Authentication failed. Kicking to login.");
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return response;
}