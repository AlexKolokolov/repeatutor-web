"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ApiResult } from "./api";
import { withAuth, type AuthResult } from "./auth";

export function useAuthedAction() {
  const router = useRouter();

  return useCallback(
    async <T,>(action: (token: string) => Promise<ApiResult<T>>): Promise<AuthResult<T>> => {
      const res = await withAuth(action);
      if (!res.ok && res.authFailed) {
        router.push("/signin");
      }
      return res;
    },
    [router],
  );
}
