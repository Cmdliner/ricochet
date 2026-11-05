import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { terms } from "@/lib/legal/terms";

export const metadata: Metadata = {
  title: terms.title,
  description: terms.description,
};

export default function Terms() {
  return <LegalDocument content={terms} />;
}
