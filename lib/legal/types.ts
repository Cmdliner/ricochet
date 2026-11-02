export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

export type LegalContent = {
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};
