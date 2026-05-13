import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Plus, Clock, Trash2, Sparkles } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  cloudStatus: 'synced' | 'syncing' | 'error' | 'offline';
  onManualSave: () => void;
  exports?: {name: string, url: string, type: string, createdAt: string}[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  onRenameSession,
  cloudStatus,
  onManualSave,
  exports = []
}) => {
  const [activeTab, setActiveTab] = React.useState<'chat' | 'exports'>('chat');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
      setEditingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-30">
              <div className="flex flex-col">
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="tracking-tight italic text-indigo-900">Genie Cloud</span>
                </h3>
                <button 
                  onClick={onManualSave}
                  className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors w-fit border border-slate-100 group"
                  title="Force Sync Now"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    cloudStatus === 'synced' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 
                    cloudStatus === 'syncing' ? 'bg-indigo-500 animate-pulse shadow-sm shadow-indigo-200' :
                    cloudStatus === 'error' ? 'bg-rose-500 shadow-sm shadow-rose-200' : 'bg-slate-300'
                  }`} />
                  <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-[0.15em]">
                    {cloudStatus === 'synced' ? 'Cloud Synced' : 
                     cloudStatus === 'syncing' ? 'Syncing...' :
                     cloudStatus === 'error' ? 'Sync Error' : 'Offline Mode'}
                  </span>
                </button>
              </div>
              <button 
                onClick={onClose} 
                className="p-2.5 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all text-slate-400 border border-transparent hover:border-rose-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex p-2 bg-slate-100/50 m-4 rounded-xl">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                History
              </button>
              <button 
                onClick={() => setActiveTab('exports')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'exports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Exports
              </button>
            </div>
            
            {activeTab === 'chat' ? (
              <>
                <div className="px-4 pb-4">
                  <button 
                    onClick={onNewChat}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Plus className="w-5 h-5" />
                    New Chat
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6">
                  {sessions.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => onSwitchSession(s.id)}
                      className={`group p-4 rounded-xl border transition-all cursor-pointer relative ${
                        currentSessionId === s.id 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {editingId === s.id ? (
                            <form 
                              onSubmit={(e) => handleRenameSubmit(e, s.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="mb-2"
                            >
                              <input 
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={(e) => handleRenameSubmit(e as any, s.id)}
                                className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-sm font-bold shadow-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                              />
                            </form>
                          ) : (
                            <p 
                              className="font-bold text-slate-900 text-sm truncate"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingId(s.id);
                                setEditTitle(s.title);
                              }}
                            >
                              {s.title}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(s.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(s.id);
                              setEditTitle(s.title);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-all"
                            title="Rename"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => onDeleteSession(e, s.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <History className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">No history yet</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-6">
                {exports.map((exp, idx) => (
                  <a 
                    key={idx}
                    href={exp.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors border border-slate-100 group-hover:border-indigo-100">
                      {exp.type.toLowerCase() === 'pdf' ? (
                        <span className="font-black text-[10px] text-rose-500">PDF</span>
                      ) : exp.type.toLowerCase() === 'docx' ? (
                        <span className="font-black text-[10px] text-blue-500">DOCX</span>
                      ) : exp.name.includes('Chat Log') ? (
                        <History className="w-5 h-5 text-indigo-500" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{exp.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(exp.createdAt).toLocaleString()}</p>
                    </div>
                  </a>
                ))}
                {exports.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Clock className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">No exported files yet</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
