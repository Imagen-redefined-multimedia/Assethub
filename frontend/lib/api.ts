
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ApiFetchOptions = RequestInit & {
  skipRefresh?: boolean;
};

function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
}

function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("refresh_token");
}

function clearAuthentication() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/auth/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.access) {
      return null;
    }

    localStorage.setItem("access_token", data.access);

    /*
     * SimpleJWT may rotate refresh tokens depending
     * on your Django configuration.
     *
     * If a new refresh token is returned, save it.
     */
    if (data.refresh) {
      localStorage.setItem(
        "refresh_token",
        data.refresh
      );
    }

    return data.access;
  } catch {
    return null;
  }
}

function buildHeaders(
  headers?: HeadersInit,
  token?: string | null,
  body?: BodyInit | null
) {
  const result = new Headers(headers);

  if (token) {
    result.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  /*
   * Do not manually set Content-Type for FormData.
   * The browser needs to add the multipart boundary.
   */
  if (
    body &&
    !(body instanceof FormData) &&
    !result.has("Content-Type")
  ) {
    result.set(
      "Content-Type",
      "application/json"
    );
  }

  return result;
}

export async function apiFetch(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const {
    skipRefresh = false,
    headers,
    ...fetchOptions
  } = options;

  const token = getAccessToken();

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint}`;

  let response = await fetch(url, {
    ...fetchOptions,
    headers: buildHeaders(
      headers,
      token,
      fetchOptions.body
    ),
  });

  /*
   * If the access token expired, try the refresh token
   * exactly once.
   */
  if (
    response.status === 401 &&
    !skipRefresh
  ) {
    const newAccessToken =
      await refreshAccessToken();

    if (!newAccessToken) {
      clearAuthentication();
      redirectToLogin();

      return response;
    }

    response = await fetch(url, {
      ...fetchOptions,
      headers: buildHeaders(
        headers,
        newAccessToken,
        fetchOptions.body
      ),
    });
  }

  /*
   * If the retry is still unauthorized, authentication
   * is no longer valid.
   */
  if (response.status === 401) {
    clearAuthentication();
    redirectToLogin();
  }

  return response;
}

export async function apiJson<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const response = await apiFetch(
    endpoint,
    options
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      extractApiError(data) ||
        `Request failed with status ${response.status}.`,
      response.status,
      data
    );
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(
    message: string,
    status: number,
    data: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function extractApiError(
  data: unknown
): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object =
    data as Record<string, unknown>;

  if (typeof object.detail === "string") {
    return object.detail;
  }

  if (typeof object.message === "string") {
    return object.message;
  }

  for (const value of Object.values(object)) {
    if (typeof value === "string") {
      return value;
    }

    if (
      Array.isArray(value) &&
      typeof value[0] === "string"
    ) {
      return value[0];
    }
  }

  return null;
}

export function logout() {
  clearAuthentication();
  redirectToLogin();
}

