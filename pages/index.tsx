import Head from "next/head";
import Image from "next/image";
import { useState } from "react";

function calculateYearsOfExperience(): number {
  const startYear: number = 2016;
  const currentYear: number = new Date().getFullYear();
  return currentYear - startYear;
}

type Skill = {
  name: string;
  level: number;
  color: string;
  icon: string;
  iconType?: 'svg' | 'emoji';
};
const skills: Skill[] = [
  { name: "Python", level: 94, color: "bg-[#3776ab]", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", iconType: 'svg' },
  { name: "Django", level: 88, color: "bg-[#0c4b33]", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg", iconType: 'svg' },
  { name: "Docker", level: 85, color: "bg-[#2496ed]", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg", iconType: 'svg' },
  { name: "Azure", level: 80, color: "bg-[#0078d4]", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg", iconType: 'svg' },
  { name: "PostgreSQL", level: 80, color: "bg-[#336791]", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg", iconType: 'svg' },
  { name: "REST APIs", level: 90, color: "bg-[#10b981]", icon: "🔗", iconType: 'emoji' },
  { name: "Linux", level: 88, color: "bg-[#fcc624]", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg", iconType: 'svg' },
  { name: "CI/CD", level: 87, color: "bg-[#a855f7]", icon: "🔄", iconType: 'emoji' },
];

type Certification = {
  title: string;
  issuer: string;
  date: string;
  credentialId?: string;
  link?: string;
  icon: string;
  iconType?: 'svg' | 'emoji';
};
const certifications: Certification[] = [
  {
    title: "Azure Fundamentals",
    issuer: "Microsoft",
    date: "2021",
    credentialId: "AZ-900",
    link: "https://www.credly.com/badges/0173669e-f050-424d-999a-f661555905a2/public_url",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
    iconType: 'svg',
  },
  {
    title: "Azure Administrator Associate",
    issuer: "Microsoft",
    date: "2023",
    credentialId: "AZ-104",
    link: "https://www.credly.com/badges/22073f0e-4bf8-41ef-beb3-9ac6c30dc1d8/public_url",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg",
    iconType: 'svg',
  },
];

type Project = {
  title: string;
  description: string;
  tags: string[];
  link: string;
};
const projects: Project[] = [
  {
    title: "E-Commerce Platform",
    description: "Built a full-featured Django e-commerce platform with payment integration, inventory management, and customer portal for a retail client.",
    tags: ["Django", "Python", "PostgreSQL", "Stripe"],
    link: "#",
  },
  {
    title: "SaaS Dashboard Application",
    description: "Developed a multi-tenant SaaS dashboard with Django REST Framework, featuring real-time analytics and role-based access control.",
    tags: ["Django", "DRF", "React", "Docker"],
    link: "#",
  },
  {
    title: "API Integration Platform",
    description: "Created a Django-based API gateway that connects multiple third-party services, handling 50k+ daily requests for enterprise clients.",
    tags: ["Django", "REST APIs", "Celery", "Redis"],
    link: "#",
  },
  {
    title: "Content Management System",
    description: "Custom CMS built with Django for a media company, featuring workflow automation, SEO optimization, and multi-language support.",
    tags: ["Django", "Python", "PostgreSQL", "AWS"],
    link: "#",
  },
];

type NavLink = {
  name: string;
  href: string;
};
const navLinks: NavLink[] = [
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Certifications", href: "#certifications" },
  // { name: "Projects", href: "#projects" },
  { name: "Contact", href: "#contact" },
];

type ToastType = "info" | "success" | "error";

type FormData = {
  name: string;
  email: string;
  projectType: string;
  message: string;
};

export default function Home(): JSX.Element {
  const yearsOfExperience: number = calculateYearsOfExperience();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<ToastType>("info");
  const [toastMessage, setToastMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    projectType: "",
    message: "",
  });
  const [honeypot, setHoneypot] = useState<string>("");

  const showToastNotification = (type: ToastType, message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Client-side validation
    if (!formData.name.trim()) {
      showToastNotification("error", "Please enter your name");
      setIsSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      showToastNotification("error", "Please enter your email");
      setIsSubmitting(false);
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      showToastNotification(
        "error",
        "Please enter a message (at least 10 characters)"
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          honeypot,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToastNotification(
          "success",
          "Message sent successfully! I'll get back to you soon."
        );
        // Reset form
        setFormData({
          name: "",
          email: "",
          projectType: "",
          message: "",
        });
      } else {
        showToastNotification(
          "error",
          data.details || data.error || "Failed to send message. Please try again."
        );
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showToastNotification(
        "error",
        "An error occurred. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className="bg-dark-800 border border-dark-700 rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md">
            <div className="flex-shrink-0">
              {toastType === "success" && (
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toastType === "error" && (
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {toastType === "info" && (
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                {toastType === "success" && "Success"}
                {toastType === "error" && "Error"}
                {toastType === "info" && "Information"}
              </h3>
              <p className="text-dark-300 text-sm">
                {toastMessage}
              </p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="flex-shrink-0 text-dark-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Head>
        <title>Rodney Jan Mandap | Freelance Software Engineer</title>
        <meta name="description" content="Rodney Jan Mandap - Freelance Software Engineer specializing in web applications, REST APIs, and scalable Python solutions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-md border-b border-dark-800/50">
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo-white-no-label.png"
                  alt="RJM Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span class="text-white font-bold text-lg">RJM</span>';
                    }
                  }}
                />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                Rodney<span className="gradient-text">Mandap</span>
              </span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="nav-link">
                  {link.name}
                </a>
              ))}
              <a href="#contact" className="btn-primary text-sm">
                Hire Me
              </a>
            </div>

            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-dark-800">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block py-2 nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main>
        <section id="hero" className="min-h-screen flex items-center pt-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-dark-950"></div>
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent-azure/10 rounded-full blur-3xl"></div>

          <div className="section-container relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in">
                <p className="text-primary-400 font-mono text-sm mb-4">Hello, I&apos;m</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                  Rodney Jan Mandap
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold mb-6">
                  <span className="gradient-text">Software Engineer</span>
                </h2>
                <p className="text-xl text-dark-300 mb-6 max-w-lg">
                  With {yearsOfExperience}+ years of experience crafting robust web applications,
                  REST APIs, and scalable Python solutions for clients worldwide.
                </p>
                <div className="flex flex-wrap gap-4">
                  {/* <a href="#projects" className="btn-primary">
                    View My Work
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a> */}
                  <a href="#contact" className="btn-secondary">
                    Hire Me
                  </a>
                </div>

                <div className="flex items-center gap-6 mt-8 pt-8 border-t border-dark-800">
                  <div>
                    <p className="text-3xl font-bold text-white">{yearsOfExperience}+</p>
                    <p className="text-dark-400 text-sm">Years Experience</p>
                  </div>
                  <div className="w-px h-12 bg-dark-700"></div>
                  {/* <div>
                    <p className="text-3xl font-bold text-white">50+</p>
                    <p className="text-dark-400 text-sm">Projects Completed</p>
                  </div>
                  <div className="w-px h-12 bg-dark-700"></div>
                  <div>
                    <p className="text-3xl font-bold text-white">30+</p>
                    <p className="text-dark-400 text-sm">Happy Clients</p>
                  </div> */}
                </div>
              </div>

              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  <div className="w-80 h-80 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-azure/20 flex items-center justify-center animate-float">
                    <div className="w-64 h-64 rounded-full bg-dark-900 border border-dark-700 flex items-center justify-center text-8xl">
                      <Image
                        src="/myPic.jpeg"
                        alt="Rodney Jan Mandap"
                        width={512}
                        height={512}
                        className="object-cover rounded-full"
                      />
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-dark-800 border border-dark-700 rounded-xl p-3 animate-float" style={{ animationDelay: '1s' }}>
                    <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center p-1">
                      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg" alt="Django" className="w-full h-full" />
                    </div>
                    <p className="text-xs text-dark-300 mt-1">Django</p>
                  </div>
                  <div className="absolute top-1/2 -left-8 bg-dark-800 border border-dark-700 rounded-xl p-3 animate-float" style={{ animationDelay: '2s' }}>
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" className="w-8 h-8" />
                    <p className="text-xs text-dark-300 mt-1">Python</p>
                  </div>
                  <div className="absolute -bottom-4 right-1/4 bg-dark-800 border border-dark-700 rounded-xl p-3 animate-float" style={{ animationDelay: '0.5s' }}>
                    <span className="text-2xl">🔗</span>
                    <p className="text-xs text-dark-300 mt-1">REST API</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-24 relative">
          <div className="section-container">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-primary-400 font-mono text-sm mb-2">About Me</p>
                <h2 className="section-title">
                  Software Engineer
                  <span className="gradient-text"> Building Scalable Solutions</span>
                </h2>
                <p className="text-dark-300 mb-6 leading-relaxed">
                  I&apos;m Rodney, a software engineer specializing in Python and Django. I build reliable, efficient, and scalable web applications, helping clients turn ideas into practical digital solutions. My background in automation and backend engineering allows me to create systems that are both high-performing and easy to maintain.
                </p>
                <p className="text-dark-300 mb-8 leading-relaxed">
                  I take pride in writing clean, well-structured code and communicating clearly throughout every project. Whether it&apos;s a simple site or a complex application, I focus on delivering quality work on time, within budget, and built to support long-term growth.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <p className="text-2xl font-bold text-accent-python">Python</p>
                    <p className="text-dark-400 text-sm">Core Language</p>
                  </div>
                  <div className="card">
                    <p className="text-2xl font-bold text-[#092e20]">Django</p>
                    <p className="text-dark-400 text-sm">Primary Framework</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center text-2xl">
                      💼
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Freelance Flexibility</h3>
                      <p className="text-dark-400 text-sm">
                        Direct collaboration with clients, flexible schedules, and personalized attention to every project.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#092e20]/30 flex items-center justify-center text-2xl">
                      🎯
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Django Specialist</h3>
                      <p className="text-dark-400 text-sm">
                        Deep expertise in Django, DRF, and the Python ecosystem for robust web development.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-2xl">
                      🚀
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">End-to-End Delivery</h3>
                      <p className="text-dark-400 text-sm">
                        From concept to deployment, I handle the full development lifecycle for your project.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="skills" className="py-24 bg-dark-900/30">
          <div className="section-container">
            <div className="text-center mb-16">
              <p className="text-primary-400 font-mono text-sm mb-2">My Expertise</p>
              <h2 className="section-title">Skills & Technologies</h2>
              <p className="section-subtitle mx-auto">
                A focused toolkit for building modern Django web applications
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {skills.map((skill, index) => (
                <div key={skill.name} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {skill.iconType === 'svg' ? (
                        <div className={`w-8 h-8 ${skill.name === 'Django' ? 'bg-white rounded p-1' : ''} flex items-center justify-center`}>
                          <img src={skill.icon} alt={skill.name} className="w-full h-full" />
                        </div>
                      ) : (
                        <span className="text-2xl">{skill.icon}</span>
                      )}
                      <span className="font-semibold text-white">{skill.name}</span>
                    </div>
                    <span className="text-primary-400 font-mono text-sm">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-dark-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${skill.color} transition-all duration-1000`}
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-dark-400 mb-6">Other technologies I work with</p>
              <div className="flex flex-wrap justify-center gap-3">
                {["Django REST Framework", "Celery", "Redis", "Git", "Nginx", "Gunicorn", "AWS", "HTML/CSS", "JavaScript", "Tailwind CSS", "GraphQL", "Ansible", "Github Copilot", "Github Actions"].map((tech) => (
                  <span key={tech} className="skill-tag">{tech}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* <section id="projects" className="py-24">
          <div className="section-container">
            <div className="text-center mb-16">
              <p className="text-primary-400 font-mono text-sm mb-2">My Work</p>
              <h2 className="section-title">Featured Projects</h2>
              <p className="section-subtitle mx-auto">
                A selection of freelance projects showcasing my Django development expertise
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project, index) => (
                <div key={index} className="card group cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <svg className="w-5 h-5 text-dark-500 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-dark-400 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 bg-dark-800 text-dark-300 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <a href="#contact" className="btn-secondary">
                Discuss Your Project
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </section> */}

        <section id="certifications" className="py-24">
          <div className="section-container">
            <div className="text-center mb-16">
              <p className="text-primary-400 font-mono text-sm mb-2">Credentials</p>
              <h2 className="section-title">Certifications</h2>
              <p className="section-subtitle mx-auto">
                Professional certifications demonstrating expertise and commitment to continuous learning
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {certifications.map((cert, index) => (
                <div key={index} className="card group cursor-pointer hover:border-primary-500/50 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                      {cert.iconType === 'svg' ? (
                        <img src={cert.icon} alt={cert.issuer} className="w-10 h-10" />
                      ) : (
                        <span className="text-3xl">{cert.icon}</span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                        {cert.title}
                      </h3>
                      <p className="text-primary-400 font-medium mb-1">{cert.issuer}</p>
                      <p className="text-dark-400 text-sm mb-2">{cert.date}</p>
                      {cert.credentialId && (
                        <p className="text-dark-500 text-xs font-mono mb-3">
                          ID: {cert.credentialId}
                        </p>
                      )}
                      {cert.link && (
                        <a
                          href={cert.link}
                          className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Certificate
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 bg-dark-900/30">
          <div className="section-container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <p className="text-primary-400 font-mono text-sm mb-2">Get In Touch</p>
                <h2 className="section-title">Let&apos;s Build Something Great</h2>
                <p className="section-subtitle mx-auto">
                  Have a project in mind? I&apos;d love to hear about it. Let&apos;s discuss how I can help bring your vision to life.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleFormSubmit}>
                {/* Honeypot field - hidden from users but visible to bots */}
                <div style={{ position: "absolute", left: "-9999px" }}>
                  <label htmlFor="website">Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-dark-300 text-sm mb-2">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Your Name"
                      className="input-field"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-dark-300 text-sm mb-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="your@email.com"
                      className="input-field"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="projectType" className="block text-dark-300 text-sm mb-2">
                    Project Type
                  </label>
                  <input
                    type="text"
                    id="projectType"
                    name="projectType"
                    placeholder="e.g., Web Application, API Development, Consulting"
                    className="input-field"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-dark-300 text-sm mb-2">
                    Project Details <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell me about your project, timeline, and budget..."
                    className="input-field resize-none"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-12 pt-12 border-t border-dark-800">
                <div className="flex flex-wrap justify-center gap-6">
                  <a href="https://github.com/rodneymandap" className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                  <a href="https://www.linkedin.com/in/rjmandap/" className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-dark-800">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo-white-no-label.png"
                  alt="RJM Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = '<span class="text-white font-bold text-sm">RJM</span>';
                    }
                  }}
                />
              </div>
              <p className="text-dark-400 text-sm">
                &copy; {new Date().getFullYear()} Rodney Jan Mandap. All rights reserved.
              </p>
            </div>
            <p className="text-dark-500 text-sm">
              Freelance Software Engineer 
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
