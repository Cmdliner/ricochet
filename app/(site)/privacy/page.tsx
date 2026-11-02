import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { privacy } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: privacy.title,
  description: privacy.description,
};

export default function Privacy() {
  return <LegalDocument content={privacy} />;
}
