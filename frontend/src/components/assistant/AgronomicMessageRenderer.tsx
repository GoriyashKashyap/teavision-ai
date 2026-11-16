import { useState } from 'react';
import {
  Leaf,
  Sparkles,
  AlertTriangle,
  Eye,
  Info,
  Check,
  Copy,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface Props {
  text: string;
  provider?: string;
  references?: string[];
}

interface SectionItem {
  key?: string;
  body: string;
  isCrucial?: boolean;
}

interface Section {
  heading: string;
  category: 'cultural' | 'organic' | 'nutrition' | 'chemical' | 'monitoring' | 'general';
  items: SectionItem[];
  rawText?: string;
}

function parseFormattedText(text: string): { intro: string; sections: Section[]; outro: string } {
  // Strip trailing divider and provider notes if embedded in text
  const clean = text
    .replace(/\*\*\*\s*Powered by [^\n]+/gi, '')
    .replace(/Powered by [^\n]+/gi, '')
    .trim();

  // Split by ### headings
  const parts = clean.split(/(?=###\s+)/g);
  let intro = '';
  const sections: Section[] = [];
  let outro = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (!part.startsWith('###')) {
      if (sections.length === 0) {
        intro = part;
      } else {
        outro += (outro ? '\n\n' : '') + part;
      }
      continue;
    }

    // It's a section
    const lines = part.split('\n');
    const headerLine = lines[0].replace(/^###\s+/, '').trim();
    const bodyLines = lines.slice(1).join('\n').trim();

    // Determine category
    const lowerHeader = headerLine.toLowerCase();
    let category: Section['category'] = 'general';
    if (lowerHeader.includes('cultural') || lowerHeader.includes('sanitation') || lowerHeader.includes('plucking') || lowerHeader.includes('pruning')) {
      category = 'cultural';
    } else if (lowerHeader.includes('biological') || lowerHeader.includes('organic') || lowerHeader.includes('bio')) {
      category = 'organic';
    } else if (lowerHeader.includes('nutrition') || lowerHeader.includes('soil') || lowerHeader.includes('fertilizer') || lowerHeader.includes('potassium')) {
      category = 'nutrition';
    } else if (lowerHeader.includes('chemical') || lowerHeader.includes('spray') || lowerHeader.includes('fungicide')) {
      category = 'chemical';
    } else if (lowerHeader.includes('monitor') || lowerHeader.includes('scout') || lowerHeader.includes('inspection')) {
      category = 'monitoring';
    }

    // Parse bullet points
    const rawBullets = bodyLines.split(/(?=\n\s*[-*]\s+)/g);
    const items: SectionItem[] = [];

    for (const b of rawBullets) {
      const cleanBullet = b.trim().replace(/^[-*]\s+/, '').trim();
      if (!cleanBullet) continue;

      // Check if bullet has **Key:** format
      const match = cleanBullet.match(/^\*\*([^*]+)\*\*:\s*(.*)$/s);
      if (match) {
        const key = match[1].trim();
        const body = match[2].trim();
        const isCrucial = key.toLowerCase().includes('crucial') || key.toLowerCase().includes('warning') || key.toLowerCase().includes('caution');
        items.push({ key, body, isCrucial });
      } else {
        items.push({ body: cleanBullet });
      }
    }

    sections.push({
      heading: headerLine,
      category,
      items,
      rawText: bodyLines,
    });
  }

  return { intro, sections, outro };
}

// Render inline markdown (*italics*, **bold**, `code`)
function InlineMarkdown({ content }: { content: string }) {
  // Quick regex tokenizer for bold, italic, and bold-italic
  const parts = content.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|_.*?_|`.*?`)/g);

  return (
    <span>
      {parts.map((p, idx) => {
        if (!p) return null;
        if (p.startsWith('***') && p.endsWith('***')) {
          return <strong key={idx} className="font-semibold italic">{p.slice(3, -3)}</strong>;
        }
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={idx} className="font-semibold text-tv-primary">{p.slice(2, -2)}</strong>;
        }
        if ((p.startsWith('*') && p.endsWith('*')) || (p.startsWith('_') && p.endsWith('_'))) {
          return <em key={idx} className="italic font-serif text-forest-900">{p.slice(1, -1)}</em>;
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return <code key={idx} className="bg-forest-100 text-forest-900 px-1 py-0.5 rounded font-mono text-[11px]">{p.slice(1, -1)}</code>;
        }
        return <span key={idx}>{p}</span>;
      })}
    </span>
  );
}

