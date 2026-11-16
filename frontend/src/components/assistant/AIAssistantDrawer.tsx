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
import AgronomicMessageRenderer from './AgronomicMessageRenderer';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  followups?: string[];
  references?: string[];
  provider?: string;
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
        provider: res.provider,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full sm:max-w-xl md:max-w-2xl h-full flex flex-col shadow-2xl animate-slide-left border-l border-forest-900/15">
        {/* Header */}
        <div className="p-4 border-b border-forest-900/10 flex items-center justify-between bg-forest-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-800 border border-forest-700/50 flex items-center justify-center text-emerald-400 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-white tracking-wide">
                  TeaVision Agronomist
                </h3>
                <span className="flex items-center gap-1 text-[10px] bg-forest-900 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AI Copilot
                </span>
              </div>
              <p className="text-[11px] text-forest-300 flex items-center gap-1.5 mt-0.5">
                <span>TRI-Guided Plant Pathology</span>
                {contextDisease && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-300 font-medium">{contextDisease}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-forest-900 flex items-center justify-center text-forest-300 hover:text-white transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-surface">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[95%] sm:max-w-[92%]">
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-forest-900 text-emerald-400 border border-forest-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl text-xs leading-relaxed transition-all ${
                    m.sender === 'user'
                      ? 'bg-forest-900 text-white rounded-tr-none px-4 py-2.5 shadow-sm'
                      : 'bg-white border border-forest-900/10 text-tv-primary rounded-tl-none p-4 shadow-sm w-full'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <div className="font-medium">{m.text}</div>
                  ) : (
                    <AgronomicMessageRenderer
                      text={m.text}
                      provider={m.provider}
                      references={m.references}
                    />
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-forest-200 text-forest-900 flex items-center justify-center flex-shrink-0 mt-1 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Followup suggestions */}
              {m.followups && m.followups.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 pl-9 max-w-[95%]">
                  {m.followups.map((f, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(f)}
                      className="text-[11px] bg-white hover:bg-forest-50 text-forest-900 border border-forest-900/15 hover:border-forest-600 px-3 py-1.5 rounded-full text-left transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs group"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="font-medium">{f}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-forest-800 pl-9 p-3 bg-forest-50/70 border border-forest-200 rounded-xl animate-fade-in w-fit">
              <Loader2 className="w-4 h-4 text-forest-700 animate-spin flex-shrink-0" />
              <span>Analyzing foliage pathology &amp; synthesizing field guidance…</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3.5 border-t border-forest-900/10 bg-white">
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about cultural controls, organic fungicides, weather triggers..."
              className="flex-1 text-xs rounded-xl border border-forest-900/20 p-2.5 bg-surface focus:outline-none focus:ring-2 focus:ring-forest-700 focus:bg-white transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary p-2.5 rounded-xl disabled:opacity-40 shadow-xs flex-shrink-0"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Scientific Disclaimer */}
          <p className="text-[10px] text-tv-secondary text-center mt-2 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3 text-forest-600 flex-shrink-0" />
            <span>AI guidance is synthesized from agricultural literature. Confirm with estate extension officers before chemical applications.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

