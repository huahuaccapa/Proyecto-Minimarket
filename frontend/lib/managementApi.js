import { getAuthToken, setAuthToken } from "./api";

const API_URL = "/backend-api";

async function request(
  path,

  options = {},
) {
  const token = getAuthToken();

  let httpResponse;

  try {
    httpResponse = await fetch(
      `${API_URL}${path}`,

      {
        ...options,

        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),

          ...options.headers,
        },
      },
    );
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const data = await httpResponse.json().catch(() => ({}));

  if (!httpResponse.ok) {
    throw new Error(data.message || "No se pudo completar la solicitud");
  }

  return data;
}

export const managementApi = {
  settings: () => request("/settings"),

  updateSettings: (payload) =>
    request(
      "/settings",

      {
        method: "PUT",

        body: JSON.stringify(payload),
      },
    ),

  users: () => request("/users"),

  createUser: (payload) =>
    request(
      "/users",

      {
        method: "POST",

        body: JSON.stringify(payload),
      },
    ),

  updateUser: (id, payload) =>
    request(
      `/users/${id}`,

      {
        method: "PUT",

        body: JSON.stringify(payload),
      },
    ),

  resetUserPassword: (id, password) =>
    request(
      `/users/${id}/reset-password`,

      {
        method: "POST",

        body: JSON.stringify({
          password,
        }),
      },
    ),

  changePassword: async (payload) => {
    const result = await request(
      "/auth/change-password",

      {
        method: "POST",

        body: JSON.stringify(payload),
      },
    );

    if (result.data?.token) {
      setAuthToken(result.data.token);
    }

    return result;
  },
};
