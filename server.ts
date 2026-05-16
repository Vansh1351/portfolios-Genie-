import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Initialize the Gemini API client server-side
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '',
});

async function callOpenRouter(messages: any[], systemPrompt: string, model: string = "deepseek/deepseek-r1:free") {
  if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API key not configured");
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.APP_URL || "https://ais-build.com",
      "X-Title": "PortfolioGenie AI",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    sources: [] 
  };
}

// Support for both ESM and CJS (when bundled)
let currentDirPath = process.cwd();
try {
  const isEsm = typeof import.meta?.url !== 'undefined';
  if (isEsm) {
    const filePath = fileURLToPath(import.meta.url);
    currentDirPath = path.dirname(filePath);
  } else {
    // @ts-ignore
    currentDirPath = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  }
} catch (e) {
  // Fallback to process.cwd()
}

const app = express();

const startServer = async () => {
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
  });

  const getOAuth2Client = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Normalize APP_URL (remove trailing slash)
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const redirectUri = `${appUrl}/auth/callback`;

    if (!clientId || !clientSecret) {
      console.warn('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables. Google Drive features will not work.');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  };

  const SCOPES = [
    'https://www.googleapis.com/auth/drive.file', 
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  // Auth URL endpoint
  app.get('/api/auth/google/url', (req, res) => {
    const client = getOAuth2Client();
    try {
      const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
      });
      res.json({ url });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ error: 'Failed to generate authentication URL' });
    }
  });

  // Callback handler
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('No code provided');
    }
    
    try {
      const client = getOAuth2Client();
      const { tokens } = await client.getToken(code as string);
      
      // Store tokens in a secure cookie
      res.cookie('google_tokens', JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #059669;">Authentication Successful</h2>
              <p style="color: #64748b;">This window will close automatically.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send('Authentication failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  });

  // Check auth status
  app.get('/api/auth/status', (req, res) => {
    const tokens = req.cookies.google_tokens;
    res.json({ isAuthenticated: !!tokens });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('google_tokens', {
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  });

  // Gemini Chat Proxy
  app.post('/api/chat', async (req, res) => {
    const { history, options, provider } = req.body;
    const systemPrompt = req.body.systemPrompt || "You are Genie, a helpful career assistant.";
    
    try {
      if (provider === 'openrouter' && OPENROUTER_API_KEY) {
        const messages = history.map((m: any) => ({
          role: m.role,
          content: m.content
        }));
        const result = await callOpenRouter(messages, systemPrompt, options?.model || "openai/gpt-4o-mini");
        return res.json(result);
      }

      const { thinkingMode, attachments } = options || {};
      const modelName = (thinkingMode || (attachments && attachments.length > 0)) 
        ? 'gemini-3.1-pro-preview' 
        : 'gemini-3-flash-preview';

      const config: any = {
        systemInstruction: req.body.systemPrompt || "You are Genie, a helpful career assistant.",
        temperature: 0.7,
      };

      if (thinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      const contents = history.map((m: any) => {
        const parts: any[] = [{ text: m.content }];
        if (m.attachments) {
          m.attachments.forEach((att: any) => {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data
              }
            });
          });
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });

      const result = await ai.models.generateContent({
        model: modelName,
        contents,
        config
      });

      const text = result.text || "I'm having trouble thinking right now.";
      const sources: any[] = [];
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri
            });
          }
        });
      }

      res.json({ text, sources });
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: "Failed to communicate with Gemini" });
    }
  });

  // Gemini Extraction Proxy
  app.post('/api/extract', async (req, res) => {
    const { history, provider } = req.body;
    const extractionPrompt = "Now, based on all the information shared above, extract the user's professional profile information into the specified JSON format. Ensure all sections are populated based on the conversation.";
    
    try {
      if (provider === 'openrouter' && OPENROUTER_API_KEY) {
        const messages = history.map((m: any) => ({
          role: m.role,
          content: m.content
        }));
        messages.push({ role: "user", content: extractionPrompt + " Output ONLY valid raw JSON." });
        
        const result = await callOpenRouter(messages, "You are a professional JSON data extractor.", "openai/gpt-4o");
        let extractedData;
        try {
          // Cleanup potential markdown blocks
          const jsonStr = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
          extractedData = JSON.parse(jsonStr);
        } catch (e) {
          console.error("OpenRouter Extraction Parse Error:", result.text);
          throw new Error("Failed to parse OpenRouter extraction");
        }
        return res.json(extractedData);
      }

      const contents = history.map((m: any) => {
        const parts: any[] = [{ text: m.content }];
        if (m.attachments) {
          m.attachments.forEach((att: any) => {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.data
              }
            });
          });
        }
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });

      contents.push({
        role: 'user',
        parts: [{ text: "Now, based on all the information shared above, extract the user's professional profile information into the specified JSON format. Ensure all sections are populated based on the conversation." }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              title: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              summary: { type: Type.STRING },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    description: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    institution: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    year: { type: Type.STRING }
                  }
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
                    link: { type: Type.STRING }
                  }
                }
              },
              socialLinks: {
                type: Type.OBJECT,
                properties: {
                  linkedin: { type: Type.STRING },
                  github: { type: Type.STRING },
                  portfolio: { type: Type.STRING },
                  twitter: { type: Type.STRING },
                  instagram: { type: Type.STRING },
                  youtube: { type: Type.STRING }
                }
              },
              awards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    year: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
              goals: { type: Type.ARRAY, items: { type: Type.STRING } },
              certifications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    issuer: { type: Type.STRING },
                    year: { type: Type.STRING },
                    link: { type: Type.STRING }
                  }
                }
              },
              activities: { type: Type.ARRAY, items: { type: Type.STRING } },
              references: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    position: { type: Type.STRING },
                    company: { type: Type.STRING },
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING }
                  }
                }
              },
              themeColor: { type: Type.STRING }
            }
          }
        }
      });

      let extractedData;
      try {
        extractedData = JSON.parse(response.text);
      } catch (parseError) {
        console.error("JSON Parse Error from Gemini:", response.text);
        // Fallback to searching for JSON block if necessary
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse extracted profile data as JSON");
        }
      }
      res.json(extractedData);
    } catch (error) {
      console.error("Extraction Error:", error);
      res.status(500).json({ error: "Failed to extract profile data" });
    }
  });

  // List Drive files
  app.get('/api/drive/list', async (req, res) => {
    const tokenStr = req.cookies.google_tokens;
    if (!tokenStr) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const tokens = JSON.parse(tokenStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth: client });
      
      const response = await drive.files.list({
        pageSize: 10,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
        q: "mimeType != 'application/vnd.google-apps.folder' and trashed = false"
      });

      res.json(response.data.files);
    } catch (error) {
      console.error('Drive API error:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  // Upload to Drive - Generic handler
  app.post('/api/drive/upload', express.raw({ type: '*/*', limit: '20mb' }), async (req, res) => {
    const tokenStr = req.cookies.google_tokens;
    if (!tokenStr) return res.status(401).json({ error: 'Not authenticated' });

    const fileName = req.query.name as string || 'portfolio_export';
    const mimeType = req.headers['content-type'] || 'application/octet-stream';

    try {
      const tokens = JSON.parse(tokenStr);
      const client = getOAuth2Client();
      client.setCredentials(tokens);
      
      // Handle token refreshing automatically
      client.on('tokens', (newTokens) => {
        if (newTokens.refresh_token) {
          // You might want to update the cookie here, but for now we'll just log
          console.log('New refresh token received');
        }
      });

      const drive = google.drive({ version: 'v3', auth: client });

      const fileMetadata = {
        name: fileName,
      };
      const media = {
        mimeType: mimeType,
        body: req.body,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink',
      });

      res.json(file.data);
    } catch (error) {
      console.error('Drive upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
