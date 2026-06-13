import React from 'react';
import { notFound } from 'next/navigation';
import LanguageHomeClient from './LanguageHomeClient';

interface PageProps {
  params: Promise<{
    lang: string;
  }>;
}

export function generateStaticParams() {
  return [
    { lang: 'de' },
    { lang: 'en' }
  ];
}

export default async function LanguageHomePage({ params }: PageProps) {
  const { lang } = await params;

  if (lang !== 'de' && lang !== 'en') {
    notFound();
  }
  return <LanguageHomeClient lang={lang} />;
}
