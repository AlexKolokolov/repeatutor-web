"use client";

import { useEffect, useState } from "react";
import { getToken } from "./token";

export function useTokenState() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setToken(getToken());
    sync();
    window.addEventListener("repeatutor-token-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("repeatutor-token-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return token;
}
