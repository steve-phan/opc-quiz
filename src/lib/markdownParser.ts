import fs from 'fs';
import path from 'path';

export interface QuizQuestion {
  id: number;
  questionText: string;
  options: { [key: string]: string };
  answer: string; // e.g., 'C' or 'B, D'
  explanation: string;
}

export interface ChapterInfo {
  id: string; // e.g. 'chapter_01_jdk_architecture'
  number: number;
  title: string;
  fileName: string;
}

const chaptersList: Omit<ChapterInfo, 'title'>[] = [
  { id: 'chapter_01_jdk_architecture', number: 1, fileName: 'chapter_01_jdk_architecture.md' },
  { id: 'chapter_02_memory_model', number: 2, fileName: 'chapter_02_memory_model.md' },
  { id: 'chapter_03_strings', number: 3, fileName: 'chapter_03_strings.md' },
  { id: 'chapter_04_operators', number: 4, fileName: 'chapter_04_operators.md' },
  { id: 'chapter_05_flow_control', number: 5, fileName: 'chapter_05_flow_control.md' },
  { id: 'chapter_06_initialization', number: 6, fileName: 'chapter_06_initialization.md' },
  { id: 'chapter_07_oop_inheritance', number: 7, fileName: 'chapter_07_oop_inheritance.md' },
  { id: 'chapter_08_modern_oop', number: 8, fileName: 'chapter_08_modern_oop.md' },
  { id: 'chapter_09_exceptions', number: 9, fileName: 'chapter_09_exceptions.md' },
  { id: 'chapter_10_date_time_localization', number: 10, fileName: 'chapter_10_date_time_localization.md' },
  { id: 'chapter_11_generics', number: 11, fileName: 'chapter_11_generics.md' },
  { id: 'chapter_12_collections', number: 12, fileName: 'chapter_12_collections.md' },
  { id: 'chapter_13_streams', number: 13, fileName: 'chapter_13_streams.md' },
  { id: 'chapter_14_concurrency', number: 14, fileName: 'chapter_14_concurrency.md' },
  { id: 'chapter_15_persistence_modules', number: 15, fileName: 'chapter_15_persistence_modules.md' },
];

export function getChapters(lang: string): ChapterInfo[] {
  return chaptersList.map((ch) => {
    const filePath = path.join(process.cwd(), 'study_guide', lang === 'de' ? 'de' : '', ch.fileName);
    let title = ch.id.replace(/_/g, ' ').replace('chapter ', 'Chapter ');
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const firstLine = content.split('\n')[0];
      if (firstLine.startsWith('# ')) {
        title = firstLine.replace('# ', '').trim();
      }
    } catch (e) {
      console.error(`Failed to read title for ${ch.fileName}`, e);
    }
    return { ...ch, title };
  });
}

export function parseChapter(lang: string, chapterId: string) {
  const chapter = chaptersList.find((c) => c.id === chapterId);
  if (!chapter) {
    throw new Error(`Chapter not found: ${chapterId}`);
  }

  const filePath = path.join(process.cwd(), 'study_guide', lang === 'de' ? 'de' : '', chapter.fileName);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split at the start of Section 4 (Tricky OCP Exam Questions)
  const headerMatch = content.match(/## 4\.\s+(Tricky OCP Exam Questions|Knifflige OCP-Prüfungsfragen)/i);
  const title = getChapters(lang).find((c) => c.id === chapterId)?.title || chapterId;
  if (!headerMatch || headerMatch.index === undefined) {
    return { title, theoryMarkdown: content, questions: [] };
  }

  const theoryMarkdown = content.substring(0, headerMatch.index);
  const quizSection = content.substring(headerMatch.index + headerMatch[0].length);

  const rawQuestions = quizSection.split(/### (?:Question|Frage)\s+(\d+)/i);
  const questions: QuizQuestion[] = [];

  // rawQuestions[0] is everything between "## 4..." and "### Question 1"
  for (let i = 1; i < rawQuestions.length; i += 2) {
    const id = parseInt(rawQuestions[i], 10);
    const bodyRaw = rawQuestions[i + 1] || '';
    let body = bodyRaw.trim();
    let questionTitle = '';

    if (body.startsWith(':')) {
      const firstLineEnd = body.indexOf('\n');
      if (firstLineEnd !== -1) {
        questionTitle = body.substring(1, firstLineEnd).trim();
        body = body.substring(firstLineEnd).trim();
      } else {
        questionTitle = body.substring(1).trim();
        body = '';
      }
    }

    // Extract Answer: **Answer: C** or **Detailed Answer: ...** or **Antwort: C**
    const answerMatch = body.match(/\*\*(?:Detailed\s+)?(?:Answer|Antwort):\s*(.+?)\*\*/i);
    const answer = answerMatch ? answerMatch[1].trim() : '';

    // Extract Explanation: Everything after **Explanation...** or **Detailed Explanation...** or **Erklärung...** or **Ausführliche Erklärung...**
    const explanationRegex = /\*\*(?:Detailed\s+|Ausführliche\s+)?(?:Explanation|Erklärung).*?\*\*/i;
    const explanationMatch = body.match(explanationRegex);
    let explanation = '';
    let bodyBeforeExplanation = body;

    if (explanationMatch && explanationMatch.index !== undefined) {
      explanation = body.substring(explanationMatch.index + explanationMatch[0].length).trim();
      bodyBeforeExplanation = body.substring(0, explanationMatch.index);
    }

    // Extract Options (A, B, C, D, etc.)
    const options: { [key: string]: string } = {};
    const lines = bodyBeforeExplanation.split('\n');
    const questionTextLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('**answer:') || trimmed.toLowerCase().startsWith('**antwort:')) {
        continue;
      }
      const optionMatch = trimmed.match(/^-\s+([A-G])\.\s+(.*)$/);
      if (optionMatch) {
        options[optionMatch[1]] = optionMatch[2].trim();
      } else {
        questionTextLines.push(line);
      }
    }

    let questionText = questionTextLines.join('\n').trim();
    if (questionTitle) {
      questionText = `### ${questionTitle}\n\n${questionText}`;
    }

    questions.push({
      id,
      questionText,
      options,
      answer,
      explanation,
    });
  }

  return {
    title: getChapters(lang).find((c) => c.id === chapterId)?.title || chapterId,
    theoryMarkdown,
    questions,
  };
}
