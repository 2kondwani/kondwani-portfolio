"use client";
import Image from "next/image";

/* -----------------------------------------------------------
   Content
   Add new entries by appending to these arrays.
   Each entry shape:
     { org, role, location, date, description, link, logo }
   - logo is a path under /public (e.g. "/usclogo.png")
   - description, location, link are optional
----------------------------------------------------------- */
const experiences = [
  {
    org: "META via USC",
    role: "Technical Producer / Research Intern",
    location: "Los Angeles, CA",
    date: "May 2025 – Present",
    description: [
      "Conducted usability testing and QA for AI-based mental health software on Meta Quest, improving accessibility and performance for diverse user groups.",
      "Focused product design testing and analysis using META for education software, using NX software for CADing, and various programs to improve design systems, such as Python, JavaScript, etc.",
      "Documented testing procedures and synthesized feedback across Google Docs, Notion, and Slack, streamlining workflows for a 10+ person research team.",
      "Ensured compliance with accessibility standards (WCAG), contributing to a **15% improvement** in user experience ratings during trials.",
    ],
    logo: "/metalogo.png",
  },
  {
    org: "Georgetown University (Department of Physics – DelGadoLab)",
    role: "Physics Research Intern",
    location: "Washington, DC",
    date: "Jun – Aug 2024",
    description: [
      "Summer research assistant at Georgetown University under the provost's distinguished professor Emanuela Del Gado.",
      "Performed independent analytical research and **breakdown of stress and strain in amorphous materials**, including breakage point, yielding, and failure of soft materials, and conditions under gel and shear speed. Analysis was done using QtGrace and MATLAB; **over 30 samples** were completed, varying materials from carbon to be compared against crystalline Aluminum to low-grade diamond, and gold.",
      "Analyzed and presented the uses and applications, including product design, structural analysis, building science, and urban planning, with a focus on shear and strain breakage effects on said products and industries.",
    ],
    link: "https://physics.georgetown.edu/",
    logo: "/GeorgetownLogo.png",
  },
  {
    org: "National Institutes of Health",
    role: "Summer OITE Intern",
    location: "Bethesda, MD",
    date: "Jun – Aug 2022",
    description:
      "Participated in the NIH Summer Internship Program, gaining hands-on research experience and professional development in biomedical research.",
    link: "https://www.nih.gov/",
    logo: "/NIHlogo.png",
  },
];

const involvements = [
  {
    org: "National Society of Black Engineers",
    role: "Co-Founder & Member",
    location: "Los Angeles, CA",
    date: "Sep 2022 – Present",
    description: [
      "Community service events for the local South Los Angeles area, including fundraisers, youth STEM engagement, and STEM education for lower-income neighborhoods.",
      "Created a NSBE Jr. chapter to Alma Mater Middle School in White Oak, Maryland, and used said program to work in conjunction with other STEM-based inclusivity work while in high school, including Zoom-based collaborative science funds during the pandemic.",
    ],
    logo: "/nsbelogo.png",
  },
  {
    org: "USC BlackGen Capital",
    role: "Vice President of Public Relations",
    location: "Los Angeles, CA",
    date: "Sep 2022 – May 2025",
    description: [
      "**BlackGen Capital**: a student-run investment fund managing over **$100,000** in assets with backing from Warburg Pincus, JP Morgan, and others.",
      "Led a case team to **1st place** in **two stock pitch** competitions, which included presenting company overviews, market projections, and DCF analyses.",
      "Oversaw all PR, events, and social strategy across **5+ partner universities**, driving chapter growth **by 40%**. The club recently reached an all-time applicant record of **100 members** in the only California chapter.",
    ],
    logo: "/blackgenlogo.png",
  },
];

export default function AcademicPage() {
  return (
    <section className="aero-cv">
      <header className="aero-cv-page-head">
        <h1 className="aero-cv-page-title">academic / work</h1>
        <p className="aero-cv-page-sub">
          research, internships, and roles I&apos;ve held &mdash; past and
          present.
        </p>
      </header>

      <CVSection label="experience" items={experiences} />
      {involvements.length > 0 && (
        <CVSection label="involvements" items={involvements} />
      )}
    </section>
  );
}

function CVSection({ label, items }) {
  return (
    <section className="aero-cv-section">
      <h2 className="aero-section-label">{label}</h2>
      <div className="aero-cv-list">
        {items.map((item, i) => (
          <CVRow key={`${item.org}-${item.date}-${i}`} {...item} />
        ))}
      </div>
    </section>
  );
}

// Inline **bold** markdown — keeps content arrays readable without hand-writing JSX
function renderRichText(str) {
  if (typeof str !== "string") return str;
  const parts = [];
  let lastIndex = 0;
  const re = /\*\*([^*]+)\*\*/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > lastIndex) parts.push(str.slice(lastIndex, m.index));
    parts.push(<strong key={`b-${m.index}`}>{m[1]}</strong>);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < str.length) parts.push(str.slice(lastIndex));
  return parts.length ? parts : str;
}

function CVRow({ org, role, location, date, description, link, logo }) {
  const initials = org
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const meta = [role, location].filter(Boolean).join(" · ");

  const inner = (
    <>
      <span className="aero-cv-logo" aria-hidden="true">
        {logo ? (
          <Image src={logo} alt="" width={60} height={60} unoptimized />
        ) : (
          <span className="aero-cv-logo-initials">{initials}</span>
        )}
      </span>
      <div className="aero-cv-main">
        <div className="aero-cv-head">
          <h3 className="aero-cv-org">{org}</h3>
          {date && <span className="aero-cv-date">{date}</span>}
        </div>
        {meta && <p className="aero-cv-role">{meta}</p>}
        {description &&
          (Array.isArray(description) ? (
            <ul className="aero-cv-bullets">
              {description.map((d, i) => (
                <li key={i}>{renderRichText(d)}</li>
              ))}
            </ul>
          ) : (
            <p className="aero-cv-desc">{renderRichText(description)}</p>
          ))}
      </div>
    </>
  );

  if (link) {
    const external = /^https?:\/\//.test(link);
    return (
      <a
        className="aero-cv-row"
        href={link}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    );
  }
  return <div className="aero-cv-row">{inner}</div>;
}
