import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  X,
  Send,
  Loader2,
  ShieldAlert,
  Bot,
  User,
  Sparkles,
} from 'lucide-react';
import { askAssistant } from '../../services/api';
import type { AssistantChatResponse } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  followups?: string[];
  references?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  contextDisease?: string;
}

export default function AIAssistantDrawer({ isOpen, onClose, contextDisease }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: contextDisease
        ? `Hello! I am your **TeaVision Agronomist Assistant**. How can I help you regarding **${contextDisease}**? You can ask about typical symptoms, organic IPM controls, or pruning practices.`
        : "Hello! I am your **TeaVision Agronomist Assistant**. Ask me anything about tea leaf diseases, fungal blights, insect pests, or plantation management.",
      followups: contextDisease
        ? [
            `What are the organic controls for ${contextDisease}?`,
            `What weather conditions trigger ${contextDisease}?`,
            `How do I distinguish ${contextDisease} from mechanical injury?`,
          ]
        : [
            'How do I prevent Brown Blight in rainy seasons?',
            'What causes Gray Blight?',
            'How do I control Helopeltis naturally?',
            'What organic remedies work for Red Spider Mite?',
          ],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res: AssistantChatResponse = await askAssistant(trimmed, contextDisease);
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        followups: res.suggested_followups,
        references: res.references,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I'm having trouble retrieving agronomic information right now. Please check that the backend server is running and try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-left border-l border-forest-900/10">
        {/* Header */}
        <div className="p-4 border-b border-forest-900/10 flex items-center justify-between bg-forest-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center text-forest-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-sm text-white">TeaVision Agronomist</h3>
                <span className="text-[10px] bg-forest-800 text-forest-200 px-1.5 py-0.5 rounded font-mono">
                  TRI-Guided
                </span>
              </div>
              <p className="text-[11px] text-forest-200">
                {contextDisease ? `Context: ${contextDisease}` : 'Plantation Intelligence'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-forest-800 flex items-center justify-center text-forest-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[90%]">
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-forest-700 text-white flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-forest-900 text-white rounded-tr-none'
                      : 'bg-white border border-forest-900/10 text-tv-primary rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>

                  {/* References chip list */}
                  {m.references && m.references.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-forest-900/10 text-[10px] text-tv-secondary space-y-1">
                      <span className="font-bold uppercase tracking-wider block text-forest-800">
                        References &amp; Standards:
                      </span>
                      {m.references.map((ref, idx) => (
                        <p key={idx} className="italic">
                          • {ref}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-forest-200 text-forest-900 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Followup suggestions */}
              {m.followups && m.followups.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-8 max-w-[90%]">
                  {m.followups.map((f, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(f)}
                      className="text-[11px] bg-white hover:bg-forest-50 text-forest-800 border border-forest-900/15 px-2.5 py-1 rounded-full text-left transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span>{f}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-tv-secondary pl-2 animate-fade-in">
              <Loader2 className="w-4 h-4 text-forest-700 animate-spin" />
              <span>Analyzing agronomic knowledge base…</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-forest-900/10 bg-white">
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, prevention, bio-controls..."
              className="flex-1 text-xs rounded-xl border border-forest-900/15 p-2.5 bg-surface focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Scientific Disclaimer */}
          <p className="text-[10px] text-tv-secondary text-center mt-2 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3 text-forest-600 flex-shrink-0" />
            <span>Consult agricultural officers for chemical applications.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

