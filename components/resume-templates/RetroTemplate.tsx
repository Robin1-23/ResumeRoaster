import type { ResumeTemplateProps } from "./types";

export default function RetroTemplate({ data, customStyles }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, projects } = data;

  const fSize = customStyles?.fontSize ? `${customStyles.fontSize}pt` : "var(--sheet-font-size, 9pt)";
  const lHeight = customStyles?.lineHeight || "var(--sheet-line-height, 1.4)";
  const accentColor = customStyles?.accentColor || "var(--sheet-accent-color, #38bdf8)";
  const paddingVal = customStyles?.pagePadding ? `${customStyles.pagePadding}mm` : "var(--sheet-padding, 14mm)";

  const s = {
    page: {
      width: "100%",
      minHeight: "100%",
      background: "transparent",
      color: accentColor,
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: fSize,
      lineHeight: lHeight,
      boxSizing: "border-box" as const,
      padding: paddingVal
    },
    header: {
      border: `2px solid ${accentColor}`,
      borderRadius: "4px",
      padding: "12pt",
      marginBottom: "16pt",
      background: "#1e293b"
    },
    name: {
      fontSize: "2em",
      fontWeight: 700,
      margin: 0,
      color: "#4ade80",
      textAlign: "center" as const
    },
    title: {
      fontSize: "1.05em",
      color: "#facc15",
      textAlign: "center" as const,
      marginTop: "4pt",
      textTransform: "uppercase" as const
    },
    contactGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "6pt",
      fontSize: "0.95em",
      marginTop: "8pt",
      borderTop: `1px dashed ${accentColor}`,
      paddingTop: "6pt",
      color: "#cbd5e1"
    },
    sectionTitle: {
      color: "#facc15",
      fontWeight: 700,
      fontSize: "1.15em",
      margin: "14pt 0 6pt 0",
      textTransform: "uppercase" as const
    },
    entryHead: {
      display: "flex",
      justifyContent: "space-between",
      fontWeight: 700,
      color: "#4ade80",
      marginTop: "8pt"
    },
    entrySub: {
      display: "flex",
      justifyContent: "space-between",
      color: "#cbd5e1",
      fontSize: "0.95em"
    },
    bullets: {
      margin: "4pt 0 8pt 14pt",
      padding: 0,
      listStyleType: "none",
      color: "#cbd5e1"
    },
    bulletItem: {
      marginBottom: "2pt"
    },
    asciiLine: {
      color: "#475569",
      letterSpacing: "-1px",
      margin: "4pt 0"
    }
  };

  const asciiDivider = "-".repeat(60);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.name}>&gt; {contact.name}_</h1>
        {contact.title && <div style={s.title}>[{contact.title}]</div>}
        <div style={s.contactGrid}>
          {contact.email && <div>EMAIL: {contact.email}</div>}
          {contact.phone && <div>PHONE: {contact.phone}</div>}
          {contact.location && <div>ADDR : {contact.location}</div>}
          {contact.links?.map((l, i) => (
            <div key={i}>LINK : {l}</div>
          ))}
        </div>
      </header>

      {summary && (
        <section>
          <div style={s.sectionTitle}>$ cat bio.txt</div>
          <p style={{ margin: 0, color: "#cbd5e1" }}>{summary}</p>
          <div style={s.asciiLine}>{asciiDivider}</div>
        </section>
      )}

      {experience.length > 0 && (
        <section>
          <div style={s.sectionTitle}>$ ls experience/</div>
          {experience.map((e, i) => (
            <div key={i}>
              <div style={s.entryHead}>
                <span># {e.role}</span>
                <span>[{e.dates}]</span>
              </div>
              <div style={s.entrySub}>
                <span>@ {e.organization}</span>
                <span>{e.location}</span>
              </div>
              <ul style={s.bullets}>
                {e.bullets.filter(b => b.trim() !== "").map((b, j) => (
                  <li key={j} style={s.bulletItem}>* {b}</li>
                ))}
              </ul>
            </div>
          ))}
          <div style={s.asciiLine}>{asciiDivider}</div>
        </section>
      )}

      {projects && projects.length > 0 && (
        <section>
          <div style={s.sectionTitle}>$ ls projects/</div>
          {projects.map((p, i) => (
            <div key={i}>
              <div style={s.entryHead}>
                <span># {p.name}</span>
                <span>[{p.dates}]</span>
              </div>
              <ul style={s.bullets}>
                {p.bullets.filter(b => b.trim() !== "").map((b, j) => (
                  <li key={j} style={s.bulletItem}>* {b}</li>
                ))}
              </ul>
            </div>
          ))}
          <div style={s.asciiLine}>{asciiDivider}</div>
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <div style={s.sectionTitle}>$ cat skills.json</div>
          {skills.map((g, i) => {
            const filteredItems = g.items.filter(item => item.trim() !== "");
            if (filteredItems.length === 0) return null;
            return (
              <div key={i} style={{ margin: "4pt 0", color: "#cbd5e1" }}>
                <span style={{ color: "#38bdf8" }}>"{g.category || "General"}":</span> [ {filteredItems.join(", ")} ]
              </div>
            );
          })}
          <div style={s.asciiLine}>{asciiDivider}</div>
        </section>
      )}

      {education.length > 0 && (
        <section>
          <div style={s.sectionTitle}>$ cat education.txt</div>
          {education.map((e, i) => (
            <div key={i} style={{ marginBottom: "6pt" }}>
              <div style={s.entryHead}>
                <span># {e.school}</span>
                <span>[{e.dates}]</span>
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
