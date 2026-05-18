import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "INVALID_STATE"
  | "INVALID_DIRECTION"
  | "SKIP_NOT_ALLOWED"
  | "TIME_EXPIRED"
  | "INSUFFICIENT_CREDITS";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiEnvelope<T>>({ data, error: null }, init);
}

export function fail(error: ApiError, status = 400, headers?: HeadersInit) {
  return NextResponse.json<ApiEnvelope<never>>({ data: null, error }, { status, headers });
}
