import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "./components/NavBar";

export const metadata: Metadata = {
  title: "Repeatutor Web",
  description: "Repeatutor frontend shell",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          <NavBar />
          {children}
        </div>
      </body>
    </html>
  );
}
