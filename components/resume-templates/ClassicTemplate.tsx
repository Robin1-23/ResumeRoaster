import type { ResumeTemplateProps } from "./types";

export default function ClassicTemplate({ data, customStyles }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, projects, certifications } = data;

  const fSize = customStyles?.fontSize ? `${customStyles.fontSize}pt` : "var(--sheet-font-size, 10.5pt)";
  const lHeight = customStyles?.lineHeight || "var(--sheet-line-height, 1.45)";
  const accentColor = customStyles?.accentColor || "var(--sheet-accent-color, #ff5a1f)";

  const s = {
    page: {
      width: "100%",
      minHeight: "100%",
      background: "transparent",
      color: "#000000",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: fSize,
      lineHeight: lHeight,
      boxSizing: "border-box" as const,
      fontWeight: 500
    },
    name: {
      fontSize: "2em",
      fontWeight: 700,
      letterSpacing: "0.02em",
      margin: 0,
      color: "#000000",
      textAlign: "center" as const
    },
    title: {
      fontSize: "1.05em",
      color: "#000000",
      marginTop: "2pt",
      marginBottom: "8pt",
      fontWeight: 500,
      textAlign: "center" as const
    },
    contactRow: {
      fontSize: "0.85em",
      color: "#000000",
      borderBottom: `1.5pt solid ${accentColor}`,
      paddingBottom: "8pt",
      marginBottom: "12pt",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap" as const,
      gap: "4pt"
    },
    sectionTitle: {
      fontSize: "1.1em",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      borderBottom: `0.75pt solid ${accentColor}88`,
      paddingBottom: "2pt",
      marginTop: "14pt",
      marginBottom: "6pt",
      color: "#000000"
    },
    entryHead: {
      display: "flex",
      justifyContent: "space-between",
      fontWeight: 700,
      fontSize: "1em",
      color: "#000000"
    },
    entrySub: {
      display: "flex",
      justifyContent: "space-between",
      fontStyle: "italic" as const,
      color: "#000000",
      fontSize: "0.9em",
      marginBottom: "3pt"
    },
    bullets: {
      margin: "0 0 8pt 16pt",
      padding: 0,
      color: "#000000"
    },
    skillsRow: {
      marginBottom: "4pt",
      color: "#000000"
    }
  };

  const contactItems = [
    contact.email,
    contact.phone,
    contact.location,
    ...(contact.links || [])
  ].filter(Boolean);

  return (
    <div style={s.page}>
      <h1 style={s.name}>{contact.name}</h1>
      {contact.title && <div style={s.title}>{contact.title}</div>}

      <div style={s.contactRow}>
        {contactItems.map((item, idx) => (
          <span key={idx} style={{ display: "inline-flex", alignItems: "center" }}>
            <span>{item}</span>
            {idx < contactItems.length - 1 && (
              <span style={{ margin: "0 8pt", color: accentColor, fontWeight: "bold" }}>•</span>
            )}
          </span>
        ))}
      </div>

      {summary && (
        <section>
          <div style={s.sectionTitle}>Summary</div>
          <p style={{ margin: 0 }}>{summary}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Experience</div>
          {experience.map((e, i) => (
            <div key={i}>
              <div style={s.entryHead}>
                <span>{e.role}</span>
                <span>{e.dates}</span>
              </div>
              <div style={s.entrySub}>
                <span>{e.organization}</span>
                <span>{e.location}</span>
              </div>
              <ul style={s.bullets}>
                {e.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {projects && projects.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Projects</div>
          {projects.map((p, i) => (
            <div key={i}>
              <div style={s.entryHead}>
                <span>{p.name}</span>
                <span>{p.dates}</span>
              </div>
              <ul style={s.bullets}>
                {p.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Education</div>
          {education.map((e, i) => (
            <div key={i} style={{ marginBottom: "6pt" }}>
              <div style={s.entryHead}>
                <span>{e.degree}</span>
                <span>{e.dates}</span>
              </div>
              <div style={s.entrySub}>
                <span>{e.school}</span>
                <span>{e.location}</span>
              </div>
              {e.details?.map((d, j) => (
                <div key={j} style={{ fontSize: "0.9em" }}>{d}</div>
              ))}
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Skills</div>
          {skills.map((g, i) => (
            <div key={i} style={s.skillsRow}>
              {g.category && <strong>{g.category}: </strong>}
              {g.items.join(", ")}
            </div>
          ))}
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Certifications</div>
          <ul style={s.bullets}>
            {certifications.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}