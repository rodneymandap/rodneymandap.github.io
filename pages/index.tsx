import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://rodneymandap.github.io";
const siteTitle = "Rodney Jan Mandap | Freelance Software Engineer";
const siteDescription =
  "Rodney Jan Mandap is a freelance software engineer building web applications and REST APIs, with network automation and broader end-to-end workflow automation experience.";
const socialImageUrl = `${siteUrl}/myPic.jpeg`;
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Rodney Jan Mandap",
  url: siteUrl,
  image: socialImageUrl,
  jobTitle: "Freelance Software Engineer",
  description: siteDescription,
  sameAs: [
    "https://github.com/rodneymandap",
    "https://www.linkedin.com/in/rjmandap/",
  ],
  knowsAbout: [
    "Python",
    "Django",
    "Django REST Framework",
    "REST APIs",
    "Automation",
    "Network automation",
    "Workflow automation",
    "Internal tools",
    "Azure",
    "Docker",
  ],
};

const designContract = `<!--
THESIS: An index of useful engineering work, not a conventional card-based portfolio.
OWN-WORLD: Dark navy surfaces, soft light text, restrained blue accents, condensed display type, and simple ruled lists.
STORY: Clients and hiring teams see what Rodney builds, assess real experience and credentials, then make contact.
FIRST VIEWPORT: A large work-focused statement and contact action sit beside a scannable specialty index and portrait.
FORM: The working index, grounded direction 7, direct indexed overview; seed 732fd066.
-->`;

type SkillCategory = {
  id: string;
  category: string;
  description: string;
  skills: string[];
};

const skillCategories: SkillCategory[] = [
  {
    id: "automation-scripting",
    category: "Automation & Scripting",
    description: "network automation, process automation, end-to-end workflows",
    skills: ["Python"],
  },
  {
    id: "backend-development",
    category: "Backend Development",
    description: "robust APIs and data-driven web applications",
    skills: ["Django", "REST APIs", "PostgreSQL"],
  },
  {
    id: "infrastructure-operations",
    category: "Infrastructure & Operations",
    description: "containerization, cloud deployment, and CI/CD pipelines",
    skills: ["Docker", "Azure", "Linux", "CI/CD"],
  },
];

const additionalTechnologies: string[] = [
  "Django REST Framework",
  "Celery",
  "Redis",
  "Git",
  "Nginx",
  "Gunicorn",
  "HTML/CSS",
  "JavaScript",
  "Tailwind CSS",
  "GraphQL",
  "Ansible",
  "Github Copilot",
  "Github Actions",
];

type Certification = {
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  link: string;
};

const certifications: Certification[] = [
  {
    title: "Azure Fundamentals",
    issuer: "Microsoft",
    date: "2021",
    credentialId: "AZ-900",
    link: "https://www.credly.com/badges/0173669e-f050-424d-999a-f661555905a2/public_url",
  },
  {
    title: "Azure Administrator Associate",
    issuer: "Microsoft",
    date: "2023",
    credentialId: "AZ-104",
    link: "https://www.credly.com/badges/22073f0e-4bf8-41ef-beb3-9ac6c30dc1d8/public_url",
  },
];

type NavLink = {
  name: string;
  href: string;
};

const navLinks: NavLink[] = [
  { name: "Certifications", href: "#certifications" },
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Contact", href: "#contact" },
];

const focusAreas: Array<NavLink & { description: string }> = [
  {
    name: "Web applications",
    description: "Workflow tools & customer-facing products",
    href: "#about",
  },
  {
    name: "Automation",
    description: "Network automation & other workflows",
    href: "#automation-scripting",
  },
  {
    name: "Backend systems",
    description: "APIs & web applications",
    href: "#backend-development",
  },
];

type Toast = {
  type: "success" | "error";
  message: string;
};

type FormData = {
  name: string;
  email: string;
  projectType: string;
  message: string;
};

type ContactField = keyof FormData;
type ContactFieldErrors = Partial<Record<ContactField, string>>;

