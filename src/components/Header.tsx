'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, ChevronLeft } from 'lucide-react';

interface HeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  actionButton?: React.ReactNode;
}

export default function Header({ showBackButton, backHref, backLabel, actionButton }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Detect current language from pathname
  // pathnames look like: /de, /en, /de/chapter_01, /en/chapter_01/quiz
  const segments = pathname.split('/');
  const currentLang = segments[1] === 'en' ? 'en' : 'de';

  const handleLanguageChange = (newLang: 'de' | 'en') => {
    if (newLang === currentLang) return;
    
    // Replace the language segment in the pathname
    const newSegments = [...segments];
    newSegments[1] = newLang;
    const newPath = newSegments.join('/') || '/';
    router.push(newPath);
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 py-3 sm:px-4 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Back Button or Logo */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {showBackButton && backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-sm font-semibold text-slate-450 hover:text-white transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-900/50 shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden xs:inline">{backLabel || (currentLang === 'de' ? 'Zurück' : 'Back')}</span>
            </Link>
          ) : (
            <Link href={`/${currentLang}`} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <GraduationCap className="h-5 w-5 sm:h-8 sm:w-8 text-indigo-400 shrink-0" />
              <span className="font-bold text-base sm:text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent truncate">
                <span className="inline sm:hidden">Java 21 OCP</span>
                <span className="hidden sm:inline">Java 21 OCP Prep</span>
              </span>
            </Link>
          )}
        </div>

        {/* Right Side: Optional Action Button + Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {actionButton && (
            <div className="text-xs sm:text-sm font-semibold text-slate-400 whitespace-nowrap">
              {actionButton}
            </div>
          )}

          <div className="flex items-center bg-slate-905 border border-slate-800 rounded-lg p-0.5 sm:p-1">
            <button
              onClick={() => handleLanguageChange('de')}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                currentLang === 'de'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DE
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all ${
                currentLang === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
