import type { ResumeTemplateProps } from "./types";

export default function CreativeTemplate({ data, customStyles }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, projects } = data;

  const fSize = customStyles?.fontSize ? `${customStyles.fontSize}pt` : "var(--sheet-font-size, 9.5pt)";
  const lHeight = customStyles?.lineHeight || "var(--sheet-line-height, 1.5)";
  const accentColor = customStyles?.accentColor || "var(--sheet-accent-color, #6366f1)";
  const paddingVal = customStyles?.pagePadding ? `${customStyles.pagePadding}mm` : "var(--sheet-padding, 16mm)";

  const s = {
    page: {
      width: "100%",
      minHeight: "100%",
      background: "transparent",
      color: "#000000",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: fSize,
      lineHeight: lHeight,
      boxSizing: "border-box" as const,
      padding: paddingVal
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "20pt",
      borderLeft: `4px solid ${accentColor}`,
      paddingLeft: "12pt"
    },
    name: {
      fontSize: "2.2em",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      margin: 0,
      color: "#000000"
    },
    title: {
      fontSize: "1.05em",
      color: accentColor,
      fontWeight: 600,
      marginTop: "2pt"
    },
    contactCol: {
      textAlign: "right" as const,
      fontSize: "0.85em",
      color: "#000000"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "140px 1fr",
      gap: "16pt",
      marginTop: "16pt"
    },
    sectionLabel: {
      fontSize: "0.95em",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      color: accentColor
    },
    sectionContent: {
      borderBottom: "1px solid #e2e8f0",
      paddingBottom: "12pt"
    },
    entryTitle: {
      fontSize: "1em",
      fontWeight: 700,
      color: "#000000"
    },
    entrySubtitle: {
      fontSize: "0.9em",
      color: "#000000",
      marginBottom: "4pt",
      fontWeight: 500
    },
    bullets: {
      margin: "0 0 8pt 12pt",
      padding: 0,
      color: "#000000"
    },
    tagContainer: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: "4pt",
      marginTop: "4pt"
    },
    tag: {
      background: "#e2e8f0",
      color: "#000000",
      fontSize: "0.85em",
      padding: "2pt 6pt",
      borderRadius: "4px",
      fontWeight: 500
    }
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.name}>{contact.name}</h1>
          {contact.title && <div style={s.title}>{contact.title}</div>}
        </div>
        <div style={s.contactCol}>
          {contact.email && <div>{contact.email}</div>}
          {contact.phone && <div>{contact.phone}</div>}
          {contact.location && <div>{contact.location}</div>}
          {contact.links?.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </header>

      {summary && (
        <div style={s.grid}>
          <div style={s.sectionLabel}>About Me</div>
          <div style={s.sectionContent}>
            <p style={{ margin: 0, color: "#000000" }}>{summary}</p>
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <div style={s.grid}>
          <div style={s.sectionLabel}>Experience</div>
          <div style={s.sectionContent}>
            {experience.map((e, i) => (
              <div key={i} style={{ marginBottom: "12pt" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={s.entryTitle}>{e.role}</span>
                  <span style={{ fontSize: "0.85em", color: "#000000", fontWeight: 500 }}>{e.dates}</span>
                </div>
                <div style={s.entrySubtitle}>{e.organization} • {e.location}</div>
                <ul style={s.bullets}>
                  {e.bullets.filter(b => b.trim() !== "").map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {projects && projects.length > 0 && (
        <div style={s.grid}>
          <div style={s.sectionLabel}>Projects</div>
          <div style={s.sectionContent}>
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: "10pt" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={s.entryTitle}>{p.name}</span>
                  <span style={{ fontSize: "0.85em", color: "#000000", fontWeight: 500 }}>{p.dates}</span>
                </div>
                <ul style={s.bullets}>
                  {p.bullets.filter(b => b.trim() !== "").map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div style={s.grid}>
          <div style={s.sectionLabel}>Skills</div>
          <div style={s.sectionContent}>
            {skills.map((g, i) => {
              const filteredItems = g.items.filter(item => item.trim() !== "");
              if (filteredItems.length === 0) return null;
              return (
                <div key={i} style={{ marginBottom: "8pt" }}>
                  {g.category && (
                    <strong style={{ fontSize: "0.95em", display: "block", marginBottom: "2pt", color: "#000000" }}>
                      {g.category}
                    </strong>
                  )}
                  <div style={s.tagContainer}>
                    {filteredItems.map((item, j) => (
                      <span key={j} style={s.tag}>{item}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {education.length > 0 && (
        <div style={s.grid}>
          <div style={s.sectionLabel}>Education</div>
          <div style={{ ...s.sectionContent, borderBottom: "none" }}>
            {education.map((e, i) => (
              <div key={i} style={{ marginBottom: "8pt" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={s.entryTitle}>{e.school}</span>
                  <span style={{ fontSize: "0.85em", color: "#000000", fontWeight: 500 }}>{e.dates}</span>
                </div>
                <div style={{ fontSize: "0.9em", color: "#000000" }}>{e.degree} • {e.location}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