const emptyForm: FormData = {
  name: "",
  email: "",
  projectType: "",
  message: "",
};

const contactFields: ContactField[] = ["name", "email", "projectType", "message"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getContactFieldError(
  field: ContactField,
  value: string
): string | undefined {
  const trimmedValue = value.trim();

  switch (field) {
    case "name":
      if (!trimmedValue) return "Enter your name.";
      if (trimmedValue.length < 2) return "Use at least 2 characters.";
      if (trimmedValue.length > 100) return "Use 100 characters or fewer.";
      return undefined;
    case "email":
      if (!trimmedValue) return "Enter your email address.";
      if (!emailPattern.test(trimmedValue)) {
        return "Enter an email address like name@example.com.";
      }
      return undefined;
    case "projectType":
      if (trimmedValue.length > 200) return "Use 200 characters or fewer.";
      return undefined;
    case "message":
      if (!trimmedValue) return "Enter a message.";
      if (trimmedValue.length < 10) return "Use at least 10 characters.";
      if (trimmedValue.length > 5000) return "Use 5,000 characters or fewer.";
      return undefined;
  }
}

function validateContactForm(formData: FormData): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  for (const field of contactFields) {
    const error = getContactFieldError(field, formData[field]);
    if (error) errors[field] = error;
  }

  return errors;
}

function ArrowIcon({
  diagonal = false,
  className = "",
}: {
  diagonal?: boolean;
  className?: string;
}): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {diagonal ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M7 7h10v10" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16m-6-6 6 6-6 6" />
      )}
    </svg>
  );
}

