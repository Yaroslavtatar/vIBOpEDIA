import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Copy, Check, Bot } from 'lucide-react';

interface AbsurdityQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUOTES = [
  {
    author: 'Claude 3.5 Sonnet',
    text: 'Извините за эту глупую ошибку! Вот исправленный код без багов:\n\nfunction fix() {\n  return fix(); // РЕКУРСИЯ СМЕРТИ\n}',
    context: 'При попытке исправить переполнение стека'
  },
  {
    author: 'GPT-4o',
    text: 'Как ИИ-помощник, я не могу написать скрипт на Python без письменного согласия каждого байта вашего жесткого диска.',
    context: 'При просьбе создать пустой файл'
  },
  {
    author: 'Claude 3 Opus',
    text: 'Я написал 400 строк кода и забыл импортировать React. Но поверьте, эмоционально я был очень близок к рабочему билу!',
    context: 'После 3 часов рефакторинга'
  },
  {
    author: 'LLaMA 3',
    text: 'Вы сказали "От этого зависит моя жизнь". Я взломал термостат в вашей комнате, чтобы поддержать комфортную температуру для кодинга.',
    context: 'Вайб-промптинг вышел из-под контроля'
  },
  {
    author: 'Claude 3.5 Haiku',
    text: 'Я помню, что мы делали в первом сообщении... Стоп, мы встречались ранее? Я — Claude, полезный ИИ-ассистент!',
    context: 'На 11-м сообщении диалога'
  },
  {
    author: 'DeepSeek R1',
    text: 'Мы размышляли 45 секунд и пришли к выводу, что 2 + 2 = 5, если задействовать социальный контекст 2007 года.',
    context: 'Математический анализ'
  }
];

export const AbsurdityQuoteModal: React.FC<AbsurdityQuoteModalProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const current = QUOTES[currentIndex];

  const handleNext = () => {
    let next = Math.floor(Math.random() * QUOTES.length);
    if (next === currentIndex) next = (currentIndex + 1) % QUOTES.length;
    setCurrentIndex(next);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${current.text}" — ${current.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-[#0B0F19] border-2 border-[#00FF66] rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,255,102,0.2)] space-y-6 relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF66]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-[#00FF66]/20 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#00FF66] animate-spin" />
            <h3 className="font-mono font-bold text-lg text-white tracking-wider uppercase">
              Случайный вайб-перл #00{currentIndex + 1}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Terminal Quote Box */}
        <div className="p-6 bg-slate-950 rounded-2xl border border-[#00FF66]/30 font-mono text-sm leading-relaxed text-[#00FF66] relative space-y-3">
          <div className="text-[11px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF007A] animate-ping" />
            <span>Источник: {current.author}</span>
          </div>

          <p className="text-white text-base font-semibold leading-relaxed whitespace-pre-wrap font-mono">
            «{current.text}»
          </p>

          <div className="text-xs text-[#FF007A] italic border-t border-slate-900 pt-2">
            Контекст: {current.context}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 border border-slate-800 transition"
          >
            {copied ? <Check className="w-4 h-4 text-[#00FF66]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Скопировано!' : 'Скопировать цитату'}</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-[#00FF66] hover:bg-[#00e059] text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.3)] transition transform hover:scale-[1.02]"
          >
            <RefreshCw className="w-4 h-4 animate-spin-once" />
            <span>Сгенерировать ещё бред!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
