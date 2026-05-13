import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, Cloud, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import ResumePreview from './ResumePreview';
import WebsitePreview from './WebsitePreview';

interface ExportPreviewModalProps {
  show: boolean;
  onClose: () => void;
  format: 'pdf' | 'docx' | 'txt' | 'html' | null;
  profile: UserProfile;
  pdfSettings: any;
  websiteDarkMode: boolean;
  isGoogleConnected: boolean;
  isGeneratingPDF: boolean;
  isUploadingToDrive: boolean;
  onGoogleConnect: () => void;
  onExportPDF: (toDrive: boolean) => void;
  onExportDocx: (toDrive: boolean) => void;
  onExportTxt: (toDrive: boolean) => void;
  onExportHTML: (source: 'resume' | 'website', toDrive: boolean) => void;
  user: any;
}

const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  show,
  onClose,
  format,
  profile,
  pdfSettings,
  websiteDarkMode,
  isGoogleConnected,
  isGeneratingPDF,
  isUploadingToDrive,
  onGoogleConnect,
  onExportPDF,
  onExportDocx,
  onExportTxt,
  onExportHTML,
  user
}) => {
  if (!show) return null;

  const handleDownload = () => {
    if (format === 'pdf') {
      onExportPDF(false);
    } else if (format === 'docx') {
      onExportDocx();
    } else if (format === 'txt') {
      onExportTxt();
    } else if (format === 'html') {
      onExportHTML(pdfSettings.source);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Export Preview</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Format: {format?.toUpperCase()}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50">
          <div className="max-w-[800px] mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200">
            {format === 'pdf' || format === 'html' ? (
              pdfSettings.source === 'resume' ? (
                <div className="p-8">
                  <ResumePreview profile={profile} settings={pdfSettings} />
                </div>
              ) : (
                <div className="p-4">
                  <WebsitePreview profile={profile} isDarkMode={websiteDarkMode} />
                </div>
              )
            ) : format === 'docx' || format === 'txt' ? (
              <div className="p-12 font-serif text-slate-800 whitespace-pre-wrap leading-relaxed">
                <h1 className="text-3xl font-bold text-center mb-2">{profile.name}</h1>
                <p className="text-center text-slate-600 mb-8">{profile.title} | {profile.email}</p>
                
                <div className="space-y-8">
                  {profile.summary && (
                    <section>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">Summary</h2>
                      <p>{profile.summary}</p>
                    </section>
                  )}

                  {profile.experience?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">Experience</h2>
                      <div className="space-y-6">
                        {profile.experience.map((exp, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-slate-800">{exp.role}</h3>
                              <span className="text-sm text-slate-500">{exp.duration}</span>
                            </div>
                            <p className="text-sm font-bold text-indigo-600">{exp.company}</p>
                            <ul className="mt-2 space-y-1">
                              {exp.description.map((desc, di) => (
                                <li key={di} className="text-sm text-slate-700 flex gap-2">
                                  <span className="text-slate-400">•</span>
                                  <span>{desc}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {profile.education?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">Education</h2>
                      <div className="space-y-4">
                        {profile.education.map((edu, i) => (
                          <div key={i} className="flex justify-between">
                            <div>
                              <h3 className="font-bold text-slate-800">{edu.degree}</h3>
                              <p className="text-sm text-slate-600">{edu.institution}</p>
                            </div>
                            <span className="text-sm text-slate-500">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {profile.skills?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">Skills</h2>
                      <p className="text-sm text-slate-700 leading-relaxed">{profile.skills.join(' • ')}</p>
                    </section>
                  )}

                  {profile.projects?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">Projects</h2>
                      <div className="space-y-6">
                        {profile.projects.map((proj, i) => (
                          <div key={i}>
                            <h3 className="font-bold text-slate-800">{proj.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">{proj.description}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {proj.techStack?.map((tech, ti) => (
                                <span key={ti} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">{tech}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {profile.awards?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">Awards</h2>
                      <ul className="space-y-1">
                        {profile.awards.map((award, i) => (
                          <li key={i} className="text-sm">
                            <span className="font-bold">{award.title}</span> — {award.issuer} ({award.year})
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {profile.certifications?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">Certifications</h2>
                      <ul className="space-y-1">
                        {profile.certifications.map((cert, i) => (
                          <li key={i} className="text-sm">
                            <span className="font-bold">{cert.name}</span> — {cert.issuer} ({cert.year})
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {profile.achievements?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">Achievements</h2>
                      <ul className="space-y-1">
                        {profile.achievements.map((ach, i) => (
                          <li key={i} className="flex gap-2 text-sm">
                            <span className="text-slate-400">•</span>
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {profile.customSections?.map((section, i) => (
                    <section key={i}>
                      <h2 className="text-lg font-bold border-b-2 border-slate-200 mb-2 uppercase tracking-wider">{section.title}</h2>
                      <ul className="space-y-1">
                        {section.items.map((item, ii) => (
                          <li key={ii} className="flex gap-2 text-sm">
                            <span className="text-slate-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex flex-wrap justify-end gap-4 bg-slate-50/50">
          <button 
            onClick={() => {
              if (isGoogleConnected) {
                if (format === 'pdf') onExportPDF(true);
                else if (format === 'docx') onExportDocx(true);
                else if (format === 'txt') onExportTxt(true);
                else if (format === 'html') onExportHTML(pdfSettings.source, true);
              } else {
                onGoogleConnect();
              }
            }}
            disabled={isGeneratingPDF || isUploadingToDrive}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
              isGoogleConnected 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isUploadingToDrive ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Cloud className={`w-4 h-4 ${isGoogleConnected ? 'text-white' : 'text-slate-400'}`} />
            )}
            {isGoogleConnected ? (isUploadingToDrive ? 'Uploading...' : 'Save to Drive') : 'Connect Drive'}
          </button>
          
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            disabled={isGeneratingPDF}
            className="px-8 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!user && <Lock className="w-4 h-4 mr-1 opacity-70" />}
            {isGeneratingPDF ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : !user ? (
              null 
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {isGeneratingPDF ? 'Generating...' : `Download ${format?.toUpperCase()}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportPreviewModal;
