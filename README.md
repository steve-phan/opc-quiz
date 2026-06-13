# OCP Java SE 21 Study Guide & Learning Platform

Welcome to the repository for the **Java SE 21 Developer (1Z0-830) Study Guide**. This repository contains detailed conceptual chapters, JVM internals, memory layouts, and exactly **20 high-fidelity practice questions** per chapter. 

Additionally, it lays out the blueprint for a **Next.js Web Application** designed to serve as an interactive learning and quiz platform.

---

## 1. Project Directory Structure

The repository is organized as follows:

```text
java-ocp-study-guide/
├── study_guide/                    # Original English Study Guide chapters
│   ├── chapter_01_jdk_architecture.md
│   ├── chapter_02_memory_model.md
│   ├── ...
│   └── de/                         # German Translations
│       ├── chapter_01_jdk_architecture.md
│       ├── chapter_02_memory_model.md
│       └── ...
└── README.md                       # This technical documentation
```

---

## 2. Markdown File Standards & Conventions

To ensure the Next.js web application can successfully parse the study guide files dynamically at runtime, all markdown files must strictly adhere to the following layout rules:

### Document Sections
1. **`## 1. Core Java 21 Exam Objectives` / `Prüfungsziele`**: Bulleted list of syllabus objectives.
2. **`## 2. Deep-Dive Concepts` / `Detaillierte Konzepte`**: In-depth explanations of chapter concepts.
3. **`## 3. JVM Internals & Memory Layout` / `JVM-Interna & Speicherlayout`**: Diagrams and low-level JVM behaviors.
4. **`## 4. Tricky OCP Exam Questions` / `Knifflige OCP-Prüfungsfragen`**: Exactly 20 multiple-choice questions.

### Question Format
Questions must be formatted with the exact tokens below for the parser to extract them:
```markdown
### Question X
[Question scenario and code block in English]

- A. [Option A]
- B. [Option B]
- C. [Option C]
- D. [Option D]

**Answer: [Correct Option Letter(s)]**
**Explanation (German/English):**
- [Detailed explanation in German, pointing out why the right answer is correct and why other options are incorrect. Code keywords and standard terminology should remain in English.]
```

### Translation Rules (German Files)
*   **Source of Truth:** The original English files in `study_guide/` are the reference source of truth.
*   **Bilingual Questions:** The code blocks, question titles/scenarios, and option choices (A, B, C, D) **must remain in English** to match the official Oracle Certified Professional exam format.
*   **Translated Explanations:** The explanations under `**Explanation (German/English):**` and the conceptual text in sections 1, 2, and 3 must be fully translated into German.
*   **Formulas:** Preserve LaTeX math block wrappers like `$$...$$` or `\(...\)` intact.

---

## 3. Planned Next.js Web App Architecture

We plan to build a Next.js web application to display the chapters and let users test their knowledge.

### Directory Layout (App Router)
```text
src/
├── app/
│   ├── page.tsx                    # Portal landing page / Language selector
│   └── [lang]/                     # Multi-lingual routing ('de' or 'en')
│       ├── page.tsx                # Chapter directory list
│       └── [chapter]/
│           ├── page.tsx            # Interactive Reader (Theory & diagrams)
│           └── quiz/
│               └── page.tsx        # Interactive Quiz UI (20 Questions)
├── components/
│   ├── MarkdownRenderer.tsx        # Code-highlighted Markdown presenter
│   └── QuizInterface.tsx           # Stateful quiz component (score, options, explanations)
└── lib/
    └── markdownParser.ts           # Splits Markdown into static HTML and JSON quiz arrays
```

### How the Dynamic Parser Works (`markdownParser.ts`)
The Next.js Server Components read the raw markdown files from the local filesystem at build/request time using Node's `fs` module. 

```typescript
import fs from 'fs';
import path from 'path';

export interface QuizQuestion {
  id: number;
  questionText: string;
  codeBlock?: string;
  options: { [key: string]: string };
  answer: string;
  explanation: string;
}

export function parseChapter(lang: string, chapterFileName: string) {
  const filePath = path.join(process.cwd(), 'study_guide', lang === 'de' ? 'de' : '', chapterFileName);
  const rawContent = fs.readFileSync(filePath, 'utf-8');

  // Split theory part from the quiz section
  const separator = lang === 'de' ? '## 4. Knifflige OCP-Prüfungsfragen' : '## 4. Tricky OCP Exam Questions';
  const parts = rawContent.split(separator);
  
  const theoryMarkdown = parts[0];
  const quizMarkdown = parts[1] || '';

  // Extract structured questions from quizMarkdown
  const questions: QuizQuestion[] = parseQuestions(quizMarkdown);

  return {
    theoryMarkdown,
    questions,
  };
}

function parseQuestions(markdown: string): QuizQuestion[] {
  // Parsing logic splits by '### Question' and extracts text, choices, answers, and explanations.
  // Returns an array of QuizQuestion objects.
}
```

---

## 4. Developer Guidelines

*   **Do not modify original English study guides** unless correcting an objective error.
*   When adding a new chapter, ensure that it contains **exactly 20 questions**.
*   Verify that LaTeX syntax parses correctly within Markdown tools.
# opc-quiz
