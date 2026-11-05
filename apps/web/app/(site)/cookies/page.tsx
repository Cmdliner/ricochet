import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { cookies } from "@/lib/legal/cookies";

export const metadata: Metadata = {
  title: cookies.title,
  description: cookies.description,
};

export default function Cookies() {
  return <LegalDocument content={cookies} />;
}
