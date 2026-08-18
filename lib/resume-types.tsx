// Structured resume data contract. The AI (/api/optimize) fills this shape;
// template components (in /components/resume-templates) render it.
// Keeping content and presentation separate is the whole fix for
// "output always looks like a different template than what I uploaded" —
// the model never generates layout, only content.

export interface ResumeContact {
  name: string;
  title?: string; // e.g. "Senior Frontend Engineer"
  email?: string;
  phone?: string;
  location?: string;
  links?: string[]; // LinkedIn, portfolio, GitHub, etc. — full display strings
}

export interface ResumeExperienceEntry {
  role: string;
  organization: string;
  location?: string;
  dates?: string;
  bullets: string[];
}

export interface ResumeEducationEntry {
  degree: string;
  school: string;
  location?: string;
  dates?: string;
  details?: string[];
}

export interface ResumeProjectEntry {
  name: string;
  dates?: string;
  bullets: string[];
}

export interface ResumeSkillGroup {
  category?: string; // e.g. "Languages", "Tools" — omit for a flat list
  items: string[];
}

export interface ResumeData {
  contact: ResumeContact;
  summary?: string;
  experience: ResumeExperienceEntry[];
  education: ResumeEducationEntry[];
  skills: ResumeSkillGroup[];
  projects?: ResumeProjectEntry[];
  certifications?: string[];
}

// Defensive defaults so a slightly malformed model response never crashes
// a template component — every array/object field is guaranteed to exist.
export function normalizeResumeData(raw: any): ResumeData {
  const asStringArray = (v: any): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

  return {
    contact: {
      name: raw?.contact?.name || "",
      title: raw?.contact?.title || undefined,
      email: raw?.contact?.email || undefined,
      phone: raw?.contact?.phone || undefined,
      location: raw?.contact?.location || undefined,
      links: asStringArray(raw?.contact?.links)
    },
    summary: raw?.summary || undefined,
    experience: Array.isArray(raw?.experience)
      ? raw.experience.map((e: any) => ({
          role: e?.role || "",
          organization: e?.organization || "",
          location: e?.location || undefined,
          dates: e?.dates || undefined,
          bullets: asStringArray(e?.bullets)
        }))
      : [],
    education: Array.isArray(raw?.education)
      ? raw.education.map((e: any) => ({
          degree: e?.degree || "",
          school: e?.school || "",
          location: e?.location || undefined,
          dates: e?.dates || undefined,
          details: asStringArray(e?.details)
        }))
      : [],
    skills: Array.isArray(raw?.skills)
      ? raw.skills.map((s: any) => ({
          category: s?.category || undefined,
          items: asStringArray(s?.items)
        }))
      : [],
    projects: Array.isArray(raw?.projects)
      ? raw.projects.map((p: any) => ({
          name: p?.name || "",
          dates: p?.dates || undefined,
          bullets: asStringArray(p?.bullets)
        }))
      : undefined,
    certifications: asStringArray(raw?.certifications)
  };
}

export const RESUME_JSON_SCHEMA_DESCRIPTION = `{
  "contact": {
    "name": string,
    "title": string (optional, e.g. current role/target role headline),
    "email": string (optional),
    "phone": string (optional),
    "location": string (optional),
    "links": string[] (optional, e.g. ["linkedin.com/in/x", "github.com/x"])
  },
  "summary": string (optional, 2-3 sentence professional summary),
  "experience": [
    {
      "role": string,
      "organization": string,
      "location": string (optional),
      "dates": string (optional, e.g. "Jan 2022 - Present"),
      "bullets": string[]
    }
  ],
  "education": [
    {
      "degree": string,
      "school": string,
      "location": string (optional),
      "dates": string (optional),
      "details": string[] (optional)
    }
  ],
  "skills": [
    { "category": string (optional, e.g. "Languages"), "items": string[] }
  ],
  "projects": [
    { "name": string, "dates": string (optional), "bullets": string[] }
  ] (optional, omit if the original resume had no projects section),
  "certifications": string[] (optional, omit if none)
}`;