'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Award, Search } from 'lucide-react';
import Header from '@/components/Header';

interface Chapter {
  id: string;
  number: number;
  title: string;
}

const chaptersDE: Chapter[] = [
  { id: 'chapter_01_jdk_architecture', number: 1, title: 'Kapitel 1: JDK-Architektur, Kompilierung & Ausführung' },
  { id: 'chapter_02_memory_model', number: 2, title: 'Kapitel 2: Java-Speichermodell - Stack, Heap & Variablen' },
  { id: 'chapter_03_strings', number: 3, title: 'Kapitel 3: String-Handhabung & String Constant Pool (SCP)' },
  { id: 'chapter_04_operators', number: 4, title: 'Kapitel 4: Operatoren, Casting & Kontrollflüsse' },
  { id: 'chapter_05_flow_control', number: 5, title: 'Kapitel 5: Schleifenstrukturen & Kontrollanweisungen' },
  { id: 'chapter_06_initialization', number: 6, title: 'Kapitel 6: Klassendesign, Konstruktoren & Initialisierungsreihenfolge' },
  { id: 'chapter_07_oop_inheritance', number: 7, title: 'Kapitel 7: OOP - Vererbung, Überschreiben & Shadowing' },
  { id: 'chapter_08_modern_oop', number: 8, title: 'Kapitel 8: Modernes OOP - Sealed Classes, Records & Pattern Matching' },
  { id: 'chapter_09_exceptions', number: 9, title: 'Kapitel 9: Ausnahmebehandlung & Try-With-Resources' },
  { id: 'chapter_10_date_time_localization', number: 10, title: 'Kapitel 10: Datum, Uhrzeit & Lokalisierung' },
  { id: 'chapter_11_generics', number: 11, title: 'Kapitel 11: Generika & Type Erasure' },
  { id: 'chapter_12_collections', number: 12, title: 'Kapitel 12: Collections Framework & Sequenced Collections' },
  { id: 'chapter_13_streams', number: 13, title: 'Kapitel 13: Funktionale Programmierung & Streams API' },
  { id: 'chapter_14_concurrency', number: 14, title: 'Kapitel 14: Concurrency & Virtual Threads' },
  { id: 'chapter_15_persistence_modules', number: 15, title: 'Kapitel 15: NIO.2, Serialisierung & Java-Module (JPMS)' },
];

const chaptersEN: Chapter[] = [
  { id: 'chapter_01_jdk_architecture', number: 1, title: 'Chapter 1: JDK Architecture, Compilation & Execution' },
  { id: 'chapter_02_memory_model', number: 2, title: 'Chapter 2: Java Memory Model - Stack, Heap & Variables' },
  { id: 'chapter_03_strings', number: 3, title: 'Chapter 3: String Handling & String Constant Pool (SCP)' },
  { id: 'chapter_04_operators', number: 4, title: 'Chapter 4: Operators, Casting & Flow Control Decisions' },
  { id: 'chapter_05_flow_control', number: 5, title: 'Chapter 5: Loop Structures & Control Statements' },
  { id: 'chapter_06_initialization', number: 6, title: 'Chapter 6: Class Design, Constructors & Initialization Order' },
  { id: 'chapter_07_oop_inheritance', number: 7, title: 'Chapter 7: OOP - Inheritance, Overriding & Shadowing' },
  { id: 'chapter_08_modern_oop', number: 8, title: 'Chapter 8: Modern OOP - Sealed Classes, Records & Pattern Matching' },
  { id: 'chapter_09_exceptions', number: 9, title: 'Chapter 9: Exception Handling & try-with-resources' },
  { id: 'chapter_10_date_time_localization', number: 10, title: 'Chapter 10: Date, Time & Localization' },
  { id: 'chapter_11_generics', number: 11, title: 'Chapter 11: Generics & Type Erasure' },
  { id: 'chapter_12_collections', number: 12, title: 'Chapter 12: Collections Framework & Sequenced Collections' },
  { id: 'chapter_13_streams', number: 13, title: 'Chapter 13: Functional Programming & Streams API' },
  { id: 'chapter_14_concurrency', number: 14, title: 'Chapter 14: Concurrency & Virtual Threads' },
  { id: 'chapter_15_persistence_modules', number: 15, title: 'Chapter 15: NIO.2, Serialization & Java Modules (JPMS)' },
];

interface LanguageHomeClientProps {
  lang: string;
}

export default function LanguageHomeClient({ lang }: LanguageHomeClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const chapters = lang === 'de' ? chaptersDE : chaptersEN;

  const filteredChapters = chapters.filter((ch) =>
    ch.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <Header />

      {/* Hero section */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {lang === 'de' ? 'Meistere die Java 21 OCP Zertifizierung' : 'Master Java 21 OCP Certification'}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {lang === 'de'
              ? 'Lese detaillierte Theorie-Kapitel und teste dein Wissen in interaktiven Quizzes.'
              : 'Read detailed conceptual chapters and test your knowledge in interactive practice quizzes.'}
          </p>
        </section>

        {/* Dashboard Statistics - Mobile First */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-xs text-slate-400 mb-1">{lang === 'de' ? 'Kapitel gesamt' : 'Total Chapters'}</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-400">15</div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 sm:p-4 text-center">
            <div className="text-xs text-slate-400 mb-1">{lang === 'de' ? 'Ziel-Mindestpunkt' : 'Target Threshold'}</div>
            <div className="text-xl sm:text-2xl font-black text-green-400">70%</div>
          </div>
        </section>

        {/* Mobile-Friendly Search Box */}
        <section className="max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder={lang === 'de' ? 'Kapitel suchen...' : 'Search chapters...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm outline-none transition-all placeholder:text-slate-500 text-slate-100"
          />
        </section>

        {/* Chapters Grid - Mobile-First Layout */}
        <section className="space-y-4">
          {filteredChapters.map((ch) => (
            <div
              key={ch.id}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 sm:p-5 transition-all backdrop-blur-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {lang === 'de' ? `Kapitel ${ch.number}` : `Chapter ${ch.number}`}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  {ch.title.split(':').slice(1).join(':').trim() || ch.title}
                </h3>
              </div>

              {/* Action Buttons - Stacked on Mobile, side-by-side on tablet/desktop */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800/50">
                <Link
                  href={`/${lang}/${ch.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-sm font-semibold transition-colors"
                >
                  <BookOpen className="h-4 w-4 shrink-0" />
                  {lang === 'de' ? 'Theorie lesen' : 'Read Theory'}
                </Link>

                <Link
                  href={`/${lang}/${ch.id}/quiz`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-md shadow-indigo-600/10"
                >
                  <Award className="h-4 w-4 shrink-0" />
                  {lang === 'de' ? 'Quiz starten' : 'Start Quiz'}
                </Link>
              </div>
            </div>
          ))}

          {filteredChapters.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">
              {lang === 'de' ? 'Keine Kapitel gefunden.' : 'No chapters found.'}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-24 py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Java SE 21 Developer Exam Prep Platform.</p>
      </footer>
    </div>
  );
}