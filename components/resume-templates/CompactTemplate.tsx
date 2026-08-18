import type { ResumeTemplateProps } from "./types";

export default function CompactTemplate({ data, customStyles }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, projects, certifications } = data;

  const fSize = customStyles?.fontSize ? `${customStyles.fontSize}pt` : "var(--sheet-font-size, 9pt)";
  const lHeight = customStyles?.lineHeight || "var(--sheet-line-height, 1.3)";
  const accentColor = customStyles?.accentColor || "var(--sheet-accent-color, #000000)";
  const paddingVal = customStyles?.pagePadding ? `${customStyles.pagePadding}mm` : "var(--sheet-padding, 12mm)";

  const s = {
    page: {
      width: "100%",
      minHeight: "100%",
      background: "transparent",
      color: "#000000",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: fSize,
      lineHeight: lHeight,
      boxSizing: "border-box" as const,
      padding: paddingVal
    },
    headRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      borderBottom: `1.5pt solid ${accentColor}`,
      paddingBottom: "5pt",
      marginBottom: "8pt"
    },
    name: {
      fontSize: "1.7em",
      fontWeight: 700,
      margin: 0,
      color: "#000000"
    },
    contactCol: {
      fontSize: "0.85em",
      textAlign: "right" as const,
      color: "#000000"
    },
    sectionTitle: {
      fontSize: "1.05em",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.04em",
      color: accentColor,
      marginTop: "8pt",
      marginBottom: "3pt"
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
      color: "#000000",
      fontSize: "0.9em",
      marginBottom: "1pt"
    },
    bullets: {
      margin: "0 0 5pt 12pt",
      padding: 0,
      color: "#000000"
    },
    bulletItem: {
      marginBottom: "0.5pt"
    },
    skillsContainer: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "3pt",
      color: "#000000"
    }
  };

  return (
    <div style={s.page}>
      <div style={s.headRow}>
        <div>
          <h1 style={s.name}>{contact.name}</h1>
          {contact.title && <div style={{ fontSize: "1em", color: "#000000", fontWeight: 500 }}>{contact.title}</div>}
        </div>
        <div style={s.contactCol}>
          {contact.email && <div>{contact.email}</div>}
          {contact.phone && <div>{contact.phone}</div>}
          {contact.location && <div>{contact.location}</div>}
          {contact.links?.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
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
                <span>{e.role} — {e.organization}</span>
                <span>{e.dates}</span>
              </div>
              {e.location && <div style={s.entrySub}><span>{e.location}</span><span /></div>}
              <ul style={s.bullets}>
                {e.bullets.map((b, j) => (
                  <li key={j} style={s.bulletItem}>{b}</li>
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
                  <li key={j} style={s.bulletItem}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Skills</div>
          <div style={s.skillsContainer}>
            {skills.map((g, i) => (
              <div key={i}>
                {g.category && <strong>{g.category}: </strong>}
                <span>{g.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Education</div>
          {education.map((e, i) => (
            <div key={i} style={{ marginBottom: "3pt" }}>
              <div style={s.entryHead}>
                <span>{e.degree}</span>
                <span>{e.dates}</span>
              </div>
              <div style={s.entrySub}><span>{e.school}</span><span>{e.location}</span></div>
            </div>
          ))}
        </section>
      )}

      {certifications && certifications.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Certifications</div>
          <div>{certifications.join(" · ")}</div>
        </section>
      )}
    </div>
  );
}