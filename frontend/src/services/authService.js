import api from "./api.js";

export async function registerUser({ username, email, password, confirmPassword }) {
  const { data } = await api.post("/auth/register", {
    username,
    email,
    password,
    confirmPassword,
  });
  return data.user;
}

export async function loginUser({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  return data.user;
}

export async function logoutUser() {
  await api.post("/auth/logout");
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.user;
}
