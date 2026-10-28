import React, { useState } from 'react';
import { Article } from '../types/index.js';
import { api } from '../api/client.js';
import { ThumbsUp, ThumbsDown, Terminal, ExternalLink, Sparkles } from 'lucide-react';

interface AbsurdityCardProps {
  article: Article;
  onNavigate: (path: string) => void;
}

export const AbsurdityCard: React.FC<AbsurdityCardProps> = ({ article, onNavigate }) => {
  const [likes, setLikes] = useState<number>(article.likes || 120);
  const [dislikes, setDislikes] = useState<number>(article.dislikes || 5);
  const [voted, setVoted] = useState<'like' | 'dislike' | null>(null);

  const handleVote = async (type: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();
    if (voted === type) return;

    if (type === 'like') {
      setLikes((prev) => prev + 1);
      if (voted === 'dislike') setDislikes((prev) => Math.max(0, prev - 1));
    } else {
      setDislikes((prev) => prev + 1);
      if (voted === 'like') setLikes((prev) => Math.max(0, prev - 1));
    }
    setVoted(type);

    try {
      await api.voteArticle(article.id, type);
    } catch (err) {
      console.error(err);
    }
  };

  // Extract Example block if formatted with quote block
  const lines = article.content.split('\n');
  const quoteLines = lines.filter((l) => l.trim().startsWith('> ')).map((l) => l.replace('> ', ''));
  const exampleText = quoteLines.length > 0 ? quoteLines.join('\n') : null;

  return (
    <div
      onClick={() => onNavigate(`/articles/${article.slug}`)}
      className="group relative bg-[#0B0F19]/90 border border-slate-800 hover:border-[#00FF66] rounded-2xl p-6 shadow-lg hover:shadow-[0_0_25px_rgba(0,255,102,0.15)] transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top Tag & ID */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20"
              >
                #{tag}
              </span>
            ))}
          </div>
          <span className="text-[10px] font-mono text-slate-500">ID: {article.slug.substring(0, 10)}</span>
        </div>

        {/* Title */}
        <h3 className="font-mono font-bold text-xl text-white group-hover:text-[#00FF66] transition-colors leading-snug mb-3">
          {article.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4 font-sans">
          {article.subtitle || article.content.substring(0, 140)}
        </p>

        {/* Real Example Box */}
        {exampleText && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-[#00FF66] mb-4 space-y-1">
            <div className="text-[10px] text-[#FF007A] font-bold flex items-center gap-1 uppercase tracking-wider">
              <Terminal className="w-3 h-3" /> Пример тупизма:
            </div>
            <p className="text-slate-200 text-xs italic leading-normal whitespace-pre-wrap">
              {exampleText}
            </p>
          </div>
        )}
      </div>

      {/* Voting & Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleVote('like', e)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              voted === 'like'
                ? 'bg-[#00FF66] text-slate-950 font-bold border-[#00FF66]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
            title="Это гениально!"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{likes}</span>
          </button>

          <button
            onClick={(e) => handleVote('dislike', e)}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              voted === 'dislike'
                ? 'bg-[#FF007A] text-white font-bold border-[#FF007A]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
            title="Кринж"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{dislikes}</span>
          </button>
        </div>

        <span className="text-slate-500 group-hover:text-[#00FF66] transition flex items-center gap-1">
          Читать полный разбор <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
