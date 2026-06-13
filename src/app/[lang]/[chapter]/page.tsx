import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { parseChapter, getChapters } from '@/lib/markdownParser';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/components/Header';
import { Award, BookOpen } from 'lucide-react';


interface PageProps {
  params: Promise<{
    lang: string;
    chapter: string;
  }>;
}

export default async function ChapterPage({ params }: PageProps) {
  const { lang, chapter } = await params;

  if (lang !== 'de' && lang !== 'en') {
    notFound();
  }

  let data;
  try {
    data = parseChapter(lang, chapter);
  } catch (e) {
    notFound();
  }

  const chapters = getChapters(lang);
  const currentCh = chapters.find((c) => c.id === chapter);
  const nextCh = chapters.find((c) => c.number === (currentCh?.number || 0) + 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        showBackButton
        backHref={`/${lang}`}
        backLabel={lang === 'de' ? 'Zurück' : 'Back'}
        actionButton={
          <Link
            href={`/${lang}/${chapter}/quiz`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/10"
          >
            <Award className="h-4 w-4" />
            {lang === 'de' ? 'Quiz starten' : 'Start Quiz'}
          </Link>
        }
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        <article className="prose prose-invert prose-indigo max-w-none space-y-6 sm:space-y-8">
          {/* Header Title */}
          <div className="space-y-2 sm:space-y-4 pb-6 sm:pb-8 border-b border-slate-800">
            <span className="text-[10px] sm:text-sm font-bold tracking-wider uppercase text-indigo-400">
              {lang === 'de' ? `Kapitel ${currentCh?.number}` : `Chapter ${currentCh?.number}`}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {data.title.replace(/^#\s+/i, '').replace(/^Kapitel\s+\d+:\s*/i, '').replace(/^Chapter\s+\d+:\s*/i, '').trim()}
            </h1>
          </div>

          {/* Theory Markdown Renderer */}
          <div className="markdown-body text-slate-350 leading-relaxed text-sm sm:text-base space-y-4 sm:space-y-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => <h1 className="text-xl sm:text-2xl font-bold text-white mt-8 mb-4 border-b border-slate-800 pb-2" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg sm:text-xl font-bold text-white mt-6 mb-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-5 mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 text-slate-350 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4 pl-2 sm:pl-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4 pl-2 sm:pl-4" {...props} />,
                li: ({ node, ...props }) => <li className="text-slate-350" {...props} />,
                code: ({ node, className, children, ...props }) => {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="bg-slate-900 border border-slate-800 text-indigo-300 px-1 py-0.5 rounded text-xs sm:text-sm font-mono break-all sm:break-normal" {...props}>{children}</code>;
                  }
                  return (
                    <pre className="bg-slate-900 border border-slate-800/80 rounded-lg sm:rounded-xl p-3 sm:p-5 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 my-4 leading-normal">
                      <code className="block bg-transparent p-0 border-0 text-slate-200" {...props}>{children}</code>
                    </pre>
                  );
                },
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-6 border border-slate-850 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-slate-900 border-b border-slate-850 text-slate-200 font-semibold" {...props} />,
                tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-850" {...props} />,
                tr: ({ node, ...props }) => <tr className="hover:bg-slate-900/40 transition-colors" {...props} />,
                th: ({ node, ...props }) => <th className="px-3 py-2 sm:px-4 sm:py-3" {...props} />,
                td: ({ node, ...props }) => <td className="px-3 py-2 sm:px-4 sm:py-3 text-slate-350" {...props} />,
              }}
            >
              {data.theoryMarkdown}
            </ReactMarkdown>
          </div>
        </article>

        {/* Footer Navigation */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-800 flex items-center justify-between">
          <div />
          {nextCh && (
            <Link
              href={`/${lang}/${nextCh.id}`}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 rounded-xl text-sm font-semibold text-slate-200 hover:text-white transition-all"
            >
              {lang === 'de' ? 'Nächstes Kapitel' : 'Next Chapter'}
              <BookOpen className="h-4 w-4" />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
