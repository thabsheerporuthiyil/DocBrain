export const getToken = () => localStorage.getItem("token");

export const isAuthenticated = () => Boolean(getToken());

export const getUsername = () => {
  const savedUsername = localStorage.getItem("username");

  if (savedUsername) {
    return savedUsername;
  }

  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username ?? null;
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
};
