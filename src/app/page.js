"use client";
import Image from "next/image";
import AgeIntro from "./AgeIntro";

export default function Home() {
  return (
    <section className="aero-hero">
      {/* Portrait card */}
      <div className="aero-portrait">
        <div className="aero-portrait-frame">
          <Image
            src="/kondwani.png"
            alt="Portrait of Kondwani Phiri"
            width={520}
            height={680}
            className="aero-portrait-img"
            priority
            unoptimized
          />
        </div>

        <div className="aero-social" aria-label="Social links">
          <a
            href="https://instagram.com/kondwaniphiris"
            target="_blank"
            rel="noopener noreferrer"
            className="aero-chip"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient id="igGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEDA77" />
                  <stop offset="25%" stopColor="#F58529" />
                  <stop offset="55%" stopColor="#DD2A7B" />
                  <stop offset="80%" stopColor="#8134AF" />
                  <stop offset="100%" stopColor="#515BD4" />
                </linearGradient>
              </defs>
              <path
                fill="url(#igGrad)"
                d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.43.37 1.06.42 2.23.06 1.25.07 1.65.07 4.85s-.01 3.6-.07 4.85c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.17-1.06.37-2.23.42-1.25.06-1.65.07-4.85.07s-3.6-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.17-.43-.37-1.06-.42-2.23C2.21 15.6 2.2 15.2 2.2 12s.01-3.6.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.17 1.06-.37 2.23-.42C8.4 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.52.01-4.76.07-1.02.05-1.57.22-1.94.36-.49.19-.83.42-1.2.79s-.6.71-.79 1.2c-.14.37-.31.92-.36 1.94C2.89 8.48 2.88 8.85 2.88 12s.01 3.52.07 4.76c.05 1.02.22 1.57.36 1.94.19.49.42.83.79 1.2s.71.6 1.2.79c.37.14.92.31 1.94.36 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.02-.05 1.57-.22 1.94-.36.49-.19.83-.42 1.2-.79s.6-.71.79-1.2c.14-.37.31-.92.36-1.94.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.02-.22-1.57-.36-1.94a3.24 3.24 0 0 0-.79-1.2 3.24 3.24 0 0 0-1.2-.79c-.37-.14-.92-.31-1.94-.36C15.52 4.01 15.15 4 12 4zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm5.1-2.05a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3z"
              />
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/kondwaniphiri7"
            target="_blank"
            rel="noopener noreferrer"
            className="aero-chip"
            aria-label="LinkedIn"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#0A66C2"
                d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.65h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21H10V9z"
              />
            </svg>
          </a>
          <a
            href="mailto:kondwanihp@outlook.com"
            className="aero-chip"
            aria-label="Email"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#0078D4"
                d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 8.2L4.4 7H19.6L12 13.2zM4 8.55V18h16V8.55L12 15 4 8.55z"
              />
            </svg>
          </a>
        </div>

        <div className="aero-flags" aria-label="Heritage">
          <span className="aero-flag">
            <Image
              src="/usflag.png"
              alt="United States flag"
              width={48}
              height={32}
              unoptimized
            />
          </span>
          <span className="aero-flag">
            <Image
              src="/zambiaflag.png"
              alt="Zambian flag"
              width={48}
              height={32}
              unoptimized
            />
          </span>
        </div>
      </div>

      {/* Bio panel */}
      <div className="aero-bio">
        <h1 className="aero-name">kondwani phiri</h1>
        <p className="aero-tag">
          engineer &middot; screenwriter &middot; director &middot; photographer
          <br />
          university of southern california &rsquo;26
        </p>

        <div className="aero-bio-text">
          <p>
            I&rsquo;m Kondwani Phiri. I study aerospace/mechanical engineering
            and cinematic arts at the University of Southern California (Fall
            2026).
          </p>
          <p>
            I&rsquo;m based between Los Angeles and the DC area, and I grew up
            in Silver Spring, Maryland. Academically and professionally, my
            main interests are in aerospace, manufacturing, product, and
            architectural and civil aspects of engineering. I&rsquo;m open to
            roles or internships in just about anywhere in the US.
          </p>
          <p>
            Aside from my academic career as an engineer, I&rsquo;m also a
            very avid and passionate filmmaker, writer, and photographer. My
            personal photography work is displayed here, along with a few
            personal writing projects. Anything for official submission or
            professional work can be seen or read by contacting me directly.
          </p>
        </div>

        <div className="aero-edu">
          <a
            href="https://www.usc.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="aero-edu-row"
          >
            <span className="aero-edu-logo">
              <Image
                src="/usclogo.png"
                alt="University of Southern California"
                width={56}
                height={56}
                unoptimized
              />
            </span>
            <span className="aero-edu-text">
              <h3>University of Southern California</h3>
              <p>
                2026 &middot; B.S. Mechanical Engineering (Design Emphasis),
                Minor in Cinematic Arts &middot; Viterbi School of Engineering
              </p>
            </span>
          </a>
          <a
            href="https://www2.montgomeryschoolsmd.org/schools/blakehs/"
            target="_blank"
            rel="noopener noreferrer"
            className="aero-edu-row"
          >
            <span className="aero-edu-logo">
              <Image
                src="/blakelogo.png"
                alt="James Hubert Blake High School"
                width={56}
                height={56}
                unoptimized
              />
            </span>
            <span className="aero-edu-text">
              <h3>James Hubert Blake High School</h3>
              <p>2018 &ndash; 2022 &middot; High School Diploma &middot; Colesville, MD</p>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
