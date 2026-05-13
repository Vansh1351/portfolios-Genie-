
import React, { useState } from 'react';
import { UserProfile, Experience, Education, Project, Award, Certification, Website, Reference, CustomSection } from '../types';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Eye, EyeOff, Globe, Award as AwardIcon, Target, ShieldCheck, Activity, Link as LinkIcon, Users, Settings } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

const ManualEdit: React.FC<Props> = ({ profile, onSave, onCancel }) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>({ ...profile });

  const handleChange = (field: keyof UserProfile, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field: string, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [field]: value }
    }));
  };

  const addExperience = () => {
    setEditedProfile(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: [''] }]
    }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const newExp = [...editedProfile.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setEditedProfile(prev => ({ ...prev, experience: newExp }));
  };

  const removeExperience = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setEditedProfile(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '' }]
    }));
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const newEdu = [...editedProfile.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setEditedProfile(prev => ({ ...prev, education: newEdu }));
  };

  const removeEducation = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    setEditedProfile(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', techStack: [] }]
    }));
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const newProj = [...editedProfile.projects];
    newProj[index] = { ...newProj[index], [field]: value };
    setEditedProfile(prev => ({ ...prev, projects: newProj }));
  };

  const removeProject = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const toggleVisibility = (section: keyof UserProfile['sectionVisibility']) => {
    setEditedProfile(prev => ({
      ...prev,
      sectionVisibility: {
        ...(prev.sectionVisibility || {}),
        [section]: !prev.sectionVisibility?.[section]
      } as any
    }));
  };

  const addAward = () => {
    setEditedProfile(prev => ({
      ...prev,
      awards: [...prev.awards, { title: '', issuer: '', year: '' }]
    }));
  };

  const updateAward = (index: number, field: keyof Award, value: any) => {
    const newAwards = [...editedProfile.awards];
    newAwards[index] = { ...newAwards[index], [field]: value };
    setEditedProfile(prev => ({ ...prev, awards: newAwards }));
  };

  const removeAward = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    setEditedProfile(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuer: '', year: '' }]
    }));
  };

  const updateCertification = (index: number, field: keyof Certification, value: any) => {
    const newCerts = [...editedProfile.certifications];
    newCerts[index] = { ...newCerts[index], [field]: value };
    setEditedProfile(prev => ({ ...prev, certifications: newCerts }));
  };

  const removeCertification = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addWebsite = () => {
    setEditedProfile(prev => ({
      ...prev,
      websites: [...prev.websites, { label: '', url: '' }]
    }));
  };

  const updateWebsite = (index: number, field: keyof Website, value: any) => {
    const newWebsites = [...editedProfile.websites];
    newWebsites[index] = { ...newWebsites[index], [field]: value };
    setEditedProfile(prev => ({ ...prev, websites: newWebsites }));
  };

  const removeWebsite = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      websites: prev.websites.filter((_, i) => i !== index)
    }));
  };

  const addReference = () => {
    setEditedProfile(prev => ({
      ...prev,
      references: [...prev.references, { name: '', position: '', company: '' }]
    }));
  };

  const updateReference = (index: number, field: keyof Reference, value: any) => {
    const newRefs = [...editedProfile.references];
    newRefs[index] = { ...newRefs[index], [field]: value };
    setEditedProfile(prev => ({ ...prev, references: newRefs }));
  };

  const removeReference = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const addCustomSection = () => {
    setEditedProfile(prev => ({
      ...prev,
      customSections: [...prev.customSections, { title: '', items: [''] }]
    }));
  };

  const updateCustomSection = (index: number, field: keyof CustomSection, value: any) => {
    const newCustom = [...editedProfile.customSections];
    newCustom[index] = { ...newCustom[index], [field]: value };
    setEditedProfile(prev => ({ ...prev, customSections: newCustom }));
  };

  const removeCustomSection = (index: number) => {
    setEditedProfile(prev => ({
      ...prev,
      customSections: prev.customSections.filter((_, i) => i !== index)
    }));
  };

  const SectionHeader = ({ title, section, onAdd }: { title: string, section?: keyof UserProfile['sectionVisibility'], onAdd?: () => void }) => (
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
        {title}
      </h3>
      <div className="flex items-center gap-4">
        {section && (
          <button 
            onClick={() => toggleVisibility(section)}
            className={`flex items-center gap-1 text-[10px] font-bold uppercase transition-colors ${editedProfile.sectionVisibility?.[section] ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            {editedProfile.sectionVisibility?.[section] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {editedProfile.sectionVisibility?.[section] ? 'Visible' : 'Hidden'}
          </button>
        )}
        {onAdd && (
          <button onClick={onAdd} className="text-indigo-600 hover:text-indigo-700 font-bold text-xs uppercase flex items-center gap-1">
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Manual Profile Editor</h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Fine-tune your professional identity</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <button 
            onClick={() => onSave(editedProfile)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="p-8 space-y-12 overflow-y-auto max-h-[75vh]">
        {/* Basic Info */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            Basic Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Full Name</label>
              <input 
                type="text" 
                value={editedProfile.name} 
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Professional Title</label>
              <input 
                type="text" 
                value={editedProfile.title} 
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Address</label>
              <input 
                type="email" 
                value={editedProfile.email} 
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Phone Number</label>
              <input 
                type="text" 
                value={editedProfile.phone} 
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Location</label>
              <input 
                type="text" 
                value={editedProfile.location} 
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Summary */}
        <section>
          <SectionHeader title="Professional Summary" section="summary" />
          <textarea 
            value={editedProfile.summary} 
            onChange={(e) => handleChange('summary', e.target.value)}
            rows={4}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
          />
        </section>

        {/* Experience */}
        <section>
          <SectionHeader title="Work Experience" section="experience" onAdd={addExperience} />
          <div className="space-y-6">
            {editedProfile.experience.map((exp, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <button 
                  onClick={() => removeExperience(i)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input 
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(i, 'company', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Role"
                    value={exp.role}
                    onChange={(e) => updateExperience(i, 'role', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Duration (e.g. 2020 - Present)"
                    value={exp.duration}
                    onChange={(e) => updateExperience(i, 'duration', e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description Bullets</label>
                  {exp.description.map((bullet, bi) => (
                    <div key={bi} className="flex gap-2">
                      <input 
                        value={bullet}
                        onChange={(e) => {
                          const newDesc = [...exp.description];
                          newDesc[bi] = e.target.value;
                          updateExperience(i, 'description', newDesc);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button 
                        onClick={() => {
                          const newDesc = exp.description.filter((_, idx) => idx !== bi);
                          updateExperience(i, 'description', newDesc);
                        }}
                        className="text-slate-300 hover:text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => updateExperience(i, 'description', [...exp.description, ''])}
                    className="text-indigo-600 text-[10px] font-bold uppercase mt-2"
                  >
                    + Add Bullet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <SectionHeader title="Education" section="education" onAdd={addEducation} />
          <div className="grid md:grid-cols-2 gap-4">
            {editedProfile.education.map((edu, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <button 
                  onClick={() => removeEducation(i)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="space-y-3">
                  <input 
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Year"
                    value={edu.year}
                    onChange={(e) => updateEducation(i, 'year', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section>
          <SectionHeader title="Skills & Expertise" section="skills" />
          <div className="flex flex-wrap gap-2 mb-4">
            {editedProfile.skills.map((skill, i) => (
              <div key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-indigo-100">
                {skill}
                <button onClick={() => handleChange('skills', editedProfile.skills.filter((_, idx) => idx !== i))}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              id="new-skill-input"
              placeholder="Add a skill..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    handleChange('skills', [...editedProfile.skills, val]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <button 
              onClick={() => {
                const input = document.getElementById('new-skill-input') as HTMLInputElement;
                const val = input.value.trim();
                if (val) {
                  handleChange('skills', [...editedProfile.skills, val]);
                  input.value = '';
                }
              }}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              Add
            </button>
          </div>
        </section>

        {/* Projects */}
        <section>
          <SectionHeader title="Projects" section="projects" onAdd={addProject} />
          <div className="grid md:grid-cols-2 gap-6">
            {editedProfile.projects.map((proj, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <button 
                  onClick={() => removeProject(i)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="space-y-4">
                  <input 
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={(e) => updateProject(i, 'title', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea 
                    placeholder="Description"
                    value={proj.description}
                    onChange={(e) => updateProject(i, 'description', e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tech Stack (comma separated)</label>
                    <input 
                      placeholder="React, Tailwind, etc."
                      value={proj.techStack.join(', ')}
                      onChange={(e) => updateProject(i, 'techStack', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <input 
                    placeholder="Project Link (Optional)"
                    value={proj.link || ''}
                    onChange={(e) => updateProject(i, 'link', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Awards */}
        <section>
          <SectionHeader title="Awards & Honors" section="awards" onAdd={addAward} />
          <div className="grid md:grid-cols-2 gap-4">
            {editedProfile.awards.map((award, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <button 
                  onClick={() => removeAward(i)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="space-y-3">
                  <input 
                    placeholder="Award Title"
                    value={award.title}
                    onChange={(e) => updateAward(i, 'title', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Issuer"
                    value={award.issuer}
                    onChange={(e) => updateAward(i, 'issuer', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Year"
                    value={award.year}
                    onChange={(e) => updateAward(i, 'year', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section>
          <SectionHeader title="Achievements" section="achievements" />
          <div className="space-y-2">
            {editedProfile.achievements.map((ach, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  value={ach}
                  onChange={(e) => {
                    const newAch = [...editedProfile.achievements];
                    newAch[i] = e.target.value;
                    handleChange('achievements', newAch);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={() => handleChange('achievements', editedProfile.achievements.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-4 h-4 text-slate-300 hover:text-rose-500" />
                </button>
              </div>
            ))}
            <button 
              onClick={() => handleChange('achievements', [...editedProfile.achievements, ''])}
              className="text-indigo-600 text-xs font-bold uppercase mt-2"
            >
              + Add Achievement
            </button>
          </div>
        </section>

        {/* Goals */}
        <section>
          <SectionHeader title="Professional Goals" section="goals" />
          <div className="space-y-2">
            {editedProfile.goals.map((goal, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...editedProfile.goals];
                    newGoals[i] = e.target.value;
                    handleChange('goals', newGoals);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={() => handleChange('goals', editedProfile.goals.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-4 h-4 text-slate-300 hover:text-rose-500" />
                </button>
              </div>
            ))}
            <button 
              onClick={() => handleChange('goals', [...editedProfile.goals, ''])}
              className="text-indigo-600 text-xs font-bold uppercase mt-2"
            >
              + Add Goal
            </button>
          </div>
        </section>

        {/* Certifications */}
        <section>
          <SectionHeader title="Certifications & Licenses" section="certifications" onAdd={addCertification} />
          <div className="grid md:grid-cols-2 gap-4">
            {editedProfile.certifications.map((cert, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <button 
                  onClick={() => removeCertification(i)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="space-y-3">
                  <input 
                    placeholder="Certification Name"
                    value={cert.name}
                    onChange={(e) => updateCertification(i, 'name', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Issuer"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(i, 'issuer', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Year"
                    value={cert.year}
                    onChange={(e) => updateCertification(i, 'year', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activities */}
        <section>
          <SectionHeader title="Activities & Interests" section="activities" />
          <div className="space-y-2">
            {editedProfile.activities.map((act, i) => (
              <div key={i} className="flex gap-2">
                <input 
                  value={act}
                  onChange={(e) => {
                    const newAct = [...editedProfile.activities];
                    newAct[i] = e.target.value;
                    handleChange('activities', newAct);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={() => handleChange('activities', editedProfile.activities.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-4 h-4 text-slate-300 hover:text-rose-500" />
                </button>
              </div>
            ))}
            <button 
              onClick={() => handleChange('activities', [...editedProfile.activities, ''])}
              className="text-indigo-600 text-xs font-bold uppercase mt-2"
            >
              + Add Activity
            </button>
          </div>
        </section>

        {/* Websites */}
        <section>
          <SectionHeader title="Websites & Portfolios" section="websites" onAdd={addWebsite} />
          <div className="grid md:grid-cols-2 gap-4">
            {editedProfile.websites.map((site, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <button 
                  onClick={() => removeWebsite(i)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="space-y-3">
                  <input 
                    placeholder="Label (e.g. Personal Blog)"
                    value={site.label}
                    onChange={(e) => updateWebsite(i, 'label', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="URL"
                    value={site.url}
                    onChange={(e) => updateWebsite(i, 'url', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* References */}
        <section>
          <SectionHeader title="References" section="references" onAdd={addReference} />
          <div className="grid md:grid-cols-2 gap-4">
            {editedProfile.references.map((ref, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <button 
                  onClick={() => removeReference(i)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="space-y-3">
                  <input 
                    placeholder="Name"
                    value={ref.name}
                    onChange={(e) => updateReference(i, 'name', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Position"
                    value={ref.position}
                    onChange={(e) => updateReference(i, 'position', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input 
                    placeholder="Company"
                    value={ref.company}
                    onChange={(e) => updateReference(i, 'company', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Custom Sections */}
        <section>
          <SectionHeader title="Custom Sections" section="customSections" onAdd={addCustomSection} />
          <div className="space-y-6">
            {editedProfile.customSections.map((custom, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <button 
                  onClick={() => removeCustomSection(i)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <input 
                  placeholder="Section Title"
                  value={custom.title}
                  onChange={(e) => updateCustomSection(i, 'title', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                />
                <div className="space-y-2">
                  {custom.items.map((item, ii) => (
                    <div key={ii} className="flex gap-2">
                      <input 
                        value={item}
                        onChange={(e) => {
                          const newItems = [...custom.items];
                          newItems[ii] = e.target.value;
                          updateCustomSection(i, 'items', newItems);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button onClick={() => {
                        const newItems = custom.items.filter((_, idx) => idx !== ii);
                        updateCustomSection(i, 'items', newItems);
                      }}>
                        <Trash2 className="w-3 h-3 text-slate-300 hover:text-rose-500" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => updateCustomSection(i, 'items', [...custom.items, ''])}
                    className="text-indigo-600 text-[10px] font-bold uppercase mt-2"
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social Links */}
        <section>
          <SectionHeader title="Social Links" section="socialLinks" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">LinkedIn</label>
              <input 
                type="text" 
                value={editedProfile.socialLinks.linkedin || ''} 
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">GitHub</label>
              <input 
                type="text" 
                value={editedProfile.socialLinks.github || ''} 
                onChange={(e) => handleSocialChange('github', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Twitter / X</label>
              <input 
                type="text" 
                value={editedProfile.socialLinks.twitter || ''} 
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Instagram</label>
              <input 
                type="text" 
                value={editedProfile.socialLinks.instagram || ''} 
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4">
        <button onClick={onCancel} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Discard Changes</button>
        <button 
          onClick={() => onSave(editedProfile)}
          className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20"
        >
          Save & Update Preview
        </button>
      </div>
    </div>
  );
};

export default ManualEdit;
