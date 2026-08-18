import type { ResumeData } from "@/lib/resume-types";

export interface ResumeTemplateProps {
  data: ResumeData;
  customStyles?: {
    fontSize?: number; // in pt
    lineHeight?: number;
    pagePadding?: number; // in mm
    accentColor?: string;
  };
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: "classic",
    name: "Classic ATS",
    description: "Single-column, serif headings, safest for automated parsers."
  },
  {
    id: "modern",
    name: "Modern Sidebar",
    description: "Two-column with a dark sidebar for contact info and skills."
  },
  {
    id: "compact",
    name: "Compact",
    description: "Tight spacing, small type — fits more on one page."
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Executive — Clean serif layout with top borders, perfect for senior roles."
  },
  {
    id: "creative",
    name: "Creative",
    description: "Creative Tech — High-contrast accent headers and clean left-aligned dates."
  },
  {
    id: "retro",
    name: "Retro Terminal",
    description: "Developer Terminal — Monospace retro-developer terminal window theme."
  }
];