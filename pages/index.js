import Head from "next/head";
import Image from "next/image";
import { useState } from "react";

function calculateYearsOfExperience() {
  const startYear = 2016;
  const currentYear = new Date().getFullYear();
  return currentYear - startYear;
}

const skills = [
  { name: "Python", level: 95, color: "bg-accent-python", icon: "🐍" },
  { name: "Docker", level: 90, color: "bg-accent-docker", icon: "🐳" },
  { name: "Azure", level: 85, color: "bg-accent-azure", icon: "☁️" },
  { name: "Django", level: 88, color: "bg-[#092e20]", icon: "🎯" },
  { name: "Ansible", level: 82, color: "bg-accent-ansible", icon: "⚙️" },
  { name: "Kubernetes", level: 80, color: "bg-blue-500", icon: "☸️" },
  { name: "CI/CD", level: 88, color: "bg-green-500", icon: "🔄" },
  { name: "Linux", level: 92, color: "bg-orange-500", icon: "🐧" },
];

const projects = [
  {
    title: "Cloud Infrastructure Automation",
    description: "Automated cloud infrastructure provisioning using Terraform and Ansible, reducing deployment time by 70%.",
    tags: ["Python", "Ansible", "Azure", "Terraform"],
    link: "#",
  },
  {
    title: "Microservices Platform",
    description: "Designed and deployed a containerized microservices architecture using Docker and Kubernetes on Azure.",
    tags: ["Docker", "Kubernetes", "Azure", "Python"],
    link: "#",
  },
  {
    title: "Django REST API",
    description: "Built a scalable REST API with Django REST Framework, handling 10k+ requests per minute.",
    tags: ["Django", "Python", "PostgreSQL", "Docker"],
    link: "#",
  },
  {
    title: "CI/CD Pipeline",
    description: "Implemented end-to-end CI/CD pipelines with automated testing, security scanning, and deployments.",
    tags: ["Azure DevOps", "Docker", "Python", "Ansible"],
    link: "#",
  },
];

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Contact", href: "#contact" },
];

