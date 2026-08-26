import type { ResumeTemplateProps } from "./types";

export default function ElegantTemplate({ data, customStyles }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, projects } = data;

  const fSize = customStyles?.fontSize ? `${customStyles.fontSize}pt` : "var(--sheet-font-size, 9.5pt)";
  const lHeight = customStyles?.lineHeight || "var(--sheet-line-height, 1.5)";
  const accentColor = customStyles?.accentColor || "var(--sheet-accent-color, #000000)";
  const paddingVal = customStyles?.pagePadding ? `${customStyles.pagePadding}mm` : "var(--sheet-padding, 16mm)";

  const s = {
    page: {
      width: "100%",
      minHeight: "297mm",
      height: "297mm",
      background: "transparent",
      color: "#000000",
      fontFamily: "Georgia, serif",
      fontSize: fSize,
      lineHeight: lHeight,
      boxSizing: "border-box" as const,
      padding: paddingVal,
      display: "flex",
      flexDirection: "column" as const
    },
    header: {
      textAlign: "center" as const,
      borderBottom: `2px double ${accentColor}`,
      paddingBottom: "12pt",
      marginBottom: "16pt"
    },
    name: {
      fontSize: "2em",
      fontWeight: 400,
      letterSpacing: "0.02em",
      margin: 0,
      textTransform: "uppercase" as const,
      fontFamily: "Georgia, serif",
      color: "#000000"
    },
    title: {
      fontSize: "1.05em",
      color: "#000000",
      textTransform: "uppercase" as const,
      letterSpacing: "0.1em",
      marginTop: "4pt",
      fontWeight: 600
    },
    contactInfo: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap" as const,
      gap: "10pt",
      fontSize: "0.9em",
      color: "#000000",
      marginTop: "8pt"
    },
    sectionTitle: {
      fontSize: "1.15em",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      color: accentColor,
      borderBottom: `1.5pt solid ${accentColor}44`,
      paddingBottom: "3pt",
      marginTop: "16pt",
      marginBottom: "8pt",
      fontFamily: "Georgia, serif"
    },
    entryHead: {
      display: "flex",
      justifyContent: "space-between",
      fontWeight: 600,
      fontSize: "1em",
      color: "#000000"
    },
    entrySub: {
      display: "flex",
      justifyContent: "space-between",
      color: "#000000",
      fontSize: "0.9em",
      fontStyle: "italic" as const,
      marginBottom: "4pt"
    },
    bullets: {
      margin: "0 0 10pt 16pt",
      padding: 0,
      color: "#000000"
    },
    bulletItem: {
      marginBottom: "3pt"
    },
    skillsContainer: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "6pt",
      fontSize: "0.95em",
      color: "#000000"
    }
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.name}>{contact.name}</h1>
        {contact.title && <div style={s.title}>{contact.title}</div>}
        <div style={s.contactInfo}>
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>• {contact.phone}</span>}
          {contact.location && <span>• {contact.location}</span>}
          {contact.links?.map((l, i) => (
            <span key={i}>• {l}</span>
          ))}
        </div>
      </header>

      {summary && (
        <section>
          <div style={s.sectionTitle}>Summary</div>
          <p style={{ margin: 0, fontStyle: "italic", textAlign: "justify" }}>{summary}</p>
        </section>
      )}

      {experience.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Professional Experience</div>
          {experience.map((e, i) => (
            <div key={i} style={{ marginBottom: "10pt" }}>
              <div style={s.entryHead}>
                <span>{e.role}</span>
                <span>{e.dates}</span>
              </div>
              <div style={s.entrySub}>
                <span>{e.organization}</span>
                <span>{e.location}</span>
              </div>
              <ul style={s.bullets}>
                {e.bullets.filter(b => b.trim() !== "").map((b, j) => (
                  <li key={j} style={s.bulletItem}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {projects && projects.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Selected Projects</div>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: "8pt" }}>
              <div style={s.entryHead}>
                <span>{p.name}</span>
                <span>{p.dates}</span>
              </div>
              <ul style={s.bullets}>
                {p.bullets.filter(b => b.trim() !== "").map((b, j) => (
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
            {skills.map((g, i) => {
              const filteredItems = g.items.filter(item => item.trim() !== "");
              if (filteredItems.length === 0) return null;
              return (
                <div key={i}>
                  <strong>{g.category ? `${g.category}: ` : ""}</strong>
                  <span>{filteredItems.join(", ")}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {education.length > 0 && (
        <section>
          <div style={s.sectionTitle}>Education</div>
          {education.map((e, i) => (
            <div key={i} style={{ marginBottom: "6pt" }}>
              <div style={s.entryHead}>
                <span>{e.school}</span>
                <span>{e.dates}</span>
              </div>
              <div style={s.entrySub}>
                <span>{e.degree}</span>
                <span>{e.location}</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
