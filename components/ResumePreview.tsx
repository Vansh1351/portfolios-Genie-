
import React from 'react';
import { motion } from 'motion/react';
import { Share2, ExternalLink } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  profile: UserProfile;
  onAddSkill?: (skill: string) => void;
  onShare?: () => void;
  settings?: {
    includeSummary: boolean;
    includeExperience: boolean;
    includeEducation: boolean;
    includeProjects: boolean;
    includeSkills: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

const ResumePreview: React.FC<Props> = ({ profile, onAddSkill, onShare, settings }) => {
  const handleAddSkill = () => {
    const skill = window.prompt("Enter a new skill:");
    if (skill && skill.trim() && onAddSkill) {
      onAddSkill(skill.trim());
    }
  };

  const fontClass = profile.fontFamily === 'serif' ? 'font-serif' : profile.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const themeColor = profile.themeColor;
  
  const fontSizeClass = settings?.fontSize === 'small' ? 'text-[0.8em]' : settings?.fontSize === 'large' ? 'text-[1.1em]' : '';

  const Header = ({ centered = false }: { centered?: boolean }) => (
    <header 
      className={`border-b-4 pb-8 flex ${centered ? 'flex-col items-center text-center' : 'justify-between items-end'}`}
      style={{ borderBottomColor: themeColor }}
    >
      <div className={centered ? 'mb-4' : ''}>
        <div className="flex items-center gap-4">
          <h1 className={`${centered ? 'text-5xl' : 'text-6xl'} font-bold uppercase tracking-tighter text-slate-900 mb-2 break-words max-w-full`}>
            {profile.name || "Your Name"}
          </h1>
          {onShare && (
            <button 
              onClick={onShare}
              className="p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all print:hidden no-print"
              title="Share Profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p 
          className="text-2xl font-semibold mt-1"
          style={{ color: themeColor }}
        >
          {profile.title || "Your Profession"}
        </p>
      </div>
      <div className={`${centered ? 'flex flex-wrap justify-center gap-x-6 gap-y-1' : 'text-right space-y-1'} text-sm text-slate-500`}>
        <p className="font-medium text-slate-700">{profile.email}</p>
        <p>{profile.phone}</p>
        <p>{profile.location}</p>
        {profile.socialLinks?.linkedin && (
          <p className="text-xs text-slate-400">{profile.socialLinks.linkedin}</p>
        )}
      </div>
    </header>
  );

  const Summary = () => (profile.summary && profile.sectionVisibility?.summary && (settings?.includeSummary !== false)) ? (
    <section className="break-inside-avoid">
      <h2 
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: themeColor, opacity: 0.8 }}
      >
        Professional Summary
      </h2>
      <p className="text-sm leading-relaxed text-slate-700">{profile.summary}</p>
    </section>
  ) : null;

  const Experience = () => (profile.experience.length > 0 && profile.sectionVisibility?.experience && (settings?.includeExperience !== false)) ? (
    <section className="break-inside-avoid">
      <h2 
        className="text-xs font-bold uppercase tracking-widest mb-4"
        style={{ color: themeColor, opacity: 0.8 }}
      >
        Work Experience
      </h2>
      <div className="space-y-6">
        {profile.experience.map((exp, idx) => (
          <div key={idx}>
            <div className="flex justify-between items-baseline">
              <h3 className="text-lg font-bold text-slate-800">{exp.role}</h3>
              <span className="text-sm text-slate-500 italic">{exp.duration}</span>
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-2">{exp.company}</p>
            <ul className="list-disc list-outside ml-4 space-y-1">
              {Array.isArray(exp.description) ? exp.description.map((bullet, i) => (
                <li key={i} className="text-sm text-slate-700" style={{ color: 'inherit' }}>
                  <span style={{ color: themeColor }} className="mr-2">•</span>
                  {bullet}
                </li>
              )) : (
                <li className="text-sm text-slate-700">{exp.description}</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const Skills = ({ horizontal = true }: { horizontal?: boolean }) => ((profile.skills.length > 0 || onAddSkill) && profile.sectionVisibility?.skills && (settings?.includeSkills !== false)) ? (
    <section className="break-inside-avoid">
      <h2 
        className="text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: themeColor, opacity: 0.8 }}
      >
        Expertise & Skills
      </h2>
      <div className={`flex flex-wrap gap-2 ${horizontal ? 'mb-3' : 'flex-col mb-4'}`}>
        {profile.skills.map((skill, i) => (
          <span key={i} className={`text-sm ${horizontal ? 'bg-slate-50 px-2 py-0.5 rounded border border-slate-200' : 'text-slate-700'}`}>
            {skill}
          </span>
        ))}
      </div>
      {onAddSkill && (
        <button 
          onClick={handleAddSkill}
          className="no-print group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          Add Skill
        </button>
      )}
    </section>
  ) : null;

  const Education = () => (profile.education.length > 0 && profile.sectionVisibility?.education && (settings?.includeEducation !== false)) ? (
    <section className="break-inside-avoid">
      <h2 
        className="text-xs font-bold uppercase tracking-widest mb-4"
        style={{ color: themeColor, opacity: 0.8 }}
      >
        Education
      </h2>
      <div className="space-y-3">
        {profile.education.map((edu, idx) => (
          <div key={idx} className="flex justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{edu.institution}</h3>
              <p className="text-sm text-slate-600">{edu.degree}</p>
            </div>
            <span className="text-sm text-slate-500 font-medium">{edu.year}</span>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const Projects = () => (profile.projects.length > 0 && profile.sectionVisibility?.projects && (settings?.includeProjects !== false)) ? (
    <section className="break-inside-avoid">
      <h2 
        className="text-xs font-bold uppercase tracking-widest mb-4"
        style={{ color: themeColor, opacity: 0.8 }}
      >
        Notable Projects
      </h2>
      <div className="grid grid-cols-2 gap-6">
        {profile.projects.map((proj, idx) => (
          <div key={idx} className="group relative">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-sm font-bold text-slate-800">{proj.title}</h3>
              {proj.link && (
                <a 
                  href={proj.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 text-[9px] font-bold uppercase no-print"
                >
                  View <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-normal">{proj.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {proj.techStack.map((tech, i) => (
                <span key={i} className="text-[10px] font-mono" style={{ color: themeColor, opacity: 0.6 }}>#{tech}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const Awards = () => (profile.awards?.length > 0 && profile.sectionVisibility?.awards) ? (
    <section className="break-inside-avoid">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: themeColor, opacity: 0.8 }}>Awards & Honors</h2>
      <div className="space-y-3">
        {profile.awards.map((award, idx) => (
          <div key={idx} className="flex justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{award.title}</h3>
              <p className="text-xs text-slate-600">{award.issuer}</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">{award.year}</span>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const Achievements = () => (profile.achievements?.length > 0 && profile.sectionVisibility?.achievements) ? (
    <section className="break-inside-avoid">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: themeColor, opacity: 0.8 }}>Achievements</h2>
      <ul className="list-disc list-outside ml-4 space-y-1">
        {profile.achievements.map((ach, idx) => (
          <li key={idx} className="text-sm text-slate-700">
            <span style={{ color: themeColor }} className="mr-2">•</span>
            {ach}
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  const Goals = () => (profile.goals?.length > 0 && profile.sectionVisibility?.goals) ? (
    <section className="break-inside-avoid">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: themeColor, opacity: 0.8 }}>Professional Goals</h2>
      <ul className="list-disc list-outside ml-4 space-y-1">
        {profile.goals.map((goal, idx) => (
          <li key={idx} className="text-sm text-slate-700">
            <span style={{ color: themeColor }} className="mr-2">•</span>
            {goal}
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  const Certifications = () => (profile.certifications?.length > 0 && profile.sectionVisibility?.certifications) ? (
    <section className="break-inside-avoid">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: themeColor, opacity: 0.8 }}>Certifications</h2>
      <div className="space-y-3">
        {profile.certifications.map((cert, idx) => (
          <div key={idx} className="flex justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{cert.name}</h3>
              <p className="text-xs text-slate-600">{cert.issuer}</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">{cert.year}</span>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const Activities = () => (profile.activities?.length > 0 && profile.sectionVisibility?.activities) ? (
    <section className="break-inside-avoid">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: themeColor, opacity: 0.8 }}>Activities & Interests</h2>
      <div className="flex flex-wrap gap-2">
        {profile.activities.map((act, idx) => (
          <span key={idx} className="text-sm bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            {act}
          </span>
        ))}
      </div>
    </section>
  ) : null;

  const References = () => (profile.references?.length > 0 && profile.sectionVisibility?.references) ? (
    <section className="break-inside-avoid">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: themeColor, opacity: 0.8 }}>References</h2>
      <div className="grid grid-cols-2 gap-6">
        {profile.references.map((ref, idx) => (
          <div key={idx}>
            <h3 className="text-sm font-bold text-slate-800">{ref.name}</h3>
            <p className="text-xs text-slate-600">{ref.position} at {ref.company}</p>
            {ref.email && <p className="text-[10px] text-slate-400 mt-1">{ref.email}</p>}
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const CustomSections = () => (profile.customSections?.length > 0 && profile.sectionVisibility?.customSections) ? (
    <>
      {profile.customSections.map((section, idx) => (
        <section key={idx} className="break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: themeColor, opacity: 0.8 }}>{section.title}</h2>
          <ul className="list-disc list-outside ml-4 space-y-1">
            {section.items.map((item, i) => (
              <li key={i} className="text-sm text-slate-700">
                <span style={{ color: themeColor }} className="mr-2">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  ) : null;

  const renderTemplate = () => {
    switch (profile.resumeTemplate) {
      case 'classic':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8"
          >
            <Header centered />
            <Summary />
            <Experience />
            <div className="grid grid-cols-2 gap-12">
              <Education />
              <Skills />
            </div>
            <Projects />
            <Awards />
            <Achievements />
            <Goals />
            <Certifications />
            <Activities />
            <References />
            <CustomSections />
          </motion.div>
        );
      case 'minimal':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-10"
          >
            <header className="flex flex-col gap-2">
              <h1 className="text-4xl font-bold text-slate-900">{profile.name || "Your Name"}</h1>
              <p className="text-xl font-medium" style={{ color: themeColor }}>{profile.title || "Your Profession"}</p>
              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <span>{profile.email}</span>
                <span>{profile.phone}</span>
                <span>{profile.location}</span>
              </div>
            </header>
            <Summary />
            <Experience />
            <Skills />
            <Education />
            <Projects />
            <Awards />
            <Achievements />
            <Goals />
            <Certifications />
            <Activities />
            <References />
            <CustomSections />
          </motion.div>
        );
      case 'sidebar':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-[1fr_240px] gap-12 h-full"
          >
            <div className="flex flex-col gap-8">
              <header>
                <h1 className="text-5xl font-bold text-slate-900 mb-2">{profile.name || "Your Name"}</h1>
                <p className="text-xl font-semibold" style={{ color: themeColor }}>{profile.title || "Your Profession"}</p>
              </header>
              <Summary />
              <Experience />
              <Projects />
              <Achievements />
              <Goals />
              <References />
              <CustomSections />
            </div>
            <div className="flex flex-col gap-8 pt-4">
              <section className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Contact</h2>
                <div className="text-sm space-y-1 text-slate-600">
                  <p className="break-all">{profile.email}</p>
                  <p>{profile.phone}</p>
                  <p>{profile.location}</p>
                </div>
              </section>
              <Skills horizontal={false} />
              <Education />
              <Awards />
              <Certifications />
              <Activities />
            </div>
          </motion.div>
        );
      case 'technical':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-6"
          >
            <header className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{profile.name || "Your Name"}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-sm font-mono uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5">{profile.title || "Your Profession"}</p>
                  <span className="text-slate-300">|</span>
                  <p className="text-sm font-mono text-slate-500">{profile.location}</p>
                </div>
              </div>
              <div className="text-right text-[10px] font-mono text-slate-500 uppercase tracking-wider space-y-1">
                <p className="font-bold text-slate-900">{profile.email}</p>
                <p>{profile.phone}</p>
                {profile.socialLinks.github && <p className="text-indigo-600">{profile.socialLinks.github.replace('https://', '')}</p>}
              </div>
            </header>
            
            <div className="grid grid-cols-[220px_1fr] gap-12">
              <aside className="space-y-10">
                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-1">Core Stack</h2>
                  <div className="flex flex-col gap-2">
                    {profile.skills.map((skill, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }}></div>
                        <span className="text-sm font-medium text-slate-700">{skill}</span>
                      </div>
                    ))}
                  </div>
                </section>
                
                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-1">Education</h2>
                  <div className="space-y-4">
                    {profile.education.map((edu, idx) => (
                      <div key={idx}>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{edu.institution}</h3>
                        <p className="text-xs text-slate-500 mt-1">{edu.degree}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <Certifications />
                <Awards />
                <Activities />
              </aside>

              <main className="space-y-10">
                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-1">Profile</h2>
                  <p className="text-sm leading-relaxed text-slate-600 font-medium">{profile.summary}</p>
                </section>

                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 border-b border-slate-200 pb-1">Experience</h2>
                  <div className="space-y-8">
                    {profile.experience.map((exp, idx) => (
                      <div key={idx} className="relative pl-4 border-l-2 border-slate-100">
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-300"></div>
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{exp.duration}</span>
                        </div>
                        <p className="text-sm font-bold text-indigo-600 mb-3">{exp.company}</p>
                        <ul className="space-y-2">
                          {Array.isArray(exp.description) ? exp.description.map((bullet, i) => (
                            <li key={i} className="text-sm text-slate-600 flex gap-2">
                              <span className="text-slate-300">›</span>
                              {bullet}
                            </li>
                          )) : (
                            <li className="text-sm text-slate-600">{exp.description}</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 border-b border-slate-200 pb-1">Projects</h2>
                  <div className="grid grid-cols-2 gap-6">
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 mb-2">{proj.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed mb-3">{proj.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {proj.techStack.map((tech, i) => (
                            <span key={i} className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">{tech}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <Achievements />
                <Goals />
                <References />
                <CustomSections />
              </main>
            </div>
          </motion.div>
        );
      case 'creative':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-0 -m-12 min-h-[1050px]"
          >
            <header className="p-12 pb-16 relative overflow-hidden" style={{ backgroundColor: themeColor }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-20 -mb-20 blur-2xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div>
                  <h1 className="text-7xl font-black text-white leading-none tracking-tighter mb-4">{profile.name || "Your Name"}</h1>
                  <p className="text-2xl font-medium text-white/80 italic">{profile.title || "Your Profession"}</p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2 text-white/90 font-bold uppercase tracking-widest text-[10px]">
                  <p>{profile.location}</p>
                  <p>{profile.email}</p>
                  <p>{profile.phone}</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-[1fr_300px] flex-1">
              <div className="p-12 space-y-12">
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">About Me</h2>
                    <div className="h-1 flex-1 bg-slate-100"></div>
                  </div>
                  <p className="text-lg leading-relaxed text-slate-600 font-medium italic">"{profile.summary}"</p>
                </section>

                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Experience</h2>
                    <div className="h-1 flex-1 bg-slate-100"></div>
                  </div>
                  <div className="space-y-12">
                    {profile.experience.map((exp, idx) => (
                      <div key={idx} className="group">
                        <div className="flex justify-between items-baseline mb-4">
                          <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{exp.role}</h3>
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">{exp.duration}</span>
                        </div>
                        <p className="text-lg font-bold mb-4" style={{ color: themeColor }}>{exp.company}</p>
                        <ul className="space-y-3">
                          {Array.isArray(exp.description) ? exp.description.map((bullet, i) => (
                            <li key={i} className="text-slate-600 leading-relaxed flex gap-3">
                              <span className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: themeColor }}></span>
                              {bullet}
                            </li>
                          )) : (
                            <li className="text-slate-600 leading-relaxed">{exp.description}</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                <Achievements />
                <Goals />
                <References />
                <CustomSections />
              </div>

              <aside className="bg-slate-50 p-12 space-y-12 border-l border-slate-100">
                <section>
                  <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Expertise</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-white rounded-full text-xs font-bold shadow-sm border border-slate-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Education</h2>
                  <div className="space-y-6">
                    {profile.education.map((edu, idx) => (
                      <div key={idx}>
                        <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                        <p className="text-sm text-slate-500 mt-1">{edu.degree}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">{edu.year}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <Awards />
                <Certifications />
                <Activities />

                <section>
                  <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Projects</h2>
                  <div className="space-y-6">
                    {profile.projects.map((proj, idx) => (
                      <div key={idx} className="group">
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{proj.title}</h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{proj.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {proj.techStack.slice(0, 3).map((tech, i) => (
                            <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-slate-400">#{tech}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </motion.div>
        );
      case 'executive':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-10"
          >
            <header className="border-b-2 border-slate-900 pb-8 flex justify-between items-end">
              <div>
                <h1 className="text-5xl font-serif font-bold text-slate-900 mb-2 uppercase tracking-tight">{profile.name || "Your Name"}</h1>
                <p className="text-xl font-serif italic text-slate-600">{profile.title || "Your Profession"}</p>
              </div>
              <div className="text-right text-sm space-y-1 font-serif">
                <p>{profile.location}</p>
                <p>{profile.phone}</p>
                <p className="font-bold">{profile.email}</p>
              </div>
            </header>
            <section>
              <h2 className="text-lg font-serif font-bold uppercase border-b border-slate-300 mb-4 pb-1">Executive Summary</h2>
              <p className="text-base leading-relaxed text-slate-700 font-serif">{profile.summary}</p>
            </section>
            <section>
              <h2 className="text-lg font-serif font-bold uppercase border-b border-slate-300 mb-6 pb-1">Professional Experience</h2>
              <div className="space-y-8">
                {profile.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-xl font-serif font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-sm font-serif font-bold text-slate-500">{exp.duration}</span>
                    </div>
                    <p className="text-lg font-serif font-semibold text-slate-700 mb-4 italic">{exp.company}</p>
                    <ul className="space-y-3">
                      {Array.isArray(exp.description) ? exp.description.map((bullet, i) => (
                        <li key={i} className="text-base text-slate-700 font-serif flex gap-3">
                          <span className="text-slate-400 mt-1.5">•</span>
                          {bullet}
                        </li>
                      )) : (
                        <li className="text-base text-slate-700 font-serif">{exp.description}</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
            <div className="grid grid-cols-2 gap-12">
              <section>
                <h2 className="text-lg font-serif font-bold uppercase border-b border-slate-300 mb-4 pb-1">Education</h2>
                <div className="space-y-4">
                  {profile.education.map((edu, idx) => (
                    <div key={idx}>
                      <h3 className="text-base font-serif font-bold text-slate-900">{edu.institution}</h3>
                      <p className="text-sm font-serif text-slate-600">{edu.degree}</p>
                      <p className="text-xs font-serif text-slate-400 mt-1">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h2 className="text-lg font-serif font-bold uppercase border-b border-slate-300 mb-4 pb-1">Core Competencies</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {profile.skills.map((skill, i) => (
                    <div key={i} className="text-sm font-serif text-slate-700 flex items-center gap-2">
                      <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      {skill}
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <Awards />
            <Achievements />
            <Goals />
            <Certifications />
            <Activities />
            <References />
            <CustomSections />
          </motion.div>
        );
      case 'academic':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-12 max-w-[800px] mx-auto py-8"
          >
            <header className="text-center border-b border-slate-200 pb-10">
              <h1 className="text-4xl font-serif font-light tracking-widest text-slate-900 mb-4 uppercase">{profile.name || "Your Name"}</h1>
              <div className="flex justify-center gap-6 text-sm font-serif text-slate-500">
                <span>{profile.email}</span>
                <span>•</span>
                <span>{profile.phone}</span>
                <span>•</span>
                <span>{profile.location}</span>
              </div>
            </header>
            <section>
              <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Research Profile</h2>
              <p className="text-base leading-relaxed text-slate-700 font-serif text-justify">{profile.summary}</p>
            </section>
            <section>
              <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 text-center">Education</h2>
              <div className="space-y-8">
                {profile.education.map((edu, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <h3 className="text-lg font-serif font-bold text-slate-900">{edu.institution}</h3>
                    <p className="text-base font-serif text-slate-600 italic">{edu.degree}</p>
                    <p className="text-sm font-serif text-slate-400 mt-1">{edu.year}</p>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 text-center">Academic Appointments</h2>
              <div className="space-y-10">
                {profile.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-lg font-serif font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-sm font-serif text-slate-500">{exp.duration}</span>
                    </div>
                    <p className="text-base font-serif text-slate-600 mb-4">{exp.company}</p>
                    <ul className="space-y-2 list-disc list-inside">
                      {Array.isArray(exp.description) ? exp.description.map((bullet, i) => (
                        <li key={i} className="text-sm text-slate-700 font-serif leading-relaxed">
                          {bullet}
                        </li>
                      )) : (
                        <li className="text-sm text-slate-700 font-serif leading-relaxed">{exp.description}</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-sm font-serif font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 text-center">Selected Publications & Projects</h2>
              <div className="space-y-6">
                {profile.projects.map((proj, idx) => (
                  <div key={idx} className="border-l-2 border-slate-100 pl-6">
                    <h3 className="text-base font-serif font-bold text-slate-900">{proj.title}</h3>
                    <p className="text-sm font-serif text-slate-600 mt-2 leading-relaxed italic">{proj.description}</p>
                  </div>
                ))}
              </div>
            </section>
            <Awards />
            <Achievements />
            <Goals />
            <Certifications />
            <Activities />
            <References />
            <CustomSections />
          </motion.div>
        );
      case 'functional':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8"
          >
            <header className="bg-slate-900 text-white p-10 -m-12 mb-8">
              <h1 className="text-5xl font-bold mb-2">{profile.name || "Your Name"}</h1>
              <p className="text-xl opacity-80 mb-6">{profile.title || "Your Profession"}</p>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm opacity-70">
                <span>{profile.email}</span>
                <span>{profile.phone}</span>
                <span>{profile.location}</span>
              </div>
            </header>
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 border-b-2 border-slate-100 pb-2">Professional Summary</h2>
              <p className="text-sm leading-relaxed text-slate-600">{profile.summary}</p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b-2 border-slate-100 pb-2">Core Skills & Expertise</h2>
              <div className="grid grid-cols-3 gap-4">
                {profile.skills.map((skill, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded border border-slate-100 text-sm font-bold text-slate-700 text-center">
                    {skill}
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b-2 border-slate-100 pb-2">Key Projects & Achievements</h2>
              <div className="space-y-6">
                {profile.projects.map((proj, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{proj.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">{proj.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {proj.techStack.map((tech, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">{tech}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <Achievements />
            <Goals />
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b-2 border-slate-100 pb-2">Employment History</h2>
              <div className="space-y-4">
                {profile.experience.map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">{exp.role}</span>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-slate-600">{exp.company}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{exp.duration}</span>
                  </div>
                ))}
              </div>
            </section>
            <Awards />
            <Certifications />
            <Activities />
            <References />
            <CustomSections />
          </motion.div>
        );
      case 'modern':
      default:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8"
          >
            <Header />
            <Summary />
            <Experience />
            <Skills />
            <Education />
            <Projects />
            <Awards />
            <Achievements />
            <Goals />
            <Certifications />
            <Activities />
            <References />
            <CustomSections />
          </motion.div>
        );
    }
  };

  const isLandscape = window.innerWidth > 1000; // Rough check for preview, but we can do better

  return (
    <div 
      id="resume-container" 
      className={`bg-white px-16 py-12 shadow-2xl mx-auto w-full text-slate-800 border border-slate-200 ${fontClass} ${fontSizeClass}`}
      style={{ minHeight: isLandscape ? '800px' : '1050px' }}
    >
      {renderTemplate()}
    </div>
  );
};

export default ResumePreview;
