
export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface Project {
  title: string;
  description: string;
  techStack: string[];
  link?: string;
}

export interface Award {
  title: string;
  issuer: string;
  year: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: string;
  link?: string;
}

export interface Website {
  label: string;
  url: string;
}

export interface Reference {
  name: string;
  position: string;
  company: string;
  email?: string;
  phone?: string;
}

export interface CustomSection {
  title: string;
  items: string[];
}

export interface UserProfile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  awards: Award[];
  achievements: string[];
  goals: string[];
  certifications: Certification[];
  activities: string[];
  websites: Website[];
  customSections: CustomSection[];
  references: Reference[];
  socialLinks: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    dribbble?: string;
    behance?: string;
    medium?: string;
    [key: string]: string | undefined;
  };
  sectionVisibility: {
    summary: boolean;
    experience: boolean;
    education: boolean;
    projects: boolean;
    skills: boolean;
    awards: boolean;
    achievements: boolean;
    goals: boolean;
    certifications: boolean;
    activities: boolean;
    websites: boolean;
    customSections: boolean;
    references: boolean;
    socialLinks: boolean;
  };
  themeColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  resumeTemplate: ResumeTemplate;
  websiteTemplate: WebsiteTemplate;
}

export type ResumeTemplate = 'modern' | 'classic' | 'minimal' | 'sidebar' | 'technical' | 'creative' | 'executive' | 'academic' | 'functional';
export type WebsiteTemplate = 'modern' | 'bento' | 'minimal' | 'creative' | 'terminal' | 'magazine' | 'sidebar' | 'portfolio' | 'startup' | 'minimalist';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Attachment {
  mimeType: string;
  data: string; // base64
  name: string;
  url?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  role: MessageRole;
  content: string;
  attachments?: Attachment[];
  sources?: GroundingSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  profile: UserProfile;
  appState: AppState;
  createdAt: number;
}

export type AppState = 'landing' | 'chatting' | 'preview';
