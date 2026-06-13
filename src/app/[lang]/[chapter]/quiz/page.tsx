import React from 'react';
import { notFound } from 'next/navigation';
import { parseChapter, getChapters } from '@/lib/markdownParser';
import QuizClient from './QuizClient';

interface PageProps {
  params: Promise<{
    lang: string;
    chapter: string;
  }>;
}

export function generateStaticParams() {
  const paths: { lang: string; chapter: string }[] = [];
  ['de', 'en'].forEach((lang) => {
    const chapters = getChapters(lang);
    chapters.forEach((ch) => {
      paths.push({ lang, chapter: ch.id });
    });
  });
  return paths;
}

export default async function QuizPage({ params }: PageProps) {
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

  return (
    <QuizClient
      chapterId={chapter}
      chapterTitle={data.title}
      lang={lang}
      questions={data.questions}
    />
  );
}
