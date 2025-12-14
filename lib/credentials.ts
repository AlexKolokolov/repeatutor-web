"use client";

// Best-effort hook into the Credential Management API to encourage password save prompts.
export async function storePasswordCredential(email: string, password: string) {
  try {
    if (typeof window === "undefined") return;
    // @ts-expect-error PasswordCredential may not be in lib dom types.
    if (window.PasswordCredential) {
      // @ts-expect-error PasswordCredential constructor
      const cred = new PasswordCredential({ id: email, password, name: email });
      // @ts-expect-error navigator.credentials
      await navigator.credentials.store(cred);
    }
  } catch {
    // ignore; fallback to browser heuristics
  }
}