export default function Home() {
  const yearsOfExperience = calculateYearsOfExperience();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>DevOps Engineer & Python Developer | Portfolio</title>
        <meta name="description" content="Professional portfolio of a DevOps Engineer and Python Developer specializing in cloud infrastructure, automation, and scalable solutions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-md border-b border-dark-800/50">
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            <a href="#" className="text-xl font-bold gradient-text">
              {"<DevOps />"}
            </a>
            
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="nav-link">
                  {link.name}
                </a>
              ))}
              <a href="#contact" className="btn-primary text-sm">
                Get In Touch
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
                <p className="text-primary-400 font-mono text-sm mb-4">Hello, I am</p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4">
                  A DevOps
                  <span className="block gradient-text">Engineer</span>
                </h1>
                <p className="text-xl text-dark-300 mb-6 max-w-lg">
                  With {yearsOfExperience}+ years of experience building scalable infrastructure, 
                  automating deployments, and developing Python applications.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#projects" className="btn-primary">
                    View My Work
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                  <a href="#contact" className="btn-secondary">
                    Contact Me
                  </a>
                </div>

                <div className="flex items-center gap-6 mt-8 pt-8 border-t border-dark-800">
                  <div>
                    <p className="text-3xl font-bold text-white">{yearsOfExperience}+</p>
                    <p className="text-dark-400 text-sm">Years Experience</p>
                  </div>
                  <div className="w-px h-12 bg-dark-700"></div>
                  <div>
                    <p className="text-3xl font-bold text-white">50+</p>
                    <p className="text-dark-400 text-sm">Projects Delivered</p>
                  </div>
                  <div className="w-px h-12 bg-dark-700"></div>
                  <div>
                    <p className="text-3xl font-bold text-white">99.9%</p>
                    <p className="text-dark-400 text-sm">Uptime Achieved</p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  <div className="w-80 h-80 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-azure/20 flex items-center justify-center animate-float">
                    <div className="w-64 h-64 rounded-full bg-dark-900 border border-dark-700 flex items-center justify-center text-8xl">
                      👨‍💻
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-dark-800 border border-dark-700 rounded-xl p-3 animate-float" style={{animationDelay: '1s'}}>
                    <span className="text-2xl">🐍</span>
                    <p className="text-xs text-dark-300 mt-1">Python</p>
                  </div>
                  <div className="absolute top-1/2 -left-8 bg-dark-800 border border-dark-700 rounded-xl p-3 animate-float" style={{animationDelay: '2s'}}>
                    <span className="text-2xl">🐳</span>
                    <p className="text-xs text-dark-300 mt-1">Docker</p>
                  </div>
                  <div className="absolute -bottom-4 right-1/4 bg-dark-800 border border-dark-700 rounded-xl p-3 animate-float" style={{animationDelay: '0.5s'}}>
                    <span className="text-2xl">☁️</span>
                    <p className="text-xs text-dark-300 mt-1">Azure</p>
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
                  Passionate About Building
                  <span className="gradient-text"> Reliable Systems</span>
                </h2>
                <p className="text-dark-300 mb-6 leading-relaxed">
                  I am a DevOps Engineer and Python Developer with a passion for automation, 
                  cloud infrastructure, and building scalable systems. My expertise lies in 
                  creating robust CI/CD pipelines, containerizing applications, and managing 
                  cloud environments.
                </p>
                <p className="text-dark-300 mb-8 leading-relaxed">
                  I specialize in Python development with Django, infrastructure as code with 
                  Ansible and Terraform, and container orchestration with Docker and Kubernetes. 
                  My goal is to bridge the gap between development and operations, ensuring 
                  smooth and efficient software delivery.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <p className="text-2xl font-bold text-primary-400">Python</p>
                    <p className="text-dark-400 text-sm">Primary Language</p>
                  </div>
                  <div className="card">
                    <p className="text-2xl font-bold text-accent-azure">Azure</p>
                    <p className="text-dark-400 text-sm">Cloud Platform</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center text-2xl">
                      🚀
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Automation First</h3>
                      <p className="text-dark-400 text-sm">
                        I believe in automating everything possible to reduce errors and increase efficiency.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent-docker/20 flex items-center justify-center text-2xl">
                      📦
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Container Expert</h3>
                      <p className="text-dark-400 text-sm">
                        Experienced in containerizing applications and orchestrating with Kubernetes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-2xl">
                      🔒
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Security Minded</h3>
                      <p className="text-dark-400 text-sm">
                        Security is integrated into every step of the development lifecycle.
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
                A comprehensive toolkit for building and managing modern infrastructure
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {skills.map((skill, index) => (
                <div key={skill.name} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{skill.icon}</span>
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
                {["Git", "GitHub Actions", "Terraform", "PostgreSQL", "Redis", "Nginx", "Prometheus", "Grafana", "Jenkins", "AWS", "REST APIs", "GraphQL"].map((tech) => (
                  <span key={tech} className="skill-tag">{tech}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="py-24">
          <div className="section-container">
            <div className="text-center mb-16">
              <p className="text-primary-400 font-mono text-sm mb-2">My Work</p>
              <h2 className="section-title">Featured Projects</h2>
              <p className="section-subtitle mx-auto">
                A selection of projects showcasing my expertise in DevOps and Python development
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
              <a href="#" className="btn-secondary">
                View All Projects
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 bg-dark-900/30">
          <div className="section-container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <p className="text-primary-400 font-mono text-sm mb-2">Get In Touch</p>
                <h2 className="section-title">Let&apos;s Work Together</h2>
                <p className="section-subtitle mx-auto">
                  Have a project in mind? I&apos;d love to hear about it. Let&apos;s discuss how I can help.
                </p>
              </div>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-dark-300 text-sm mb-2">Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-300 text-sm mb-2">Email</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-dark-300 text-sm mb-2">Subject</label>
                  <input 
                    type="text" 
                    placeholder="Project Inquiry"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-dark-300 text-sm mb-2">Message</label>
                  <textarea 
                    rows={5}
                    placeholder="Tell me about your project..."
                    className="input-field resize-none"
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary w-full">
                  Send Message
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>

              <div className="mt-12 pt-12 border-t border-dark-800">
                <div className="flex flex-wrap justify-center gap-6">
                  <a href="#" className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                  <a href="#" className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                  <a href="mailto:hello@example.com" className="flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
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
            <p className="text-dark-500 text-sm">
              &copy; {new Date().getFullYear()} DevOps Portfolio. All rights reserved.
            </p>
            <p className="text-dark-500 text-sm">
              Built with Next.js & Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
