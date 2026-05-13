
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  onShare?: () => void;
  isDarkMode?: boolean;
}

const WebsitePreview: React.FC<Props> = ({ profile, onShare, isDarkMode = false }) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string>('All');
  const [scrolled, setScrolled] = useState(false);

  // Reset filter when template changes to avoid confusion if the new template has no filter UI
  useEffect(() => {
    setSelectedTech('All');
  }, [profile.websiteTemplate]);
  const textStyle = { color: profile.themeColor || '#4f46e5' };
  const themeStyle = textStyle;
  const bgStyle = { backgroundColor: profile.themeColor || '#4f46e5' };
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = isDarkMode;
  const bgColor = isDark ? 'bg-slate-950' : 'bg-white';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-600';
  const borderColor = isDark ? 'border-slate-800' : 'border-slate-100';
  const cardBg = isDark ? 'bg-slate-900' : 'bg-slate-50';

  // Extract unique technologies from all projects
  const allTechs = useMemo(() => {
    const techs = new Set<string>();
    profile.projects?.forEach(p => {
      p.techStack?.forEach(t => techs.add(t));
    });
    return ['All', ...Array.from(techs).sort()];
  }, [profile.projects]);

  const SectionWrapper: React.FC<{ id: string, title: string, isVisible: boolean, children?: React.ReactNode }> = ({ id, title, children, isVisible }) => {
    if (!isVisible) return null;
    return (
      <section id={id} className="py-32 px-8 relative z-10 border-t border-current/5">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.4em] mb-4 block opacity-40">{title}</span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">{title}</h2>
          </div>
          {children}
        </div>
      </section>
    );
  };

  // Filter projects based on selected tech
  const filteredProjects = useMemo(() => {
    const projects = profile.projects || [];
    if (selectedTech === 'All') return projects;
    return projects.filter(p => p.techStack?.includes(selectedTech));
  }, [profile.projects, selectedTech]);

  // Smooth scroll handler
  const scrollToSection = (e: React.MouseEvent | null, id: string) => {
    if (e) e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Removed history.pushState to fix SecurityError in sandboxed environments
      setActiveSection(id);
    }
  };

  // Intersection Observer to track active section on scroll
  useEffect(() => {
    const sections = ['about', 'work', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          setActiveSection(id);
          // Removed history.replaceState to fix SecurityError in sandboxed environments
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!profile.websiteTemplate || profile.websiteTemplate === 'modern') {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-500 font-sans noise-bg`}>
        {/* Navigation */}
        <nav className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? `${isDark ? 'bg-slate-950/80' : 'bg-white/80'} backdrop-blur-md py-4 shadow-lg shadow-black/5` : 'bg-transparent py-8'}`}>
          <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-black tracking-tighter" 
              style={textStyle}
            >
              {profile.name.split(' ')[0].toUpperCase()}
            </motion.span>
            <div className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em]">
              {[
                { label: 'Work', id: 'work', visible: profile.sectionVisibility?.projects },
                { label: 'About', id: 'about', visible: profile.sectionVisibility?.summary },
                { label: 'Awards', id: 'awards', visible: profile.sectionVisibility?.awards && profile.awards?.length > 0 },
                { label: 'Achievements', id: 'achievements', visible: profile.sectionVisibility?.achievements && profile.achievements?.length > 0 },
                { label: 'Contact', id: 'contact', visible: true }
              ].filter(item => item.visible).map((item, i) => (
                <motion.button 
                  key={item.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`transition-all hover:opacity-100 relative group ${activeSection === item.id ? 'opacity-100' : 'opacity-40'}`}
                >
                  {item.label}
                  <span className={`absolute -bottom-2 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full`} style={bgStyle}></span>
                </motion.button>
              ))}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="min-h-screen flex flex-col justify-center items-center text-center px-8 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                x: [0, 100, 0],
                y: [0, 50, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20" 
              style={bgStyle}
            ></motion.div>
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
                x: [0, -100, 0],
                y: [0, -50, 0]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] rounded-full blur-[150px] opacity-10" 
              style={bgStyle}
            ></motion.div>
          </div>

          <div className="relative z-10 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block text-xs font-bold uppercase tracking-[0.4em] mb-8 opacity-40">Digital Craftsman</span>
              <h1 className="text-7xl md:text-[10rem] font-black leading-[0.85] tracking-tighter mb-10 uppercase">
                {(profile.name || '').split(' ').map((word, i) => (
                  <span key={i} className="block overflow-hidden">
                    <motion.span 
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="block"
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h1>
              <p className="text-xl md:text-3xl font-medium opacity-60 max-w-2xl mx-auto leading-relaxed mb-12">
                {profile.title} specialized in building <span className="text-slate-900 dark:text-white italic">exceptional</span> digital experiences.
              </p>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex flex-col md:flex-row justify-center gap-6"
              >
                <button 
                  onClick={(e) => scrollToSection(e, 'work')}
                  className="px-10 py-5 rounded-full font-bold text-white shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                  style={bgStyle}
                >
                  Explore Work
                </button>
                <button 
                  onClick={(e) => scrollToSection(e, 'contact')}
                  className={`px-10 py-5 rounded-full font-bold border ${borderColor} hover:bg-slate-50 dark:hover:bg-slate-900 transition-all`}
                >
                  Get in Touch
                </button>
              </motion.div>
            </motion.div>
          </div>

          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20"
          >
            <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-current rounded-full"></div>
            </div>
          </motion.div>
        </header>

        {/* Skills Marquee */}
        <div className="py-12 border-y border-current/5 bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
          <div className="flex overflow-hidden whitespace-nowrap">
            <div className="flex animate-marquee items-center gap-12 pr-12">
              {[...profile.skills, ...profile.skills, ...profile.skills].map((skill, i) => (
                <div key={i} className="flex items-center gap-6">
                  <span className="text-4xl md:text-6xl font-black uppercase tracking-tighter opacity-10">{skill}</span>
                  <div className="w-3 h-3 rounded-full" style={bgStyle}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Work Section */}
        <section id="work" className="py-32 px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.4em] mb-4 block opacity-40">Portfolio</span>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase">Selected<br/>Works</h2>
              </div>
              <p className="text-xl opacity-60 max-w-md leading-relaxed mb-4">
                A collection of projects where design meets engineering to solve complex problems.
              </p>
            </div>

            {/* Tech Filter */}
            <div className="flex flex-wrap gap-3 mb-20">
              {allTechs.map(tech => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    selectedTech === tech 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 scale-110 shadow-xl' 
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>

            {filteredProjects.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-24 md:gap-32">
                {filteredProjects.map((proj, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 60 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="group"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] mb-10 bg-slate-100 dark:bg-slate-900 shadow-2xl shadow-black/5">
                      <img 
                        src={`https://picsum.photos/1200/1500?random=${i + 700}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
                        alt={proj.title} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-12">
                        <div className="translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                          <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-4">{proj.techStack?.join(' • ')}</p>
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-indigo-50 transition-colors">
                              View Project <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-4xl font-black mb-4 uppercase tracking-tighter">{proj.title}</h3>
                        <p className="text-lg opacity-60 leading-relaxed max-w-md">{proj.description}</p>
                      </div>
                      <span className="text-6xl font-black opacity-5 tracking-tighter">0{i + 1}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-current/10 rounded-[2.5rem]">
                <p className="text-xl opacity-40 font-bold uppercase tracking-widest">No projects found for {selectedTech}</p>
              </div>
            )}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 px-8 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
          </div>
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[3rem] overflow-hidden group"
            >
              <img 
                src={`https://picsum.photos/1000/1000?seed=${profile.name}`} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" 
                alt={profile.name} 
              />
              <div className="absolute inset-0 border-[20px] border-white/10 rounded-[3rem]"></div>
            </motion.div>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.4em] mb-8 block text-indigo-400">About Me</span>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[0.9] tracking-tighter uppercase">
                Passionate about<br/><span className="text-indigo-500 italic">innovation</span> & design.
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed mb-12">
                {profile.summary}
              </p>
              <div className="grid grid-cols-2 gap-12">
                { profile.sectionVisibility?.experience && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-white/40">Experience</h4>
                    <div className="space-y-6">
                      {profile.experience?.slice(0, 3).map((exp, i) => (
                        <div key={i}>
                          <p className="font-bold">{exp.role}</p>
                          <p className="text-sm text-slate-500">{exp.company}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                { profile.sectionVisibility?.education && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-white/40">Education</h4>
                    <div className="space-y-6">
                      {profile.education?.slice(0, 2).map((edu, i) => (
                        <div key={i}>
                          <p className="font-bold">{edu.degree}</p>
                          <p className="text-sm text-slate-500">{edu.institution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Sections */}
        <SectionWrapper id="awards" title="Awards & Honors" isVisible={!!(profile.awards?.length && profile.sectionVisibility?.awards)}>
          <div className="grid md:grid-cols-2 gap-12">
            {profile.awards?.map((award, i) => (
              <div key={i} className="p-8 rounded-3xl border border-current/10 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="text-2xl font-bold mb-2">{award.title}</h3>
                <p className="text-slate-500 mb-4">{award.issuer} • {award.year}</p>
                <p className="text-sm opacity-60 leading-relaxed">{award.description}</p>
              </div>
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper id="achievements" title="Achievements" isVisible={!!(profile.achievements?.length && profile.sectionVisibility?.achievements)}>
          <div className="grid md:grid-cols-2 gap-8">
            {profile.achievements?.map((ach, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${profile.themeColor}15` }}>
                  <div className="w-2 h-2 rounded-full" style={bgStyle}></div>
                </div>
                <p className="text-xl font-medium leading-tight pt-2">{ach}</p>
              </div>
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper id="certifications" title="Certifications" isVisible={!!(profile.certifications?.length && profile.sectionVisibility?.certifications)}>
          <div className="grid md:grid-cols-3 gap-8">
            {profile.certifications?.map((cert, i) => (
              <div key={i} className="p-8 rounded-3xl border border-current/10">
                <h3 className="text-xl font-bold mb-2">{cert.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{cert.issuer}</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">{cert.year}</p>
              </div>
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper id="activities" title="Activities" isVisible={!!(profile.activities?.length && profile.sectionVisibility?.activities)}>
          <div className="flex flex-wrap gap-4">
            {profile.activities?.map((act, i) => (
              <span key={i} className="px-8 py-4 rounded-full border border-current/10 text-lg font-medium">
                {act}
              </span>
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper id="references" title="References" isVisible={!!(profile.references?.length && profile.sectionVisibility?.references)}>
          <div className="grid md:grid-cols-2 gap-12">
            {profile.references?.map((ref, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-current/5">
                <h3 className="text-2xl font-bold mb-2">{ref.name}</h3>
                <p className="text-lg text-indigo-500 font-medium mb-4">{ref.position} at {ref.company}</p>
                <p className="text-sm opacity-60 italic leading-relaxed">"{ref.comment}"</p>
              </div>
            ))}
          </div>
        </SectionWrapper>

        {profile.customSections?.map((section, i) => (
          <SectionWrapper key={i} id={`custom-${i}`} title={section.title} isVisible={profile.sectionVisibility?.customSections}>
            <div className="grid md:grid-cols-2 gap-8">
              {section.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-2.5 shrink-0" style={bgStyle}></div>
                  <p className="text-lg opacity-70 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </SectionWrapper>
        ))}

        {/* Contact Section */}
        <footer id="contact" className="py-40 px-8 text-center relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-6xl md:text-[12rem] font-black mb-16 leading-[0.8] tracking-tighter uppercase">
              Start a<br/><span style={textStyle}>Project</span>
            </h2>
            <a 
              href={`mailto:${profile.email}`} 
              className="text-2xl md:text-5xl font-bold border-b-8 border-current pb-4 hover:opacity-50 transition-all inline-block mb-24"
            >
              {profile.email}
            </a>
            
            <div className="flex flex-wrap justify-center gap-12 text-sm font-bold uppercase tracking-[0.3em] opacity-40">
              {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} className="hover:opacity-100 transition-opacity">LinkedIn</a>}
              {profile.socialLinks.github && <a href={profile.socialLinks.github} className="hover:opacity-100 transition-opacity">GitHub</a>}
              {profile.socialLinks.portfolio && <a href={profile.socialLinks.portfolio} className="hover:opacity-100 transition-opacity">Portfolio</a>}
            </div>
            
            <p className="mt-32 text-[10px] font-bold uppercase tracking-[0.5em] opacity-20">
              © {new Date().getFullYear()} {profile.name} — All Rights Reserved
            </p>
          </motion.div>
        </footer>
      </div>
    );
  }

  if (profile.websiteTemplate === 'startup') {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-500 font-sans`}>
        <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
          <span className="text-2xl font-bold tracking-tight" style={textStyle}>{(profile.name || '').split(' ')[0]}</span>
          <div className="hidden md:flex gap-8 text-sm font-medium opacity-60">
            <a href="#features" className="hover:opacity-100">Features</a>
            <a href="#work" className="hover:opacity-100">Work</a>
            <a href="#contact" className="hover:opacity-100">Contact</a>
          </div>
          <a href={`mailto:${profile.email}`} className="px-6 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:shadow-lg" style={bgStyle}>
            Hire Me
          </a>
        </nav>

        <header className="max-w-7xl mx-auto px-8 py-24 md:py-40 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-6 bg-indigo-500/10" style={textStyle}>Available for new projects</span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
              Engineering the <span style={textStyle}>future</span> of digital products.
            </h1>
            <p className="text-xl md:text-2xl opacity-60 max-w-3xl mx-auto leading-relaxed mb-12">
              {profile.summary}
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <a href="#work" className="px-8 py-4 rounded-xl font-bold text-white shadow-xl hover:scale-105 transition-all" style={bgStyle}>View My Work</a>
              <a href="#contact" className={`px-8 py-4 rounded-xl font-bold border ${borderColor} hover:bg-slate-50 dark:hover:bg-slate-900 transition-all`}>Get in Touch</a>
            </div>
          </motion.div>
        </header>

        <section id="features" className="max-w-7xl mx-auto px-8 py-24 border-t border-current/5">
          <div className="grid md:grid-cols-3 gap-12">
            {profile.sectionVisibility?.skills && profile.skills?.slice(0, 6).map((skill, i) => (
              <div key={i} className={`p-8 rounded-3xl border ${borderColor} hover:shadow-2xl transition-all duration-500 group`}>
                <div className="w-12 h-12 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${profile.themeColor}15` }}>
                  <div className="w-3 h-3 rounded-full" style={bgStyle}></div>
                </div>
                <h3 className="text-xl font-bold mb-4">{skill}</h3>
                <p className="text-sm opacity-60 leading-relaxed">Specialized in implementing high-performance solutions using {skill} and modern best practices.</p>
              </div>
            ))}
          </div>
        </section>

        {profile.sectionVisibility?.awards && profile.awards?.length > 0 && (
          <section className="max-w-7xl mx-auto px-8 py-24 border-t border-current/5">
            <h2 className="text-3xl font-bold mb-12 tracking-tight">Awards & Recognition</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {profile.awards.map((award, i) => (
                <div key={i} className={`p-8 rounded-3xl border ${borderColor}`}>
                  <h3 className="text-xl font-bold mb-2">{award.title}</h3>
                  <p className="text-sm opacity-60">{award.issuer} • {award.year}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="work" className="py-24 px-8 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold mb-16 tracking-tight">Featured Projects</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {profile.sectionVisibility?.projects && filteredProjects.map((proj, i) => (
                <div key={i} className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border ${borderColor} group`}>
                  <div className="aspect-video overflow-hidden">
                    <img src={`https://picsum.photos/800/600?random=${i + 600}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={proj.title} />
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-4">{proj.title}</h3>
                    <p className="text-sm opacity-60 mb-6 leading-relaxed">{proj.description}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {proj.techStack?.slice(0, 3).map((tech, idx) => (
                          <span key={idx} className="text-[10px] font-bold uppercase tracking-widest opacity-40">{tech}</span>
                        ))}
                      </div>
                      {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:underline inline-flex items-center gap-1" style={textStyle}>View Project <ExternalLink className="w-3 h-3" /></a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer id="contact" className="py-24 px-8 text-center border-t border-current/5">
          <h2 className="text-4xl font-bold mb-8">Let's build something great.</h2>
          <a href={`mailto:${profile.email}`} className="text-2xl font-bold hover:opacity-50 transition-opacity" style={textStyle}>
            {profile.email}
          </a>
          <div className="mt-16 flex justify-center gap-8 opacity-40 text-sm font-bold uppercase tracking-widest">
            {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin}>LinkedIn</a>}
            {profile.socialLinks.github && <a href={profile.socialLinks.github}>GitHub</a>}
          </div>
        </footer>
      </div>
    );
  }

  if (profile.websiteTemplate === 'minimalist') {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-500 font-mono selection:bg-black selection:text-white`}>
        <main className="max-w-2xl mx-auto px-8 py-24">
          <header className="mb-24">
            <h1 className="text-2xl font-bold mb-4">{profile.name || 'Your Name'}</h1>
            <p className="opacity-60 leading-relaxed">
              {profile.title}. Currently focusing on {profile.skills?.[0] || 'digital products'}.
            </p>
          </header>

          <section className="mb-24">
            <h2 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-8">Work</h2>
            <div className="space-y-12">
              {profile.sectionVisibility?.projects && filteredProjects.map((proj, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="font-bold group-hover:underline">{proj.title}</h3>
                    <span className="text-[10px] opacity-40">{new Date().getFullYear()}</span>
                  </div>
                  <p className="text-sm opacity-60 leading-relaxed">{proj.description}</p>
                  {proj.link && <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase font-bold mt-2 inline-flex items-center gap-1 hover:opacity-100 opacity-40">View Project <ExternalLink className="w-2.5 h-2.5" /></a>}
                </div>
              ))}
            </div>
          </section>

          {profile.sectionVisibility?.awards && profile.awards?.length > 0 && (
            <section className="mb-24">
              <h2 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-8">Awards</h2>
              <div className="space-y-6">
                {profile.awards.map((award, i) => (
                  <div key={i}>
                    <p className="font-bold">{award.title}</p>
                    <p className="text-sm opacity-60">{award.issuer} ({award.year})</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-24">
            <h2 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-8">History</h2>
            <div className="space-y-8">
              {profile.sectionVisibility?.experience && profile.experience?.map((exp, i) => (
                <div key={i} className="flex justify-between items-start gap-4">
                  <div className="text-sm">
                    <p className="font-bold">{exp.role}</p>
                    <p className="opacity-60">{exp.company}</p>
                  </div>
                  <span className="text-[10px] opacity-40 shrink-0">{exp.duration}</span>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-24 border-t border-current/10 flex justify-between items-center">
            <a href={`mailto:${profile.email}`} className="text-sm font-bold hover:underline">{profile.email}</a>
            <div className="flex gap-6 opacity-40 text-[10px] font-bold uppercase">
              {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin}>LI</a>}
              {profile.socialLinks.github && <a href={profile.socialLinks.github}>GH</a>}
            </div>
          </footer>
        </main>
      </div>
    );
  }

  if (profile.websiteTemplate === 'terminal') {
    return (
      <div className={`min-h-screen bg-black text-green-500 font-mono p-4 md:p-8 selection:bg-green-500 selection:text-black relative overflow-hidden`}>
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        <div className="absolute inset-0 pointer-events-none z-50 animate-pulse opacity-[0.02] bg-green-500"></div>
        
        <div className="max-w-4xl mx-auto border border-green-900/50 p-4 md:p-8 rounded shadow-[0_0_20px_rgba(34,197,94,0.1)] relative z-10">
          <header className="mb-12 border-b border-green-900/50 pb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="ml-2 text-xs opacity-50">bash — {profile.name.toLowerCase().replace(' ', '_')}</span>
            </div>
            <div className="text-sm opacity-70 mb-4">Last login: {new Date().toDateString()} on ttys001</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">
              <span className="text-green-800">$</span> whoami
            </h1>
            <p className="text-xl md:text-2xl text-green-400 mb-6">{profile.name || 'anonymous'}</p>
            <p className="text-green-600/80 leading-relaxed">
              <span className="text-green-800">$</span> cat bio.txt
              <br/>
              {profile.title}. Based in {profile.location}.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-green-800">$</span> ls ./projects
            </h2>
            <div className="grid gap-6">
              {profile.sectionVisibility?.projects && filteredProjects.map((proj, i) => {
                const Card = (
                  <div key={i} className={`border border-green-900/30 p-4 hover:bg-green-500/5 transition-colors group ${proj.link ? 'cursor-pointer' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-green-400 group-hover:text-green-300">
                          {proj.title.toLowerCase().replace(/\s+/g, '_')}.sh
                        </h3>
                        {proj.link && (
                          <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold uppercase tracking-widest">View Project</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs opacity-50">{proj.techStack?.[0]}</span>
                    </div>
                    <p className="text-sm text-green-700 group-hover:text-green-600">{proj.description}</p>
                  </div>
                );
                return proj.link ? (
                  <a key={i} href={proj.link} target="_blank" rel="noopener noreferrer" className="block outline-none">
                    {Card}
                  </a>
                ) : Card;
              })}
            </div>
          </section>

          {profile.sectionVisibility?.awards && profile.awards?.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-green-800">$</span> cat ./awards.json
              </h2>
              <div className="grid gap-4 text-sm">
                {profile.awards.map((award, i) => (
                  <div key={i} className="border-l-2 border-green-900/30 pl-4">
                    <p className="text-green-400 font-bold">{award.title}</p>
                    <p className="text-green-700">{award.issuer} ({award.year})</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile.sectionVisibility?.certifications && profile.certifications?.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-green-800">$</span> ls ./certs
              </h2>
              <div className="flex flex-wrap gap-4 text-sm">
                {profile.certifications.map((cert, i) => (
                  <div key={i} className="text-green-400">
                    [{cert.name.toLowerCase().replace(' ', '_')}.pdf]
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-green-800">$</span> history | grep "experience"
            </h2>
            <div className="space-y-4 text-sm">
              {profile.sectionVisibility?.experience && profile.experience?.map((exp, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-green-900">{100 + i}</span>
                  <div>
                    <span className="text-green-400 font-bold">{exp.role}</span> @ <span className="text-green-600">{exp.company}</span>
                    <span className="ml-2 opacity-40">({exp.duration})</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="border-t border-green-900/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6">
              {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} className="hover:underline">linkedin</a>}
              {profile.socialLinks.github && <a href={profile.socialLinks.github} className="hover:underline">github</a>}
              <a href={`mailto:${profile.email}`} className="hover:underline">email</a>
            </div>
            <div className="text-xs opacity-30">
              [SYSTEM READY] — {new Date().getFullYear()}
            </div>
          </footer>
        </div>
        <div className="fixed bottom-4 right-4 w-2 h-5 bg-green-500 animate-pulse"></div>
      </div>
    );
  }

  if (profile.websiteTemplate === 'magazine') {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-500 font-serif selection:bg-black selection:text-white noise-bg`}>
        <header className={`py-24 border-b-8 ${isDark ? 'border-white' : 'border-black'} px-8 md:px-16 relative overflow-hidden`}>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex justify-between items-end mb-16">
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-bold uppercase tracking-[0.5em]"
              >
                Vol. 01 / No. 01
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-bold uppercase tracking-[0.5em]"
              >
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </motion.span>
            </div>
            <h1 className="text-[18vw] md:text-[14vw] font-black leading-[0.75] tracking-tighter uppercase mb-16 overflow-hidden">
              <motion.span 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                {profile.name || 'Your Name'}
              </motion.span>
            </h1>
            <div className="grid md:grid-cols-12 gap-12 items-start">
              <div className="md:col-span-8">
                <p className="text-3xl md:text-6xl leading-[0.9] font-medium tracking-tight uppercase">
                  {profile.title} <span className="italic opacity-40">crafting</span> digital narratives.
                </p>
              </div>
              <div className="md:col-span-4 flex flex-col gap-6 items-end text-right">
                <p className="text-xl opacity-60 italic">Dispatch from {profile.location}</p>
                <div className="flex gap-8">
                  {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} className="text-xs font-bold uppercase border-b-2 border-current pb-1 hover:opacity-50 transition-opacity">LinkedIn</a>}
                  {profile.socialLinks.github && <a href={profile.socialLinks.github} className="text-xs font-bold uppercase border-b-2 border-current pb-1 hover:opacity-50 transition-opacity">GitHub</a>}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-current opacity-[0.02] -skew-x-12 translate-x-1/2"></div>
        </header>

        <main className="max-w-7xl mx-auto px-8 md:px-16 py-32">
          <section className="grid md:grid-cols-12 gap-24 mb-40">
            <div className="md:col-span-4 sticky top-32 h-fit">
              <h2 className="text-xs font-bold uppercase tracking-[0.6em] mb-12 opacity-30">The Archives</h2>
              <p className="text-2xl leading-tight italic mb-8">
                A curated selection of work that defines my creative direction and technical capabilities.
              </p>
              <div className="w-24 h-1 bg-current mb-12"></div>
              <div className="space-y-4">
                {profile.skills?.slice(0, 8).map((skill, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-40">
                    <span>0{i + 1}</span>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-8 gap-40">
              {profile.sectionVisibility.projects && filteredProjects.map((proj, i) => {
                const Card = (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`group ${proj.link ? 'cursor-pointer' : ''}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden mb-12 bg-slate-100 dark:bg-slate-900 border border-current/5">
                      <img 
                        src={`https://picsum.photos/1400/900?random=${i + 800}`} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" 
                        alt={proj.title} 
                      />
                      <div className="absolute top-8 left-8 mix-blend-difference text-white">
                        <span className="text-6xl font-black opacity-40">0{i+1}</span>
                      </div>
                      {proj.link && (
                        <div className="absolute bottom-8 right-8 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 border border-white/20">
                           <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-end mb-6">
                      <h3 className="text-6xl md:text-8xl font-black uppercase tracking-tighter group-hover:italic transition-all leading-none">
                        {proj.title}
                      </h3>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-30 mb-2">Project No. {i + 1}</span>
                    </div>
                    <p className="text-2xl opacity-70 max-w-2xl mb-10 leading-snug">{proj.description}</p>
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex flex-wrap gap-4">
                        {proj.techStack?.map((tech, idx) => (
                          <span key={idx} className="text-[10px] font-bold uppercase tracking-widest border-2 border-current px-4 py-2 rounded-full hover:bg-current hover:text-white transition-colors">{tech}</span>
                        ))}
                      </div>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-[0.3em] border-b-2 border-current pb-1 hover:opacity-50 transition-opacity inline-flex items-center gap-2">
                          View Project <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
                return Card;
              })}

              {/* Awards & Honors in Magazine */}
              {profile.sectionVisibility.awards && profile.awards?.length > 0 && (
                <div className="border-t-4 border-current pt-24">
                  <h2 className="text-xs font-bold uppercase tracking-[0.6em] mb-12 opacity-30">Awards & Honors</h2>
                  <div className="grid md:grid-cols-2 gap-16">
                    {profile.awards.map((award, i) => (
                      <div key={i} className="group">
                        <span className="text-xs font-bold opacity-30 block mb-4">{award.year}</span>
                        <h3 className="text-4xl font-black uppercase tracking-tight mb-4 group-hover:italic transition-all">{award.title}</h3>
                        <p className="text-xl opacity-60">{award.issuer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications in Magazine */}
              {profile.sectionVisibility.certifications && profile.certifications?.length > 0 && (
                <div className="border-t-4 border-current pt-24">
                  <h2 className="text-xs font-bold uppercase tracking-[0.6em] mb-12 opacity-30">Certifications</h2>
                  <div className="grid md:grid-cols-2 gap-16">
                    {profile.certifications.map((cert, i) => (
                      <div key={i} className="group">
                        <span className="text-xs font-bold opacity-30 block mb-4">{cert.year}</span>
                        <h3 className="text-4xl font-black uppercase tracking-tight mb-4 group-hover:italic transition-all">{cert.name}</h3>
                        <p className="text-xl opacity-60">{cert.issuer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="border-t-4 border-current pt-32 grid md:grid-cols-12 gap-24">
            <div className="md:col-span-4">
              <h2 className="text-[12vw] md:text-[8vw] font-black leading-none mb-12 tracking-tighter uppercase">Chronicle</h2>
              <p className="text-xl opacity-60 italic">Professional journey and milestones recorded over time.</p>
            </div>
            <div className="md:col-span-8 space-y-24">
              {profile.sectionVisibility.experience && profile.experience?.map((exp, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex flex-col md:flex-row justify-between gap-8 border-b-2 border-current/10 pb-12 group"
                >
                  <div className="max-w-xl">
                    <h3 className="text-4xl font-black uppercase tracking-tight mb-4 group-hover:text-indigo-500 transition-colors">{exp.role}</h3>
                    <p className="text-2xl italic opacity-70 mb-6">{exp.company}</p>
                    <p className="text-lg opacity-50 leading-relaxed">{exp.description}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm font-bold uppercase tracking-[0.3em] pt-2">{exp.duration}</span>
                    <span className="text-xs font-bold opacity-20">REF. {100 + i}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </main>

        <footer className={`py-40 px-8 md:px-16 border-t-8 ${isDark ? 'border-white' : 'border-black'} text-center relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
            <span className="text-[40vw] font-black uppercase tracking-tighter leading-none">Contact</span>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-8xl md:text-[14vw] font-black tracking-tighter mb-16 uppercase leading-none">Get in<br/>Touch</h2>
            <a href={`mailto:${profile.email}`} className="text-3xl md:text-6xl font-bold hover:opacity-50 transition-all underline decoration-8 underline-offset-[12px]">
              {profile.email}
            </a>
            <div className="mt-32 flex flex-col items-center gap-8">
              <div className="flex gap-12 text-sm font-bold uppercase tracking-[0.5em] opacity-40">
                {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} className="hover:opacity-100 transition-opacity">LinkedIn</a>}
                {profile.socialLinks.github && <a href={profile.socialLinks.github} className="hover:opacity-100 transition-opacity">GitHub</a>}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.8em] opacity-20">© {new Date().getFullYear()} {profile.name} — All Rights Reserved</p>
            </div>
          </motion.div>
        </footer>
      </div>
    );
  }

  if (profile.websiteTemplate === 'sidebar') {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-500 font-sans flex flex-col md:flex-row`}>
        {/* Sidebar Navigation */}
        <aside className={`w-full md:w-80 md:h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r ${borderColor} p-8 flex flex-col justify-between z-50 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
          <div>
            <h1 className="text-2xl font-black tracking-tighter mb-2" style={textStyle}>{profile.name}</h1>
            <p className="text-sm text-slate-500 mb-12">{profile.title}</p>
            
            <nav className="space-y-4">
              {[
                { label: 'About', id: 'about', visible: profile.sectionVisibility?.summary },
                { label: 'Work', id: 'work', visible: profile.sectionVisibility?.projects },
                { label: 'Experience', id: 'experience', visible: profile.sectionVisibility?.experience },
                { label: 'Awards', id: 'awards', visible: profile.sectionVisibility?.awards && profile.awards?.length > 0 },
                { label: 'Contact', id: 'contact', visible: true }
              ].filter(item => item.visible).map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`block text-sm font-bold uppercase tracking-widest transition-all hover:translate-x-2 ${activeSection === item.id ? '' : 'opacity-40'}`}
                  style={activeSection === item.id ? textStyle : {}}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-12 md:mt-0">
            <div className="flex gap-4 mb-6">
              {profile.socialLinks.linkedin && (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              )}
              {profile.socialLinks.github && (
                <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-500 transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">© {new Date().getFullYear()}</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <section id="about" className="min-h-screen flex flex-col justify-center p-8 md:p-24 scroll-mt-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-none">
                Building digital<br/>products with<br/>purpose.
              </h2>
              <p className="text-xl md:text-2xl text-slate-500 max-w-2xl leading-relaxed">
                I'm {profile.name}, a {profile.title} based in {profile.location}. I specialize in crafting intuitive interfaces and robust applications.
              </p>
            </motion.div>
          </section>

          <section id="work" className="p-8 md:p-24 bg-slate-50 dark:bg-slate-900/50 scroll-mt-0">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-16">Selected Projects</h2>
            <div className="grid gap-24">
              {profile.sectionVisibility.projects && filteredProjects.map((proj, i) => {
                const Card = (
                  <div key={i} className={`group grid md:grid-cols-2 gap-12 items-center ${proj.link ? 'cursor-pointer' : ''}`}>
                    <div className="aspect-video overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800 relative">
                      <img 
                        src={`https://picsum.photos/800/600?random=${i + 400}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        alt={proj.title} 
                      />
                      {proj.link && (
                        <div className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
                        {proj.title}
                        {proj.link && <ExternalLink className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />}
                      </h3>
                      <p className="text-slate-500 mb-6 leading-relaxed">{proj.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {proj.techStack?.map((tech, idx) => (
                          <span key={idx} className="text-[10px] font-bold uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-700">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
                return proj.link ? (
                  <a key={i} href={proj.link} target="_blank" rel="noopener noreferrer" className="block outline-none">
                    {Card}
                  </a>
                ) : Card;
              })}
            </div>
          </section>

          <section id="experience" className="p-8 md:p-24 scroll-mt-0">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-16">Work History</h2>
            <div className="space-y-12">
              {profile.sectionVisibility.experience && profile.experience?.map((exp, i) => (
                <div key={i} className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-8">
                  <div>
                    <h3 className="text-2xl font-bold">{exp.role}</h3>
                    <p className="text-slate-500">{exp.company}</p>
                  </div>
                  <span className="text-sm font-mono text-slate-400 pt-2">{exp.duration}</span>
                </div>
              ))}
            </div>
          </section>

          {profile.sectionVisibility.awards && profile.awards?.length > 0 && (
            <section id="awards" className="p-8 md:p-24 scroll-mt-0 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-16">Awards & Honors</h2>
              <div className="grid gap-8">
                {profile.awards.map((award, i) => (
                  <div key={i} className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div>
                      <h3 className="text-xl font-bold">{award.title}</h3>
                      <p className="text-slate-500">{award.issuer}</p>
                    </div>
                    <span className="text-sm font-mono text-slate-400">{award.year}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile.sectionVisibility.certifications && profile.certifications?.length > 0 && (
            <section id="certifications" className="p-8 md:p-24 scroll-mt-0">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-16">Certifications</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {profile.certifications.map((cert, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold">{cert.name}</h3>
                    <p className="text-sm text-slate-500">{cert.issuer}</p>
                    <p className="text-xs font-mono text-slate-400 mt-2">{cert.year}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section id="contact" className="p-8 md:p-24 bg-slate-950 text-white text-center scroll-mt-0">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">Ready to start?</h2>
            <a 
              href={`mailto:${profile.email}`}
              className="inline-block px-12 py-6 rounded-full text-xl font-bold transition-all hover:scale-105"
              style={bgStyle}
            >
              Get in touch
            </a>
          </section>
        </main>
      </div>
    );
  }

  const fontClass = profile.fontFamily === 'serif' ? 'font-serif' : profile.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const headingFontClass = profile.fontFamily === 'serif' ? 'font-serif' : profile.fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  // Template-specific rendering
  if (profile.websiteTemplate === 'bento') {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-500 font-sans noise-bg`}>
        <nav className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? `${isDark ? 'bg-slate-950/80' : 'bg-white/80'} backdrop-blur-md shadow-sm py-4` : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
            <span className={`text-xl font-black tracking-tighter ${headingFontClass}`} style={textStyle}>
              {profile.name.split(' ')[0].toUpperCase()}
            </span>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
              {[
                { label: 'Work', id: 'work', visible: profile.sectionVisibility.projects },
                { label: 'About', id: 'about', visible: profile.sectionVisibility.summary },
                { label: 'Awards', id: 'awards', visible: profile.sectionVisibility.awards && profile.awards?.length > 0 },
                { label: 'Contact', id: 'contact', visible: true }
              ].filter(item => item.visible).map((item) => (
                <button 
                  key={item.id}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`transition-colors hover:opacity-70 ${activeSection === item.id ? '' : 'opacity-50'}`}
                  style={activeSection === item.id ? textStyle : {}}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <main className="pt-32 pb-24 max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[220px]">
            {/* Hero / Intro Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`md:col-span-3 md:row-span-2 rounded-[2.5rem] p-12 flex flex-col justify-center relative overflow-hidden ${isDark ? 'bg-slate-900/50 border border-white/5' : 'bg-slate-100/50 border border-black/5'} backdrop-blur-sm`}
            >
              <div className="relative z-10">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs font-bold uppercase tracking-[0.4em] mb-6 block"
                >
                  Based in {profile.location}
                </motion.span>
                <h1 className={`text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tighter ${headingFontClass}`}>
                  {profile.name}
                </h1>
                <p className="text-xl md:text-2xl text-slate-500 max-w-xl leading-relaxed">
                  {profile.title} crafting <span className="text-slate-900 dark:text-white font-bold">digital excellence</span> through code and design.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 opacity-10 pointer-events-none blur-[100px]" style={bgStyle}></div>
            </motion.div>

            {/* Profile Image Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`rounded-[2.5rem] overflow-hidden relative group ${isDark ? 'bg-slate-800' : 'bg-white'} border ${borderColor}`}
            >
              <img 
                src={`https://picsum.photos/600/600?seed=${profile.name}`} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                alt={profile.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-white text-xs font-bold uppercase tracking-widest">About Me</span>
              </div>
            </motion.div>

            {/* Social Links Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-[2.5rem] p-8 flex flex-col justify-between ${isDark ? 'bg-slate-900/50 border border-white/5' : 'bg-white border border-black/5'} backdrop-blur-sm group`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Connect</span>
              <div className="flex flex-col gap-4">
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group/link">
                    <span className="font-bold group-hover/link:translate-x-1 transition-transform">LinkedIn</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border border-current/10 group-hover/link:bg-current group-hover/link:text-white transition-all">
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group/link">
                    <span className="font-bold group-hover/link:translate-x-1 transition-transform">GitHub</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border border-current/10 group-hover/link:bg-current group-hover/link:text-white transition-all">
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </a>
                )}
              </div>
            </motion.div>

            {/* Skills Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`md:col-span-2 rounded-[2.5rem] p-10 flex flex-col justify-between ${isDark ? 'bg-slate-900/50 border border-white/5' : 'bg-white border border-black/5'} backdrop-blur-sm`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 block">Expertise</span>
              <div className="flex flex-wrap gap-3">
                {profile.skills?.map((skill, i) => (
                  <span key={i} className={`text-xs font-bold px-4 py-2 rounded-2xl transition-all hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Projects Grid in Bento */}
            {profile.sectionVisibility.projects && filteredProjects.map((proj, i) => {
              const Card = (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className={`rounded-[2.5rem] overflow-hidden group relative h-full ${i % 3 === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-1'} ${isDark ? 'bg-slate-900' : 'bg-slate-100'} ${proj.link ? 'cursor-pointer' : ''}`}
                >
                  <img 
                    src={`https://picsum.photos/1000/1000?random=${i + 200}`} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0" 
                    alt={proj.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-10 flex flex-col justify-end text-white opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-2xl font-black uppercase tracking-tighter">{proj.title}</h4>
                        {proj.link && <ExternalLink className="w-5 h-5" />}
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2 opacity-80">{proj.description}</p>
                      {proj.link && (
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                          View Project <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
              return proj.link ? (
                <a key={i} href={proj.link} target="_blank" rel="noopener noreferrer" className={`block h-full outline-none ${i % 3 === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-1'}`}>
                  {Card}
                </a>
              ) : Card;
            })}

            {/* Experience Card */}
            {profile.sectionVisibility.experience && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`md:col-span-2 rounded-[2.5rem] p-10 ${isDark ? 'bg-slate-900/50 border border-white/5' : 'bg-white border border-black/5'} backdrop-blur-sm`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8 block">Experience</span>
                <div className="space-y-8">
                  {profile.experience?.slice(0, 3).map((exp, i) => (
                    <div key={i} className="flex justify-between items-start group/exp">
                      <div>
                        <h5 className="font-bold text-lg group-hover/exp:text-indigo-500 transition-colors">{exp.role}</h5>
                        <p className="text-sm text-slate-500">{exp.company}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">{exp.duration}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Awards Card */}
            {profile.sectionVisibility.awards && profile.awards?.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`rounded-[2.5rem] p-8 ${isDark ? 'bg-slate-900/50 border border-white/5' : 'bg-white border border-black/5'} backdrop-blur-sm`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 block">Awards</span>
                <div className="space-y-4">
                  {profile.awards.slice(0, 2).map((award, i) => (
                    <div key={i}>
                      <p className="font-bold text-sm leading-tight">{award.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{award.year}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Certifications Card */}
            {profile.sectionVisibility.certifications && profile.certifications?.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`rounded-[2.5rem] p-8 ${isDark ? 'bg-slate-900/50 border border-white/5' : 'bg-white border border-black/5'} backdrop-blur-sm`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 block">Certifications</span>
                <div className="space-y-4">
                  {profile.certifications.slice(0, 2).map((cert, i) => (
                    <div key={i}>
                      <p className="font-bold text-sm leading-tight">{cert.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{cert.issuer}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Achievements Card */}
            {profile.sectionVisibility.achievements && profile.achievements?.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`md:col-span-2 rounded-[2.5rem] p-10 ${isDark ? 'bg-slate-900/50 border border-white/5' : 'bg-white border border-black/5'} backdrop-blur-sm`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8 block">Achievements</span>
                <div className="grid grid-cols-2 gap-4">
                  {profile.achievements.slice(0, 4).map((ach, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={bgStyle}></div>
                      <p className="text-sm font-medium leading-tight">{ach}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contact Card */}
            <motion.a 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              href={`mailto:${profile.email}`}
              className="md:col-span-2 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center group relative overflow-hidden"
              style={bgStyle}
            >
              <div className="relative z-10 text-white">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] mb-4 block opacity-60">Get in touch</span>
                <h3 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase">Let's Create Together</h3>
                <p className="text-lg opacity-80 font-medium">{profile.email}</p>
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-white rounded-full blur-[100px]"
              ></motion.div>
            </motion.a>
          </div>
        </main>

        <footer className="py-12 text-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.5em] opacity-30">
          © {new Date().getFullYear()} {profile.name} — Built with Passion
        </footer>
      </div>
    );
  }

  if (profile.websiteTemplate === 'minimal') {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-500 font-sans selection:bg-indigo-100 selection:text-indigo-900`}>
        <main className="max-w-3xl mx-auto px-8 py-32">
          <header className="mb-24">
            <h1 className={`text-4xl font-bold mb-4 ${headingFontClass}`}>{profile.name}</h1>
            <p className="text-xl text-slate-500 leading-relaxed">
              {profile.title}. Currently in {profile.location}.
            </p>
            <div className="mt-8 flex gap-6">
              {profile.socialLinks.linkedin && (
                <a href={profile.socialLinks.linkedin} className="text-sm font-medium hover:underline decoration-2 underline-offset-4" style={textStyle}>LinkedIn</a>
              )}
              {profile.socialLinks.github && (
                <a href={profile.socialLinks.github} className="text-sm font-medium hover:underline decoration-2 underline-offset-4" style={textStyle}>GitHub</a>
              )}
              <a href={`mailto:${profile.email}`} className="text-sm font-medium hover:underline decoration-2 underline-offset-4" style={textStyle}>Email</a>
            </div>
          </header>

          <section className="mb-24">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-12">Projects</h2>
            <div className="space-y-16">
              {profile.sectionVisibility.projects && filteredProjects.map((proj, i) => {
                const Card = (
                  <div key={i} className={`group ${proj.link ? 'cursor-pointer' : ''}`}>
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-xl font-bold group-hover:underline decoration-2 underline-offset-4 flex items-center gap-2">
                        {proj.title}
                        {proj.link && <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">{proj.techStack?.[0]}</span>
                    </div>
                    <p className="text-slate-500 leading-relaxed">{proj.description}</p>
                    {proj.link && <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-40 transition-opacity mt-2 block">View Project ↗</span>}
                  </div>
                );
                return proj.link ? (
                  <a key={i} href={proj.link} target="_blank" rel="noopener noreferrer" className="block outline-none">
                    {Card}
                  </a>
                ) : Card;
              })}
            </div>
          </section>

          {profile.sectionVisibility.awards && profile.awards?.length > 0 && (
            <section className="mb-24">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-12">Awards</h2>
              <div className="space-y-8">
                {profile.awards.map((award, i) => (
                  <div key={i}>
                    <h3 className="font-bold">{award.title}</h3>
                    <p className="text-sm text-slate-500">{award.issuer} ({award.year})</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-24">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-12">Experience</h2>
            <div className="space-y-12">
              {profile.sectionVisibility.experience && profile.experience?.map((exp, i) => (
                <div key={i} className="flex gap-8">
                  <span className="text-xs font-mono text-slate-400 w-24 shrink-0 pt-1">{exp.duration}</span>
                  <div>
                    <h3 className="font-bold">{exp.role}</h3>
                    <p className="text-sm text-slate-500">{exp.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-24 border-t border-slate-100 dark:border-slate-800 text-slate-400 text-xs">
            © {new Date().getFullYear()} {profile.name}
          </footer>
        </main>
      </div>
    );
  }

  if (profile.websiteTemplate === 'creative') {
    return (
      <div className={`min-h-screen ${bgColor} ${textColor} transition-colors duration-500 font-sans overflow-x-hidden`}>
        <div className="sticky top-0 left-0 w-full h-2 z-50" style={bgStyle}></div>
        
        <main>
          <section className="h-screen flex flex-col justify-center px-8 md:px-24">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-xs font-bold uppercase tracking-[0.5em] mb-4 block opacity-50">Portfolio {new Date().getFullYear()}</span>
              <h1 className={`text-[12vw] font-black leading-[0.8] tracking-tighter uppercase ${headingFontClass}`}>
                {profile.name.split(' ')[0]}<br/>
                <span className="outline-text" style={{ WebkitTextStroke: `2px ${isDark ? 'white' : 'black'}`, color: 'transparent' }}>
                  {profile.name.split(' ')[1]}
                </span>
              </h1>
              <p className="mt-8 text-2xl md:text-4xl font-light max-w-2xl italic">
                {profile.title}
              </p>
            </motion.div>
          </section>

          <section className="py-32 px-8 md:px-24 bg-black text-white">
            <div className="grid md:grid-cols-2 gap-24">
              <div>
                <h2 className="text-6xl font-black mb-12 leading-none">THE<br/>WORK</h2>
                <p className="text-xl text-slate-400 leading-relaxed">
                  A collection of projects that push boundaries and explore new possibilities in digital design and development.
                </p>
              </div>
              <div className="space-y-32">
                {profile.sectionVisibility.projects && filteredProjects.map((proj, i) => {
                  const Card = (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className={`group ${proj.link ? 'cursor-pointer' : ''}`}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden mb-8">
                        <img 
                          src={`https://picsum.photos/800/1000?random=${i + 200}`} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                          alt={proj.title} 
                        />
                        <div className="absolute top-4 right-4 text-8xl font-black opacity-10">0{i+1}</div>
                        {proj.link && (
                          <div className="absolute bottom-4 right-4 p-4 bg-white/20 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-4xl font-bold mb-4 flex items-center gap-4">
                        {proj.title}
                        {proj.link && <ExternalLink className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-opacity" />}
                      </h3>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                          {proj.techStack?.map((tech, idx) => (
                            <span key={idx} className="text-xs border border-white/20 px-3 py-1 rounded-full">{tech}</span>
                          ))}
                        </div>
                        {proj.link && <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity border-b-2 border-white/50 pb-1">View Project</span>}
                      </div>
                    </motion.div>
                  );
                  return proj.link ? (
                    <a key={i} href={proj.link} target="_blank" rel="noopener noreferrer" className="block outline-none">
                      {Card}
                    </a>
                  ) : Card;
                })}
              </div>
            </div>
          </section>

          {profile.sectionVisibility.awards && profile.awards?.length > 0 && (
            <section className="py-32 px-8 md:px-24">
              <h2 className="text-6xl font-black mb-16 uppercase tracking-tighter">Recognition</h2>
              <div className="grid md:grid-cols-2 gap-12">
                {profile.awards.map((award, i) => (
                  <div key={i} className="group border-b-2 border-current/10 pb-12">
                    <span className="text-xs font-bold opacity-40 block mb-4">{award.year}</span>
                    <h3 className="text-4xl font-bold mb-4 group-hover:italic transition-all">{award.title}</h3>
                    <p className="text-xl opacity-60">{award.issuer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile.sectionVisibility.experience && profile.experience?.length > 0 && (
            <section className="py-32 px-8 md:px-24 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-6xl font-black mb-16 uppercase tracking-tighter">Journey</h2>
              <div className="space-y-16">
                {profile.experience.map((exp, i) => (
                  <div key={i} className="flex flex-col md:flex-row justify-between gap-8 group">
                    <div className="max-w-xl">
                      <h3 className="text-4xl font-bold mb-2 group-hover:text-indigo-500 transition-colors">{exp.role}</h3>
                      <p className="text-2xl italic opacity-60">{exp.company}</p>
                    </div>
                    <span className="text-xl font-bold opacity-40">{exp.duration}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="py-32 px-8 md:px-24">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-[15vw] font-black leading-none tracking-tighter mb-12">HELLO</h2>
              <a 
                href={`mailto:${profile.email}`}
                className="text-3xl md:text-6xl font-bold hover:italic transition-all"
                style={textStyle}
              >
                {profile.email}
              </a>
            </div>
          </section>
        </main>

        <footer className="p-8 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-widest">{profile.name}</span>
          <div className="flex gap-8">
            {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} className="text-xs font-bold uppercase tracking-widest hover:opacity-50">LinkedIn</a>}
            {profile.socialLinks.github && <a href={profile.socialLinks.github} className="text-xs font-bold uppercase tracking-widest hover:opacity-50">GitHub</a>}
          </div>
        </footer>

        <style dangerouslySetInnerHTML={{ __html: `
          .outline-text {
            -webkit-text-stroke: 2px ${isDark ? 'white' : 'black'};
            color: transparent;
            transition: all 0.5s ease;
          }
          .outline-text:hover {
            color: ${profile.themeColor};
            -webkit-text-stroke: 2px ${profile.themeColor};
          }
        `}} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${bgColor} min-h-screen ${textColor} overflow-hidden relative selection:bg-indigo-100 selection:text-indigo-900 ${fontClass} transition-colors duration-500`}>
      {/* Decorative gradient background */}
      <div className={`absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br ${isDark ? 'from-indigo-900/20' : 'from-indigo-50'} to-transparent -z-10 blur-3xl opacity-50`}></div>

      {/* Navbar */}
      <nav className={`max-w-7xl mx-auto px-8 py-8 flex justify-between items-center sticky top-0 ${isDark ? 'bg-slate-950/80' : 'bg-white/80'} backdrop-blur-md z-50 transition-colors duration-500`}>
        <motion.span 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-2xl font-black tracking-tighter cursor-pointer ${headingFontClass}`} 
          style={themeStyle}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {profile.name?.split(' ')[0] || "PG"}.
        </motion.span>
        <div className="flex gap-8 text-sm font-semibold text-slate-500 uppercase tracking-widest items-center">
          {['about', 'work', 'contact'].map((id, i) => (
            <motion.button 
              key={id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={(e) => scrollToSection(e, id)}
              className={`transition-all duration-300 relative py-1 focus:outline-none ${
                activeSection === id ? (isDark ? 'text-white' : 'text-slate-900') : 'hover:text-slate-900'
              }`}
            >
              {id}
              {activeSection === id && (
                <motion.span 
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 w-full h-0.5 rounded-full" 
                  style={bgStyle}
                ></motion.span>
              )}
            </motion.button>
          ))}
          {onShare && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onShare}
              className={`ml-4 p-2 rounded-full ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-slate-50 text-slate-400'} hover:text-indigo-600 transition-all shadow-sm`}
              title="Share Profile"
            >
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-24 md:py-32 grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-4" style={themeStyle}>Hello, I'm {profile.name || "Your Name"}</h2>
          <h1 className={`text-5xl md:text-7xl leading-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-8 ${headingFontClass}`}>
            Building digital experiences as a <span className="italic" style={themeStyle}>{profile.title || "Creative Pro"}</span>.
          </h1>
          <p className={`text-lg ${subTextColor} mb-10 max-w-lg leading-relaxed`}>
            {profile.summary || "This is where your professional summary will appear, highlighting your core strengths and values."}
          </p>
          <div className="flex gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection(null, 'work')}
              className="px-8 py-4 text-white font-bold rounded-full shadow-lg transition-transform" 
              style={bgStyle}
            >
              View Projects
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection(null, 'contact')}
              className={`px-8 py-4 border-2 ${isDark ? 'border-slate-800 text-white hover:bg-slate-900' : 'border-slate-200 text-slate-900 hover:bg-slate-50'} font-bold rounded-full transition-colors`}
            >
              Contact Me
            </motion.button>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className={`w-full aspect-square rounded-2xl overflow-hidden shadow-2xl relative z-10 ${isDark ? 'ring-1 ring-white/10' : ''}`}>
            <img src="https://picsum.photos/800/800" alt="Profile" className={`object-cover w-full h-full ${isDark ? '' : 'grayscale hover:grayscale-0'} transition-all duration-700`} />
          </div>
          <div className={`absolute -bottom-6 -right-6 w-full h-full border-4 ${isDark ? 'border-slate-800' : 'border-slate-100'} rounded-2xl -z-10 translate-x-4 translate-y-4`}></div>
        </motion.div>
      </section>

      {/* Experience / Stats Section */}
      {profile.sectionVisibility.experience && (
        <section id="about" className={`${isDark ? 'bg-slate-900' : 'bg-slate-900'} text-white py-24 scroll-mt-20 transition-colors duration-500`}>
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-3 gap-16">
              <div className="sticky top-24 h-fit">
                <h3 className={`text-3xl mb-6 ${headingFontClass}`}>Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill, i) => (
                    <span key={i} className="px-4 py-2 bg-white/10 rounded-full text-sm border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className={`text-3xl mb-8 ${headingFontClass}`}>Professional Experience</h3>
                <div className="space-y-16">
                  {profile.experience?.map((exp, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative"
                    >
                      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-white/10 pb-4 group-hover:border-white/30 transition-colors">
                        <div>
                          <h4 className="text-2xl font-bold group-hover:text-indigo-300 transition-colors leading-tight">{exp.role}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-400 font-medium">{exp.company}</span>
                            <span className="w-1 h-1 bg-slate-600 rounded-full hidden md:block"></span>
                            <span className="text-slate-500 font-mono text-sm block md:inline">{exp.duration}</span>
                          </div>
                        </div>
                      </div>
                      {exp.description && exp.description.length > 0 && (
                        <ul className="mt-6 space-y-3 pl-1">
                          {exp.description.map((point, idx) => (
                            <li key={idx} className="flex gap-4 text-slate-400 leading-relaxed text-sm md:text-base">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={bgStyle}></span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Projects Grid */}
      <section id="work" className="py-24 max-w-7xl mx-auto px-8 scroll-mt-20">
        <h2 className={`text-4xl mb-12 text-center ${headingFontClass} ${isDark ? 'text-white' : 'text-slate-900'}`}>Selected Work</h2>
        
        {/* Tech Filter */}
        {allTechs.length > 2 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {allTechs.map((tech) => (
              <button
                key={tech}
                onClick={() => setSelectedTech(tech)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 border-2 ${
                  selectedTech === tech 
                    ? 'text-white border-transparent' 
                    : `${isDark ? 'text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300' : 'text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600'}`
                }`}
                style={selectedTech === tech ? bgStyle : {}}
              >
                {tech}
              </button>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {filteredProjects.map((proj, i) => {
            const CardContent = (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className={`group relative overflow-hidden rounded-2xl aspect-video ${isDark ? 'bg-slate-900' : 'bg-slate-100'} shadow-sm hover:shadow-2xl transition-all duration-500 h-full ${proj.link ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <img 
                  src={`https://picsum.photos/800/450?random=${i + (selectedTech === 'All' ? 0 : allTechs.indexOf(selectedTech))}`} 
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isDark ? 'opacity-80 group-hover:opacity-100' : ''}`} 
                  alt={proj.title} 
                />
                <div className={`absolute inset-0 ${isDark ? 'bg-slate-950/85' : 'bg-slate-900/75'} opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8 text-white`}>
                  <div className="flex flex-wrap gap-2 mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    {proj.techStack?.map((tech, idx) => (
                      <span key={idx} className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-2xl font-bold mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{proj.title}</h4>
                  <p className="text-sm text-slate-200 line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100 mb-6">{proj.description}</p>
                  
                  {proj.link && (
                    <div className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-150 flex items-center gap-2 text-sm font-bold uppercase tracking-widest group/btn w-fit">
                      <span className="border-b-2 border-white/50 pb-1 group-hover/btn:border-indigo-400 group-hover/btn:text-indigo-300 transition-all duration-300">
                        View Project
                      </span>
                      <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 group-hover/btn:text-indigo-300" />
                    </div>
                  )}
                </div>
              </motion.div>
            );

            return proj.link ? (
              <a 
                key={`${proj.title}-${i}`} 
                href={proj.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
              >
                {CardContent}
              </a>
            ) : (
              <div key={`${proj.title}-${i}`} className="h-full">
                {CardContent}
              </div>
            );
          })}
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-24 text-center text-slate-400">
              <p className="text-lg">No projects found with the selected technology.</p>
            </div>
          )}
        </div>
      </section>

      {/* Awards & Honors Section */}
      {profile.sectionVisibility.awards && profile.awards?.length > 0 && (
        <section id="awards" className="py-24 max-w-7xl mx-auto px-8 border-t border-current/5">
          <h2 className={`text-4xl mb-12 ${headingFontClass} ${isDark ? 'text-white' : 'text-slate-900'}`}>Awards & Honors</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {profile.awards.map((award, i) => (
              <div key={i} className={`p-8 rounded-2xl border ${borderColor} hover:shadow-xl transition-all`}>
                <h3 className="text-xl font-bold mb-2">{award.title}</h3>
                <p className="text-sm opacity-60 mb-4">{award.issuer} • {award.year}</p>
                <p className="text-sm leading-relaxed opacity-70">{award.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications Section */}
      {profile.sectionVisibility.certifications && profile.certifications?.length > 0 && (
        <section id="certifications" className="py-24 max-w-7xl mx-auto px-8 border-t border-current/5">
          <h2 className={`text-4xl mb-12 ${headingFontClass} ${isDark ? 'text-white' : 'text-slate-900'}`}>Certifications</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {profile.certifications.map((cert, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${borderColor} bg-slate-50/50 dark:bg-slate-900/50`}>
                <h3 className="font-bold mb-1">{cert.name}</h3>
                <p className="text-xs opacity-60">{cert.issuer}</p>
                <p className="text-[10px] font-bold mt-4 uppercase tracking-widest opacity-40">{cert.year}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer id="contact" className={`py-24 border-t ${borderColor} text-center scroll-mt-20 transition-colors duration-500`}>
        <h2 className={`text-5xl mb-8 ${isDark ? 'text-white' : 'text-slate-900'} leading-tight ${headingFontClass}`}>Let's build something <br/> amazing together.</h2>
        <a href={`mailto:${profile.email}`} className="text-2xl font-bold underline decoration-2 underline-offset-8 hover:no-underline transition-all" style={themeStyle}>
          {profile.email || "hello@example.com"}
        </a>
        
        <div className="mt-12 flex justify-center gap-6">
          {profile.socialLinks.linkedin && (
            <a 
              href={profile.socialLinks.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`w-12 h-12 flex items-center justify-center rounded-full ${isDark ? 'bg-slate-900' : 'bg-slate-50'} text-slate-400 hover:text-white transition-all hover:scale-110 shadow-sm`}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = profile.themeColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc')}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          )}
          {profile.socialLinks.github && (
            <a 
              href={profile.socialLinks.github} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`w-12 h-12 flex items-center justify-center rounded-full ${isDark ? 'bg-slate-900' : 'bg-slate-50'} text-slate-400 hover:text-white transition-all hover:scale-110 shadow-sm`}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = profile.themeColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc')}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          )}
          {profile.socialLinks.portfolio && (
            <a 
              href={profile.socialLinks.portfolio} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`w-12 h-12 flex items-center justify-center rounded-full ${isDark ? 'bg-slate-900' : 'bg-slate-50'} text-slate-400 hover:text-white transition-all hover:scale-110 shadow-sm`}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = profile.themeColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc')}
            >
              <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </a>
          )}
        </div>

        <p className="mt-16 text-slate-400 text-xs font-medium tracking-wide">© {new Date().getFullYear()} {profile.name}. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
};

export default WebsitePreview;
