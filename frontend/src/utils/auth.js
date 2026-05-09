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

export const isAdmin = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.is_admin === true;
  } catch {
    return false;
  }
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
};
