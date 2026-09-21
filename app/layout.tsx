import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cell Architecture Studio",
  description: "An interactive 3D cell-learning studio for English-medium G.C.E. A/L Biology.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
