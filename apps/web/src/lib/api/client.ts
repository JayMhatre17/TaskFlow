import axios, { AxiosRequestConfig } from "axios";

type ApiRequestOptions = {
  method?: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
  path: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: AxiosRequestConfig["headers"];
};
type ApiErrorResponse = {
  message?: string;
  errors?: unknown;
};

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}
const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function apiRequest<T>({
  method = "GET",
  path,
  params,
  body,
  headers,
}: ApiRequestOptions): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      method,
      url: path,
      params,
      data: body,
      headers,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const status = error.response?.status ?? 500;

      const message =
        error.response?.data?.message ??
        error.message ??
        "Something went wrong";

      throw new ApiError(message, status, error.response?.data?.errors);
    }

    throw error;
  }
}