export default function AgronomicMessageRenderer({ text, provider, references }: Props) {
  const [copied, setCopied] = useState(false);
  const { intro, sections, outro } = parseFormattedText(text);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryStyles = (category: Section['category']) => {
    switch (category) {
      case 'cultural':
        return {
          cardBg: 'bg-emerald-50/70 border-emerald-200/80',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          titleColor: 'text-emerald-950',
          icon: <Leaf className="w-3.5 h-3.5 text-emerald-700" />,
          label: 'Cultural & Field Hygiene',
        };
      case 'organic':
        return {
          cardBg: 'bg-teal-50/70 border-teal-200/80',
          badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
          titleColor: 'text-teal-950',
          icon: <Sparkles className="w-3.5 h-3.5 text-teal-700" />,
          label: 'Biological & Organic IPM',
        };
      case 'nutrition':
        return {
          cardBg: 'bg-sky-50/70 border-sky-200/80',
          badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
          titleColor: 'text-sky-950',
          icon: <Info className="w-3.5 h-3.5 text-sky-700" />,
          label: 'Plant Nutrition & Soil',
        };
      case 'chemical':
        return {
          cardBg: 'bg-amber-50/80 border-amber-300',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          titleColor: 'text-amber-950',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />,
          label: 'Chemical Protocol (Requires Clearance)',
        };
      case 'monitoring':
        return {
          cardBg: 'bg-purple-50/70 border-purple-200/80',
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
          titleColor: 'text-purple-950',
          icon: <Eye className="w-3.5 h-3.5 text-purple-700" />,
          label: 'Field Scouting & Monitoring',
        };
      default:
        return {
          cardBg: 'bg-forest-50/60 border-forest-200',
          badgeBg: 'bg-forest-100 text-forest-900 border-forest-300',
          titleColor: 'text-forest-950',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />,
          label: 'Agronomic Protocol',
        };
    }
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Intro Paragraph */}
      {intro && (
        <div className="p-3 bg-white/90 rounded-xl border border-forest-900/10 shadow-2xs leading-relaxed text-tv-primary">
          <InlineMarkdown content={intro} />
        </div>
      )}

      {/* Structured Section Cards */}
      {sections.length > 0 ? (
        <div className="space-y-2.5">
          {sections.map((sec, sIdx) => {
            const styles = getCategoryStyles(sec.category);
            return (
              <div
                key={sIdx}
                className={`p-3.5 rounded-xl border ${styles.cardBg} shadow-2xs transition-all hover:shadow-xs`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-forest-900/10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center shadow-2xs border border-forest-900/10">
                      {styles.icon}
                    </div>
                    <h4 className={`font-display font-bold text-xs ${styles.titleColor}`}>
                      {sec.heading}
                    </h4>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${styles.badgeBg}`}>
                    {styles.label}
                  </span>
                </div>

                {/* Bullets */}
                {sec.items.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {sec.items.map((item, bIdx) => (
                      <li
                        key={bIdx}
                        className={`text-xs leading-relaxed p-2 rounded-lg ${
                          item.isCrucial
                            ? 'bg-amber-100/70 border border-amber-300 text-amber-950'
                            : 'bg-white/80 border border-forest-900/5'
                        }`}
                      >
                        {item.key && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 flex-shrink-0" />
                            <strong className="text-tv-primary font-bold text-[11px] uppercase tracking-wide">
                              {item.key}
                            </strong>
                          </div>
                        )}
                        <div className="text-tv-secondary pl-3">
                          <InlineMarkdown content={item.body} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-tv-secondary mt-1">
                    <InlineMarkdown content={sec.rawText || ''} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback if no ### sections were detected */
        !intro && (
          <div className="whitespace-pre-line text-tv-primary leading-relaxed">
            <InlineMarkdown content={cleanText(text)} />
          </div>
        )
      )}

      {/* Outro Paragraph */}
      {outro && (
        <div className="p-3 bg-white/90 rounded-xl border border-forest-900/10 shadow-2xs leading-relaxed text-tv-primary">
          <InlineMarkdown content={outro} />
        </div>
      )}

      {/* Action footer: Provider pill + Copy Button */}
      <div className="pt-2 flex items-center justify-between border-t border-forest-900/10 text-[10px]">
        {provider ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-forest-100/70 text-forest-900 border border-forest-300 font-mono text-[10px]">
            <Cpu className="w-3 h-3 text-forest-700" />
            <span>{provider}</span>
          </div>
        ) : (
          <span />
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-forest-700 hover:text-forest-900 px-2 py-1 rounded hover:bg-forest-100 transition-colors"
          title="Copy response to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-forest-600" />
              <span>Copy Advice</span>
            </>
          )}
        </button>
      </div>

      {/* References */}
      {references && references.length > 0 && (
        <div className="mt-2 pt-2 border-t border-forest-900/10 text-[10px] text-tv-secondary space-y-1">
          <span className="font-bold uppercase tracking-wider block text-forest-800">
            Pathology References &amp; Standards:
          </span>
          {references.map((ref, idx) => (
            <p key={idx} className="italic text-forest-700">
              • {ref}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function cleanText(raw: string): string {
  return raw
    .replace(/\*\*\*\s*Powered by [^\n]+/gi, '')
    .replace(/Powered by [^\n]+/gi, '')
    .trim();
}
