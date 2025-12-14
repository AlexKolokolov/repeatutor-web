"use client";

import { useEffect, useState } from "react";
import { getToken } from "../../lib/token";

export function NavBar() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const sync = () => setHasToken(Boolean(getToken()));
    sync();
    window.addEventListener("repeatutor-token-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("repeatutor-token-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <header className="nav" id="app-nav">
      <a href="/">Home</a>
      {!hasToken && (
        <>
          <a href="/signup">Sign up</a>
          <a href="/signin">Sign in</a>
        </>
      )}
    </header>
  );
}
