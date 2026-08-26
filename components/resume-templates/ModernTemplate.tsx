import type { ResumeTemplateProps } from "./types";

export default function ModernTemplate({ data, customStyles }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, projects, certifications } = data;

  const fSize = customStyles?.fontSize ? `${customStyles.fontSize}pt` : "var(--sheet-font-size, 10pt)";
  const lHeight = customStyles?.lineHeight || "var(--sheet-line-height, 1.45)";
  const accentColor = customStyles?.accentColor || "var(--sheet-accent-color, #3b82f6)";
  const paddingVal = customStyles?.pagePadding ? `${customStyles.pagePadding}mm` : "var(--sheet-padding, 16mm)";

  const s = {
    page: {
      width: "100%",
      minHeight: "100%",
      display: "flex",
      background: "transparent",
      color: "#000000",
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize: fSize,
      lineHeight: lHeight,
      boxSizing: "border-box" as const
    },
    sidebar: {
      width: "68mm",
      background: "#1e293b",
      color: "#ffffff",
      padding: `${paddingVal} 9mm`,
      boxSizing: "border-box" as const
    },
    sidebarContent: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "20pt"
    },
    main: {
      flex: 1,
      padding: `${paddingVal} 12mm`,
      boxSizing: "border-box" as const,
      color: "#000000"
    },
    headerBlock: {
      marginBottom: "8pt"
    },
    name: {
      fontSize: "1.7em",
      fontWeight: 800,
      margin: 0,
      lineHeight: 1.2,
      color: "#ffffff",
      textAlign: "left" as const,
      letterSpacing: "-0.01em"
    },
    title: {
      fontSize: "0.95em",
      color: "#94a3b8",
      marginTop: "4pt",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      textAlign: "left" as const
    },
    sideSectionTitle: {
      fontSize: "0.9em",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      color: accentColor,
      borderBottom: `1px solid ${accentColor}55`,
      paddingBottom: "3pt",
      marginBottom: "8pt",
      marginTop: 0
    },
    sideText: {
      fontSize: "0.85em",
      color: "#cbd5e1",
      lineHeight: "1.4",
      wordBreak: "break-word" as const
    },
    sideTextContainer: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "6pt"
    },
    educationBlock: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "10pt"
    },
    educationItem: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "2pt"
    },
    educationTitle: {
      fontSize: "0.85em",
      fontWeight: 700,
      color: "#ffffff",
      lineHeight: "1.3"
    },
    educationSub: {
      fontSize: "0.8em",
      color: "#94a3b8",
      lineHeight: "1.3"
    },
    educationDates: {
      fontSize: "0.8em",
      color: "#64748b",
      lineHeight: "1.3"
    },
    mainSectionTitle: {
      fontSize: "1.1em",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      color: "#000000",
      borderBottom: `1.5pt solid ${accentColor}`,
      paddingBottom: "2pt",
      marginTop: "12pt",
      marginBottom: "6pt"
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
      marginBottom: "3pt",
      fontWeight: 500
    },
    bullets: {
      margin: "0 0 8pt 14pt",
      padding: 0,
      color: "#000000"
    }
  };

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.sidebarContent}>
          <div style={s.headerBlock}>
            <h1 style={s.name}>{contact.name}</h1>
            {contact.title && <div style={s.title}>{contact.title}</div>}
          </div>

          <div>
            <div style={s.sideSectionTitle}>Contact</div>
            <div style={s.sideTextContainer}>
              {contact.email && <div style={s.sideText}>{contact.email}</div>}
              {contact.phone && <div style={s.sideText}>{contact.phone}</div>}
              {contact.location && <div style={s.sideText}>{contact.location}</div>}
              {contact.links?.map((l, i) => (
                <div key={i} style={s.sideText}>{l}</div>
              ))}
            </div>
          </div>

          {skills.length > 0 && (
            <div>
              <div style={s.sideSectionTitle}>Skills</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8pt" }}>
                {skills.map((g, i) => {
                  const filteredItems = g.items.filter(item => item.trim() !== "");
                  if (filteredItems.length === 0) return null;
                  return (
                    <div key={i}>
                      {g.category && (
                        <div style={{ ...s.sideText, fontWeight: 700, marginBottom: "2pt", color: "#ffffff" }}>
                          {g.category}
                        </div>
                      )}
                      <div style={{ ...s.sideText, fontSize: "0.8em" }}>{filteredItems.join(", ")}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <div style={s.sideSectionTitle}>Education</div>
              <div style={s.educationBlock}>
                {education.map((e, i) => (
                  <div key={i} style={s.educationItem}>
                    <div style={s.educationTitle}>{e.degree}</div>
                    <div style={s.educationSub}>{e.school}</div>
                    <div style={s.educationDates}>{e.dates}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications && certifications.filter(c => c.trim() !== "").length > 0 && (
            <div>
              <div style={s.sideSectionTitle}>Certifications</div>
              <div style={s.sideTextContainer}>
                {certifications.filter(c => c.trim() !== "").map((c, i) => (
                  <div key={i} style={s.sideText}>{c}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main style={s.main}>
        {summary && (
          <section>
            <div style={s.mainSectionTitle}>Summary</div>
            <p style={{ margin: 0 }}>{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <div style={s.mainSectionTitle}>Experience</div>
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
                  {e.bullets.filter(b => b.trim() !== "").map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {projects && projects.length > 0 && (
          <section>
            <div style={s.mainSectionTitle}>Projects</div>
            {projects.map((p, i) => (
              <div key={i}>
                <div style={s.entryHead}>
                  <span>{p.name}</span>
                  <span>{p.dates}</span>
                </div>
                <ul style={s.bullets}>
                  {p.bullets.filter(b => b.trim() !== "").map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}