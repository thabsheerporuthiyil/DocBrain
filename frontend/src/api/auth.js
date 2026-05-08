import api from "./axios";

export const loginUser = async (formData) => {
  const body = new URLSearchParams();
  body.append("username", formData.username);
  body.append("password", formData.password);

  const res = await api.post("/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return res.data;
};

export const registerUser = async (formData) => {
  const res = await api.post("/auth/register", {
    username: formData.username,
    password: formData.password,
  });

  return res.data;
};