export default function Home(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [honeypot, setHoneypot] = useState<string>("");

  useEffect(() => {
    if (!toast || toast.type === "error") return;

    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (
      name !== "name" &&
      name !== "email" &&
      name !== "projectType" &&
      name !== "message"
    ) {
      return;
    }

    setFormData((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => {
      if (!previous[name]) return previous;

      const error = getContactFieldError(name, value);
      const next = { ...previous };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setToast(null);
    const errors = validateContactForm(formData);
    setFieldErrors(errors);
    const firstInvalidField = contactFields.find((field) => errors[field]);
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          projectType: formData.projectType.trim(),
          message: formData.message.trim(),
          honeypot,
        }),
      });
      const data: { details?: string; error?: string } = await response.json();

      if (response.ok) {
        setToast({
          type: "success",
          message: "Message sent successfully! I'll get back to you soon.",
        });
        setFormData(emptyForm);
        setHoneypot("");
      } else {
        setToast({
          type: "error",
          message:
            data.details || data.error || "Failed to send message. Please try again.",
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setToast({
        type: "error",
        message: "We couldn't send your message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "min-h-[3.25rem] w-full border border-portfolio-line bg-portfolio-field px-4 py-3 text-base text-portfolio-ink placeholder:text-portfolio-muted focus:border-portfolio-blue focus:outline-none focus:ring-2 focus:ring-portfolio-blue disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="min-h-screen bg-portfolio-paper font-portfolio text-portfolio-ink [color-scheme:dark] selection:bg-portfolio-blue selection:text-portfolio-deep">
      <div
        hidden
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: designContract }}
      />

      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="keywords"
          content="Rodney Jan Mandap, freelance software engineer, Python, Django, REST API developer, automation, web applications"
        />
        <meta name="author" content="Rodney Jan Mandap" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={siteUrl} />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Rodney Jan Mandap" />
        <meta property="og:image" content={socialImageUrl} />
        <meta property="og:image:alt" content="Rodney Jan Mandap" />
        <meta property="profile:first_name" content="Rodney Jan" />
        <meta property="profile:last_name" content="Mandap" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={socialImageUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <a
        href="#main"
        className="sr-only z-[60] bg-portfolio-button px-4 py-3 text-portfolio-button-text focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className="fixed right-4 top-4 z-[70] flex max-w-sm items-start gap-5 border border-portfolio-line bg-portfolio-field p-5 text-sm text-portfolio-ink shadow-lg"
        >
          <div>
            <p className="font-bold">
              {toast.type === "success" ? "Message sent" : "Message not sent"}
            </p>
            <p className="mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-auto text-2xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portfolio-blue"
          >
            &times;
          </button>
        </div>
      )}

      <nav
        aria-label="Main navigation"
        className="relative z-20 border-b border-portfolio-ink/[0.15] bg-portfolio-paper"
      >
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
          <div className="flex min-h-[5rem] items-center justify-between gap-6">
            <a
              href="#hero"
              className="group inline-flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center bg-portfolio-button font-portfolio-display text-xl font-bold tracking-wide text-portfolio-button-text"
              >
                RM
              </span>
              <span className="whitespace-nowrap text-xs font-bold leading-tight sm:text-sm">
                Rodney Jan Mandap
                <span className="mt-0.5 block text-xs font-medium text-portfolio-muted">
                  Software Engineer
                </span>
              </span>
            </a>

            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-semibold text-portfolio-ink transition-colors hover:text-portfolio-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? "Close" : "Menu"}
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" d="M5 5l14 14M19 5 5 19" />
                ) : (
                  <path strokeLinecap="round" d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>
          </div>

          <div id="mobile-navigation" hidden={!mobileMenuOpen} className="md:hidden">
            <div className="grid border-t border-portfolio-ink/[0.15] py-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portfolio-blue"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main id="main">
        <section
          id="hero"
          className="mx-auto max-w-[1440px] px-6 pb-12 pt-8 sm:px-10 sm:pb-24 sm:pt-20 lg:px-16 lg:pb-32 lg:pt-24"
        >
          <div className="grid items-stretch gap-6 sm:gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16">
            <div className="flex flex-col items-start justify-center">
              <h1 className="font-portfolio-display text-[clamp(2.75rem,12vw,4.25rem)] font-semibold leading-[0.94] tracking-[-0.025em] sm:text-[clamp(3.25rem,8vw,6rem)]">
                <span className="block">Software &amp;</span>{" "}
                <span className="block">automation,</span>{" "}
                <span className="block text-portfolio-blue">built to work.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-[1.8] text-portfolio-muted sm:mt-8 sm:text-lg">
                Hello, I&apos;m <strong className="font-bold text-portfolio-ink">Rodney Jan Mandap</strong>,
                a software engineer building web applications and automating network
                operations and other manual processes into end-to-end workflows.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 sm:mt-8 sm:gap-y-4">
                <a
                  href="#contact"
                  className="inline-flex min-h-12 items-center gap-8 bg-portfolio-button px-6 py-3 text-sm font-bold text-portfolio-button-text transition-colors hover:bg-portfolio-button-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue"
                >
                  Talk to Me
                  <ArrowIcon className="h-5 w-5" />
                </a>
                <a
                  href="#about"
                  className="inline-flex min-h-12 items-center gap-2 text-sm font-bold underline decoration-portfolio-blue underline-offset-4 hover:text-portfolio-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue"
                >
                  More about me
                  <ArrowIcon className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-6 flex items-baseline gap-3 border-t border-portfolio-ink/20 pt-5 sm:mt-12">
                <span className="text-sm font-semibold text-portfolio-muted">
                  Experience since
                </span>
                <span className="font-portfolio-display text-4xl font-semibold">2017</span>
              </div>
            </div>

            <aside className="flex flex-col bg-portfolio-accent p-5 sm:p-8 lg:p-10">
              <h2 className="font-portfolio-display text-3xl font-semibold">
                Areas of work
              </h2>
              <ul className="mt-5 border-t border-portfolio-ink/25">
                {focusAreas.map((area) => (
                  <li key={area.name} className="border-b border-portfolio-ink/25">
                    <a
                      href={area.href}
                      className="group flex min-h-[5.5rem] items-center justify-between gap-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-portfolio-blue"
                    >
                      <span>
                        <span className="block text-lg font-bold">{area.name}</span>
                        <span className="mt-1 block text-sm text-portfolio-muted">
                          {area.description}
                        </span>
                      </span>
                      <ArrowIcon
                        className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid grid-cols-[7.5rem_minmax(0,1fr)] items-stretch sm:mt-8 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <Image
                  src="/myPic.jpeg"
                  alt="Rodney Jan Mandap"
                  width={512}
                  height={512}
                  priority
                  className="h-full min-h-[7.5rem] w-full object-cover"
                />
                <div className="flex flex-col justify-end bg-portfolio-deep p-5 text-white sm:p-6">
                  <p className="text-sm font-bold">Rodney Jan Mandap</p>
                  <p className="mt-1 text-sm text-portfolio-light">Software Engineer</p>
                  <a
                    href="https://github.com/rodneymandap"
                    aria-label="View Rodney Jan Mandap's GitHub profile"
                    className="mt-3 inline-flex w-fit items-center gap-1 text-sm font-bold text-white underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  >
                    GitHub profile
                    <ArrowIcon diagonal className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="certifications" className="scroll-mt-6">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20 lg:px-16 lg:py-32">
            <div>
              <h2 className="font-portfolio-display text-5xl font-semibold leading-none sm:text-6xl">
                Certifications
              </h2>
              <p className="mt-5 max-w-sm text-base leading-relaxed text-portfolio-muted">
                Each certification links to its Credly verification page.
              </p>
            </div>
            <div className="border-b border-portfolio-ink/25">
              {certifications.map((certification) => (
                <article
                  key={certification.credentialId}
                  className="grid gap-4 border-t border-portfolio-ink/25 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8"
                >
                  <div>
                    <h3 className="text-xl font-bold">{certification.title}</h3>
                    <p className="mt-2 text-sm text-portfolio-muted">
                      {certification.issuer} &middot; {certification.date}
                    </p>
                    <p className="mt-1 text-sm text-portfolio-muted">
                      ID: {certification.credentialId}
                    </p>
                  </div>
                  <a
                    href={certification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${certification.title} on Credly (opens in a new tab)`}
                    className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold underline decoration-portfolio-blue underline-offset-4 hover:text-portfolio-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue"
                  >
                    View {certification.title}
                    <ArrowIcon diagonal className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="about"
          className="scroll-mt-6 border-t border-portfolio-ink/[0.15]"
        >
          <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 sm:py-24 lg:px-16 lg:py-32">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
              <h2 className="font-portfolio-display text-5xl font-semibold leading-none sm:text-6xl">
                About Me
              </h2>
              <p className="max-w-3xl text-base leading-[1.8] text-portfolio-muted">
                I build web applications and backend systems, and automate network
                operations and other manual processes through end-to-end workflows
                that connect applications, infrastructure, and existing tools. My
                background in automation and backend engineering helps me design
                reliable, maintainable systems that are safe to operate in
                production.
              </p>
            </div>
          </div>
        </section>

        <section
          id="skills"
          className="scroll-mt-6 bg-portfolio-deep text-portfolio-ink"
        >
          <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20 lg:px-16 lg:py-32">
            <div>
              <h2 className="max-w-sm font-portfolio-display text-5xl font-semibold leading-none sm:text-6xl">
                Skills &amp; Technologies
              </h2>
            </div>
            <div>
              <div className="space-y-10">
                {skillCategories.map((group) => (
                  <div key={group.category} id={group.id} className="scroll-mt-6">
                    <h3 className="text-lg font-bold">{group.category}</h3>
                    <p className="mt-1 text-sm text-portfolio-light">{group.description}</p>
                    <ul className="mt-5 grid gap-x-8 sm:grid-cols-2">
                      {group.skills.map((skill) => (
                        <li
                          key={skill}
                          className="border-t border-white/25 py-3 text-sm font-semibold"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-12 border-t border-white/25 pt-6">
                <h3 className="text-sm font-bold">Other technologies I work with</h3>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-portfolio-light">
                  {additionalTechnologies.map((technology) => (
                    <li key={technology}>{technology}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="scroll-mt-6 bg-portfolio-accent"
        >
          <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20 lg:px-16 lg:py-32">
            <div>
              <h2 className="max-w-md font-portfolio-display text-5xl font-semibold leading-none sm:text-6xl">
                Let&apos;s Build Something Great
              </h2>
              <p className="mt-6 max-w-md text-base leading-[1.8] text-portfolio-muted">
                Have a project or an opportunity in mind? Tell me what you&apos;re
                looking for.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-7 gap-y-4">
                <a
                  href="https://github.com/rodneymandap"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-bold underline decoration-portfolio-blue underline-offset-4 hover:text-portfolio-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue"
                >
                  GitHub
                  <ArrowIcon diagonal className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/rjmandap/"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-bold underline decoration-portfolio-blue underline-offset-4 hover:text-portfolio-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue"
                >
                  LinkedIn
                  <ArrowIcon diagonal className="h-4 w-4" />
                </a>
              </div>
            </div>

            <form
              aria-label="Contact form"
              className="space-y-6"
              noValidate
              onSubmit={handleFormSubmit}
            >
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-bold">
                    Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your Name"
                    className={inputClassName}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={isSubmitting}
                    autoComplete="name"
                    aria-invalid={fieldErrors.name ? "true" : undefined}
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                  />
                  {fieldErrors.name && (
                    <p
                      id="name-error"
                      role="alert"
                      className="mt-2 text-sm font-semibold text-portfolio-ink"
                    >
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-bold">
                    Email <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@email.com"
                    className={inputClassName}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    autoComplete="email"
                    aria-invalid={fieldErrors.email ? "true" : undefined}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  />
                  {fieldErrors.email && (
                    <p
                      id="email-error"
                      role="alert"
                      className="mt-2 text-sm font-semibold text-portfolio-ink"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="projectType" className="mb-2 block text-sm font-bold">
                  What would you like to discuss? <span className="font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  id="projectType"
                  name="projectType"
                  placeholder="e.g., Automation project or engineering role"
                  className={inputClassName}
                  value={formData.projectType}
                  onChange={handleInputChange}
                  maxLength={200}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.projectType ? "true" : undefined}
                  aria-describedby={
                    fieldErrors.projectType ? "project-type-error" : undefined
                  }
                />
                {fieldErrors.projectType && (
                  <p
                    id="project-type-error"
                    role="alert"
                    className="mt-2 text-sm font-semibold text-portfolio-ink"
                  >
                    {fieldErrors.projectType}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-bold">
                  Message <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell me about your project or opportunity..."
                  className={`${inputClassName} resize-y`}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  minLength={10}
                  maxLength={5000}
                  disabled={isSubmitting}
                  aria-invalid={fieldErrors.message ? "true" : undefined}
                  aria-describedby={fieldErrors.message ? "message-error" : undefined}
                />
                {fieldErrors.message && (
                  <p
                    id="message-error"
                    role="alert"
                    className="mt-2 text-sm font-semibold text-portfolio-ink"
                  >
                    {fieldErrors.message}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center gap-8 bg-portfolio-button px-6 py-3 text-sm font-bold text-portfolio-button-text transition-colors hover:bg-portfolio-button-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-portfolio-blue disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  {!isSubmitting && <ArrowIcon className="h-5 w-5" />}
                </button>
                <p className="text-sm text-portfolio-muted">* Required fields</p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-portfolio-deep text-portfolio-ink">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
          <p>
            &copy; {new Date().getFullYear()} Rodney Jan Mandap. All rights reserved.
          </p>
          <p className="text-portfolio-light">Freelance Software Engineer</p>
        </div>
      </footer>
    </div>
  );
}
