import React from 'react';

interface MarkdownContentProps {
  content: string;
  onWikiLinkClick?: (slug: string) => void;
  onEditSection?: (sectionTitle: string) => void;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  onWikiLinkClick,
  onEditSection
}) => {
  // Parse citations <ref>text</ref> or [1], [2] and wiki links [[slug|Display Title]]
  const parseInlineElements = (text: string) => {
    // First, process <ref>...</ref> citations
    let processedText = text;
    const citations: string[] = [];
    processedText = processedText.replace(/<ref>(.*?)<\/ref>/g, (_, citationText) => {
      citations.push(citationText);
      return `[ref:${citations.length}]`;
    });

    const parts: React.ReactNode[] = [];
    const combinedRegex = /(\[\[.*?\]\]|\[ref:\d+\]|\[\d+\])/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(processedText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(processedText.substring(lastIndex, match.index));
      }

      const matchStr = match[0];

      if (matchStr.startsWith('[[')) {
        // WikiLink [[slug|title]]
        const inner = matchStr.slice(2, -2);
        const pipeIdx = inner.indexOf('|');
        const slug = pipeIdx !== -1 ? inner.substring(0, pipeIdx).trim() : inner.trim();
        const label = pipeIdx !== -1 ? inner.substring(pipeIdx + 1).trim() : slug;

        parts.push(
          <button
            key={`wiki-${match.index}`}
            onClick={(e) => {
              e.preventDefault();
              if (onWikiLinkClick) onWikiLinkClick(slug);
              else window.location.href = `/articles/${slug}`;
            }}
            className="text-[#36c] dark:text-blue-400 hover:underline font-normal inline-flex items-center gap-0.5"
          >
            <span>{label}</span>
          </button>
        );
      } else if (matchStr.startsWith('[ref:')) {
        // Citation <ref>
        const refNum = matchStr.replace('[ref:', '').replace(']', '');
        parts.push(
          <sup key={`ref-${match.index}`} className="ml-0.5 font-sans text-[11px]">
            <a
              href="#wikipedia-references"
              className="text-[#36c] hover:underline font-bold px-0.5"
              title={`Примечание [${refNum}]`}
            >
              [{refNum}]
            </a>
          </sup>
        );
      } else if (/^\[\d+\]$/.test(matchStr)) {
        // Citation [1]
        const num = matchStr.slice(1, -1);
        parts.push(
          <sup key={`refnum-${match.index}`} className="ml-0.5 font-sans text-[11px]">
            <a
              href="#wikipedia-references"
              className="text-[#36c] hover:underline font-bold px-0.5"
            >
              [{num}]
            </a>
          </sup>
        );
      }

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < processedText.length) {
      parts.push(processedText.substring(lastIndex));
    }

    return parts;
  };

  // Convert custom lines and headers into JSX
  const renderFormattedLines = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Table parsing
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        // End of table block, render table
        inTable = false;
        if (tableRows.length > 0) {
          const headerRow = tableRows[0];
          const isHeaderSep = tableRows[1] && tableRows[1].every((c) => c.startsWith(':') || c.startsWith('-'));
          const bodyRows = isHeaderSep ? tableRows.slice(2) : tableRows.slice(1);

          elements.push(
            <div key={`table-${index}`} className="my-6 overflow-x-auto rounded border border-[#a2a9b1] dark:border-slate-800 shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm font-sans">
                <thead className="bg-[#eaecf0] dark:bg-slate-800 text-[#202122] dark:text-slate-200 font-bold border-b border-[#a2a9b1] dark:border-slate-700">
                  <tr>
                    {headerRow.map((cell, idx) => (
                      <th key={idx} className="p-2.5 border-r border-[#a2a9b1]/60 dark:border-slate-700 last:border-r-0">
                        {parseInlineElements(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#a2a9b1]/40 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 border-r border-[#a2a9b1]/40 dark:border-slate-800 last:border-r-0 text-slate-800 dark:text-slate-200">
                          {parseInlineElements(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          tableRows = [];
        }
      }

      if (trimmed.startsWith('## ')) {
        const titleText = trimmed.replace('## ', '');
        const id = titleText.toLowerCase().replace(/[^\w\u0400-\u04FF\s]/g, '').trim().replace(/\s+/g, '-');
        elements.push(
          <div key={index} className="flex items-center justify-between border-b border-[#a2a9b1] dark:border-slate-800 pb-1 mt-8 mb-4 group">
            <h2
              id={id}
              className="text-2xl font-bold font-serif text-[#202122] dark:text-white scroll-mt-20"
            >
              {titleText}
            </h2>
            {onEditSection && (
              <button
                onClick={() => onEditSection(titleText)}
                className="text-xs text-[#36c] font-sans font-normal hover:underline opacity-80 group-hover:opacity-100 transition"
                title={`Править раздел «${titleText}»`}
              >
                [править]
              </button>
            )}
          </div>
        );
      } else if (trimmed.startsWith('### ')) {
        const titleText = trimmed.replace('### ', '');
        const id = titleText.toLowerCase().replace(/[^\w\u0400-\u04FF\s]/g, '').trim().replace(/\s+/g, '-');
        elements.push(
          <div key={index} className="flex items-center justify-between border-b border-[#a2a9b1]/40 dark:border-slate-800/80 pb-0.5 mt-6 mb-3 group">
            <h3
              id={id}
              className="text-xl font-bold font-serif text-[#202122] dark:text-slate-100 scroll-mt-20"
            >
              {titleText}
            </h3>
            {onEditSection && (
              <button
                onClick={() => onEditSection(titleText)}
                className="text-[11px] text-[#36c] font-sans font-normal hover:underline opacity-80 group-hover:opacity-100 transition"
              >
                [править]
              </button>
            )}
          </div>
        );
      } else if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.replace('> ', '');
        elements.push(
          <blockquote
            key={index}
            className="my-4 pl-4 py-2 border-l-2 border-[#36c] bg-[#f8f9fa] dark:bg-slate-900 text-slate-800 dark:text-slate-200 italic font-serif"
          >
            {parseInlineElements(quoteText)}
          </blockquote>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.substring(2);
        elements.push(
          <li key={index} className="ml-6 list-disc text-slate-800 dark:text-slate-200 my-1 font-sans">
            {parseInlineElements(itemText)}
          </li>
        );
      } else if (trimmed === '---') {
        elements.push(<hr key={index} className="my-8 border-[#a2a9b1] dark:border-slate-800" />);
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={index} className="my-3 text-[#202122] dark:text-slate-200 leading-relaxed font-sans">
            {parseInlineElements(line)}
          </p>
        );
      } else {
        elements.push(<div key={index} className="h-2" />);
      }
    });

    return elements;
  };

  return <div className="prose dark:prose-invert max-w-none font-sans leading-relaxed text-sm sm:text-base">{renderFormattedLines()}</div>;
};
