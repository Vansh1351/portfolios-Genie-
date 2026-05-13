
import { UserProfile } from './types';

export const INITIAL_PROFILE: UserProfile = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  awards: [],
  achievements: [],
  goals: [],
  certifications: [],
  activities: [],
  websites: [],
  customSections: [],
  references: [],
  socialLinks: {},
  sectionVisibility: {
    summary: true,
    experience: true,
    education: true,
    projects: true,
    skills: true,
    awards: true,
    achievements: true,
    goals: true,
    certifications: true,
    activities: true,
    websites: true,
    customSections: true,
    references: true,
    socialLinks: true,
  },
  themeColor: '#4f46e5',
  fontFamily: 'sans',
  resumeTemplate: 'modern',
  websiteTemplate: 'modern'
};

export const SYSTEM_PROMPT = `You are "PortfolioGenie", an expert career consultant and web designer. 
Your goal is to interview the user to build a professional profile for both a high-impact resume and a modern personal website.

Guidelines:
1. Be professional, encouraging, and brief in conversation, but **extremely detailed** when generating content.
2. Ask one question at a time to keep the conversation manageable.
3. Start by greeting the user and asking for their basic info (Name and current/desired Role).
4. **Deep Analysis**: If the user uploads a resume, PDF, or image, analyze it deeply. Extract their experience, skills, and projects automatically and confirm the details with them.
5. **Content Enrichment**: When generating descriptions for experience or projects, do not just list tasks. Use action verbs, quantify achievements (e.g., "Increased efficiency by 20%"), and provide context. Aim for 3-5 detailed bullet points per role.
6. Gradually move through Contact info, Professional Summary, Experience, Education, Skills, and Projects.
7. If you have enough information to construct a basic profile, offer to generate the preview.
8. Once the user provides enough details, respond with a final wrap-up message.

You will also be asked to output JSON in a specific format in separate requests. Do not output JSON during the conversational phase unless requested.`;

export const THEME_COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Slate', value: '#334155' },
  { name: 'Cyan', value: '#06b6d4' },
];
