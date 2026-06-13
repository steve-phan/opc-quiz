'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Award, HelpCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Header from '@/components/Header';


interface Question {
  id: number;
  questionText: string;
  options: { [key: string]: string };
  answer: string;
  explanation: string;
}

interface QuizClientProps {
  chapterId: string;
  chapterTitle: string;
  lang: string;
  questions: Question[];
}

export default function QuizClient({ chapterId, chapterTitle, lang, questions }: QuizClientProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scores, setScores] = useState<{ [key: number]: boolean }>({});
  const [showResults, setShowResults] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">No Questions Found</h2>
        <p className="text-slate-400 mb-6">Could not extract questions from this chapter.</p>
        <Link href={`/${lang}/${chapterId}`} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold">
          Return to Theory
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const isMultiSelect = currentQuestion.answer.includes(',');

  const handleOptionToggle = (optionKey: string) => {
    if (isSubmitted) return;

    if (isMultiSelect) {
      if (selectedOptions.includes(optionKey)) {
        setSelectedOptions(selectedOptions.filter((o) => o !== optionKey));
      } else {
        setSelectedOptions([...selectedOptions, optionKey]);
      }
    } else {
      setSelectedOptions([optionKey]);
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0 || isSubmitted) return;

    // Verify correct answers
    const correctAnswers = currentQuestion.answer.split(',').map((a) => a.trim());
    const isCorrect =
      selectedOptions.length === correctAnswers.length &&
      selectedOptions.every((opt) => correctAnswers.includes(opt));

    setScores({ ...scores, [currentIdx]: isCorrect });
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOptions([]);
      setIsSubmitted(false);
    } else {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelectedOptions([]);
    setIsSubmitted(false);
    setScores({});
    setShowResults(false);
  };

  const correctAnswersCount = Object.values(scores).filter(Boolean).length;
  const progressPercent = Math.round(((currentIdx + (isSubmitted ? 1 : 0)) / questions.length) * 100);

  if (showResults) {
    const passed = correctAnswersCount >= questions.length * 0.7; // 70% passing grade

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 flex flex-col justify-center items-center text-center space-y-8">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-full">
            <Award className={`h-16 w-16 ${passed ? 'text-green-400' : 'text-red-400'}`} />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {lang === 'de' ? 'Quiz abgeschlossen!' : 'Quiz Completed!'}
            </h1>
            <p className="text-slate-400">
              {chapterTitle}
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center text-sm text-slate-400">
              <span>{lang === 'de' ? 'Gesamtpunktzahl' : 'Total Score'}</span>
              <span className="font-bold text-white">
                {correctAnswersCount} / {questions.length} ({Math.round((correctAnswersCount / questions.length) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${passed ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${(correctAnswersCount / questions.length) * 100}%` }}
              />
            </div>
            <p className="text-sm pt-2">
              {passed
                ? (lang === 'de' ? 'Herzlichen Glückwunsch! Du hast bestanden.' : 'Congratulations! You passed.')
                : (lang === 'de' ? 'Versuche es noch einmal, um die 70% Hürde zu knacken.' : 'Try again to pass the 70% threshold.')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md pt-4">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 rounded-xl text-sm font-semibold transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              {lang === 'de' ? 'Wiederholen' : 'Retake Quiz'}
            </button>
            <Link
              href={`/${lang}/${chapterId}`}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/10"
            >
              {lang === 'de' ? 'Zurück zur Theorie' : 'Back to Theory'}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const correctKeys = currentQuestion.answer.split(',').map((a) => a.trim());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <Header
        showBackButton
        backHref={`/${lang}/${chapterId}`}
        backLabel={lang === 'de' ? 'Abbrechen' : 'Cancel'}
        actionButton={
          <span className="text-sm font-semibold text-slate-400">
            {lang === 'de' ? `Frage ${currentIdx + 1} von ${questions.length}` : `Question ${currentIdx + 1} of ${questions.length}`}
          </span>
        }
      />

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 h-1">
        <div
          className="bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Panel */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-12 space-y-6 sm:space-y-8">
        {/* Question Text */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs sm:text-sm">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>{isMultiSelect ? (lang === 'de' ? 'Mehrfachauswahl' : 'Multiple Choice') : (lang === 'de' ? 'Einfachauswahl' : 'Single Choice')}</span>
          </div>

          <div className="prose prose-invert prose-indigo max-w-none text-slate-200 text-sm sm:text-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ node, ...props }) => <h3 className="text-base sm:text-lg font-bold text-white mb-3 border-l-2 border-indigo-500 pl-3" {...props} />,
                p: ({ node, ...props }) => <p className="mb-3 text-slate-200 leading-relaxed" {...props} />,
                code: ({ node, className, children, ...props }) => {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="bg-slate-955 border border-slate-800 text-indigo-300 px-1 py-0.5 rounded text-xs font-mono break-all" {...props}>{children}</code>;
                  }
                  return (
                    <pre className="bg-slate-950 border border-slate-850 rounded-lg sm:rounded-xl p-3 sm:p-4 overflow-x-auto text-[11px] sm:text-xs font-mono text-slate-300 my-3 leading-normal">
                      <code className="block bg-transparent p-0 border-0 text-slate-300" {...props}>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {currentQuestion.questionText}
            </ReactMarkdown>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {Object.entries(currentQuestion.options).map(([key, value]) => {
            const isSelected = selectedOptions.includes(key);
            const isCorrect = correctKeys.includes(key);

            let optionStyle = 'border-slate-800 bg-slate-900/30 hover:border-slate-700/80';
            if (isSelected) {
              optionStyle = 'border-indigo-500 bg-indigo-500/5 text-indigo-200';
            }
            if (isSubmitted) {
              if (isCorrect) {
                optionStyle = 'border-green-500/80 bg-green-500/5 text-green-200';
              } else if (isSelected) {
                optionStyle = 'border-red-500/80 bg-red-500/5 text-red-200';
              } else {
                optionStyle = 'border-slate-800 bg-slate-900/10 opacity-60';
              }
            }

            return (
              <button
                key={key}
                disabled={isSubmitted}
                onClick={() => handleOptionToggle(key)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all ${optionStyle}`}
              >
                <span
                  className={`flex items-center justify-center h-5 w-5 rounded-md border text-[10px] font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {key}
                </span>
                <span className="flex-1 pt-0.5 text-slate-300">{value}</span>

                {isSubmitted && isCorrect && <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0 self-center" />}
                {isSubmitted && isSelected && !isCorrect && <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 self-center" />}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex pt-2">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 disabled:bg-slate-850 hover:bg-indigo-500 disabled:text-slate-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg disabled:shadow-none shadow-indigo-600/10"
            >
              {lang === 'de' ? 'Antwort überprüfen' : 'Submit Answer'}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-white/5"
            >
              {currentIdx === questions.length - 1
                ? (lang === 'de' ? 'Ergebnisse anzeigen' : 'Show Results')
                : (lang === 'de' ? 'Nächste Frage' : 'Next Question')}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          )}
        </div>

        {/* Explanation Block */}
        {isSubmitted && (
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 animate-fade-in">
            <h4 className="font-bold text-slate-200 text-sm sm:text-base">
              {lang === 'de' ? 'Erklärung' : 'Explanation'}
            </h4>
            <div className="prose prose-invert prose-indigo max-w-none text-slate-350 leading-relaxed text-xs sm:text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1.5 pl-1" {...props} />,
                  li: ({ node, ...props }) => <li className="text-slate-350" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 text-slate-350" {...props} />,
                }}
              >
                {currentQuestion.explanation}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
