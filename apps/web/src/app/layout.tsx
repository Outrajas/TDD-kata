import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TDD Kata | Car Dealership Inventory System",
  description: "Search and manage live dealership inventory.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
