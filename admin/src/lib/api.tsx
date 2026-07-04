
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Automatically grab the token
  const token = localStorage.getItem("userToken");

  // Merge the standard headers with any custom ones you pass in
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Make the actual request
  const response = await fetch(`https://api.wijhawest.com${endpoint}`, {
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