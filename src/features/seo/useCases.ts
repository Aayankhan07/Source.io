import { LEITNER_INTERVAL_DAYS } from "@/features/learning/leitner";
import type { StudyMode } from "./modes";
import {
  AUDIO_LIMIT_SENTENCE,
  DAILY_LIMIT_SENTENCE,
  PAGE_LIMIT_SENTENCE,
  UPLOAD_LIMIT_SENTENCE,
  YOUTUBE_BETA_SENTENCE,
} from "./limits";

export type UseCaseAxis = "file-type" | "goal" | "audience";

export interface Faq {
  question: string;
  answer: string;
}

export interface UseCase {
  slug: string;
  axis: UseCaseAxis;
  /** Short label for cards and related links. */
  label: string;
  h1: string;
  /** <= 60 characters, used verbatim as <title>. */
  metaTitle: string;
  /** <= 155 characters. */
  metaDescription: string;
  intro: string;
  steps: string[];
  modes: { mode: StudyMode; why: string }[];
  limits: string[];
  faqs: Faq[];
  /** Exactly three related use-case slugs. */
  related: [string, string, string];
  /** ISO date the content last changed; used for the sitemap. */
  updated: string;
}

export const USE_CASE_AXES: Record<UseCaseAxis, string> = {
  "file-type": "By file type",
  goal: "By goal",
  audience: "By who is studying",
};

const LEITNER_SENTENCE = `Source.io uses a Leitner 5-box system. Grading a card Again sends it back to box 1, Good moves it up one box and Easy moves it up two. Cards in boxes 1 to 5 come back after ${LEITNER_INTERVAL_DAYS.join(", ")} days respectively.`;

const OPEN_DOC_STEP =
  "When the document shows as ready in your library, open it. Study notes are generated in the Notes tab.";
const ASK_STEP =
  "Open the Ask panel to ask questions. Each answer lists the source passages it used, with a percentage match, so you can check the wording against your material.";

export const USE_CASES: UseCase[] = [
  // ---------------------------------------------------------------- file type
  {
    slug: "pdf-textbooks",
    axis: "file-type",
    label: "PDF textbooks and chapters",
    h1: "Turn a PDF textbook chapter into notes, flashcards and a quiz",
    metaTitle: "PDF Textbook to Notes, Flashcards & Quiz | Source.io",
    metaDescription:
      "Upload a PDF chapter and get study notes, Leitner flashcards, a practice quiz with explanations, an audio recap and chat that shows its source passages.",
    intro:
      "Textbook chapters are long, dense and easy to re-read without remembering. Source.io takes one PDF chapter and builds five ways to study it, all from the text of that chapter rather than from general web knowledge.",
    steps: [
      "Sign up, open your library and open the upload dialog. Keep the File tab selected.",
      "Drop in the PDF. The text is extracted in your browser, so the file itself is not uploaded.",
      OPEN_DOC_STEP,
      "Switch to the Flashcards and Quiz tabs to create cards and practice questions from the same chapter.",
      ASK_STEP,
    ],
    modes: [
      { mode: "notes", why: "A structured outline of the chapter to read before lectures or revision." },
      { mode: "flashcards", why: "Definitions and key facts, scheduled so the cards you miss come back sooner." },
      { mode: "quiz", why: "Check understanding after reading, with an explanation for every answer." },
      { mode: "chat", why: "Ask about a paragraph you did not follow and see which passages the answer came from." },
    ],
    limits: [
      PAGE_LIMIT_SENTENCE,
      "Split a full textbook into chapters and upload them as separate documents.",
      "Text is extracted from the PDF's text layer. Scanned pages that are only images produce little or no text.",
    ],
    faqs: [
      {
        question: "Can I upload a whole textbook?",
        answer: `Upload one chapter at a time. ${PAGE_LIMIT_SENTENCE}`,
      },
      {
        question: "Does it work with scanned PDFs?",
        answer:
          "Only if the PDF has a text layer. Source.io reads the text inside the PDF; pages that are just photos of paper give it nothing to work with.",
      },
      {
        question: "Do the notes use outside information?",
        answer:
          "Notes, flashcards and quizzes are generated from the text of your document. Chat answers list the passages they used, so you can see what they are based on.",
      },
    ],
    related: ["exam-revision", "university-students", "word-documents"],
    updated: "2026-11-26",
  },
  {
    slug: "lecture-recordings",
    axis: "file-type",
    label: "Lecture recordings",
    h1: "Study from lecture recordings instead of rewatching them",
    metaTitle: "Lecture Recordings to Study Notes & Flashcards | Source.io",
    metaDescription:
      "Upload a lecture recording (MP3, WAV, MP4 or MOV). Source.io transcribes it, then builds notes, flashcards, a quiz, an audio recap and source-checked chat.",
    intro:
      "A recorded lecture is hard to revise from: you can't skim audio. Source.io transcribes the recording and treats the transcript as your source, so every study mode works on what was actually said.",
    steps: [
      "Open the upload dialog and keep the File tab selected.",
      "Drop in the recording (mp3, wav, mp4 or mov). It is uploaded and transcribed with speech-to-text.",
      OPEN_DOC_STEP,
      "Use the Flashcards and Quiz tabs to turn the lecture into review material.",
      ASK_STEP,
    ],
    modes: [
      { mode: "notes", why: "A written version of the lecture you can skim, instead of scrubbing through the video." },
      { mode: "flashcards", why: "Terms the lecturer defined, scheduled for spaced review." },
      { mode: "quiz", why: "Find the parts of the lecture you did not take in." },
      { mode: "chat", why: "Ask what the lecturer said about a topic and check the transcript passages behind the answer." },
    ],
    limits: [
      UPLOAD_LIMIT_SENTENCE,
      PAGE_LIMIT_SENTENCE,
      "Transcription quality depends on the recording. Heavy background noise or several people talking at once lowers accuracy.",
    ],
    faqs: [
      {
        question: "Which audio and video formats are supported?",
        answer: `MP3, WAV, MP4 and MOV files. ${UPLOAD_LIMIT_SENTENCE}`,
      },
      {
        question: "How long can a recording be?",
        answer: `Length is limited by the transcript, not by minutes. ${PAGE_LIMIT_SENTENCE}`,
      },
      {
        question: "What if the transcription has mistakes?",
        answer:
          "Speech-to-text is not perfect, especially for names and technical terms. Use the chat's source passages to check wording, and paste a corrected transcript into the Text tab if you have one.",
      },
    ],
    related: ["youtube-lectures", "university-students", "exam-revision"],
    updated: "2026-11-26",
  },
  {
    slug: "youtube-lectures",
    axis: "file-type",
    label: "YouTube lectures",
    h1: "Make flashcards and notes from a YouTube lecture",
    metaTitle: "YouTube Lecture to Notes & Flashcards (Beta) | Source.io",
    metaDescription:
      "Paste a YouTube link and Source.io uses the video's captions to build notes, flashcards and a quiz. Beta: if there are no captions, paste the transcript.",
    intro:
      "Many courses and open lectures live on YouTube. Paste the link and Source.io works from the video's captions. This is in beta, and it only works when captions can be fetched.",
    steps: [
      "Open the upload dialog and choose the YouTube tab.",
      "Paste the video link. Source.io fetches the captions as the document text.",
      "If the captions can't be fetched, copy the transcript from YouTube and paste it into the Text tab instead.",
      OPEN_DOC_STEP,
      ASK_STEP,
    ],
    modes: [
      { mode: "notes", why: "A readable summary of the video you can return to without rewatching." },
      { mode: "flashcards", why: "Key ideas from the video, ready for spaced review." },
      { mode: "quiz", why: "Check that you followed the explanation, not just watched it." },
      { mode: "audio", why: "A short two-host recap to listen to when you can't watch a screen." },
    ],
    limits: [YOUTUBE_BETA_SENTENCE, PAGE_LIMIT_SENTENCE, AUDIO_LIMIT_SENTENCE],
    faqs: [
      {
        question: "Why did my YouTube link fail?",
        answer: YOUTUBE_BETA_SENTENCE,
      },
      {
        question: "Does Source.io watch the video itself?",
        answer:
          "No. It uses the captions as text. Anything shown only on screen, such as a diagram without narration, is not included.",
      },
      {
        question: "Can I use auto-generated captions?",
        answer:
          "If YouTube provides them and they can be fetched, yes. Auto-generated captions can contain errors, so check important terms against the source passages in chat.",
      },
    ],
    related: ["lecture-recordings", "university-students", "certification-study"],
    updated: "2026-11-26",
  },
  {
    slug: "word-documents",
    axis: "file-type",
    label: "Word documents and handouts",
    h1: "Turn Word handouts and lecture notes into study material",
    metaTitle: "Word (DOCX) Handouts to Flashcards & Quiz | Source.io",
    metaDescription:
      "Upload a .docx handout or your own typed notes and get structured notes, Leitner flashcards, a practice quiz and chat that lists its source passages.",
    intro:
      "Course handouts, study guides and your own typed notes are often Word files. Source.io reads the .docx text and turns it into material you can actively practise with.",
    steps: [
      "Open the upload dialog and keep the File tab selected.",
      "Drop in the .docx file. Its text is extracted in your browser.",
      OPEN_DOC_STEP,
      "Generate flashcards and a quiz from the Flashcards and Quiz tabs.",
      ASK_STEP,
    ],
    modes: [
      { mode: "notes", why: "Reorganises a loose handout into a clear structure." },
      { mode: "flashcards", why: "Turns your own notes into cards without typing each one." },
      { mode: "quiz", why: "Tests the handout's content with explained answers." },
      { mode: "chat", why: "Answers questions using only the handout, with the passages shown." },
    ],
    limits: [
      PAGE_LIMIT_SENTENCE,
      "Images, charts and embedded objects in the Word file are not read; only the text is used.",
    ],
    faqs: [
      {
        question: "Can I just paste my notes instead?",
        answer: "Yes. Use the Text tab in the upload dialog, give it a title and paste your notes.",
      },
      {
        question: "Are images in the document used?",
        answer: "No. Only the text is extracted. Describe important diagrams in text if you want them covered.",
      },
      {
        question: "Is the Word file stored?",
        answer:
          "The text is extracted in your browser and the extracted text is saved as your document. The file itself is not uploaded.",
      },
    ],
    related: ["pdf-textbooks", "teachers", "reading-assignments"],
    updated: "2026-11-26",
  },

  // --------------------------------------------------------------------- goal
  {
    slug: "exam-revision",
    axis: "goal",
    label: "Exam revision",
    h1: "Revise for exams with active recall from your own course material",
    metaTitle: "Exam Revision with Flashcards & Practice Quizzes | Source.io",
    metaDescription:
      "Revise from your own lecture notes and readings: Leitner flashcards for spaced review, practice quizzes with explanations, and notes to re-read.",
    intro:
      "Re-reading feels productive but tests little. Source.io turns each source in your course into flashcards and practice questions, so revision means recalling answers rather than recognising text.",
    steps: [
      "Upload each lecture, chapter or handout as its own document (File, YouTube or Text tab).",
      OPEN_DOC_STEP,
      "Generate flashcards and review the due cards daily. Grade each card Again, Good or Easy and the Leitner boxes decide when it comes back.",
      "Take the practice quiz and read the explanation for every question you got wrong.",
      "Use the Ask panel for topics that still don't make sense, and check the passages it cites.",
    ],
    modes: [
      { mode: "flashcards", why: "Spaced review focuses your time on the cards you keep missing." },
      { mode: "quiz", why: "A practice test before the real one, with an explanation for each answer." },
      { mode: "notes", why: "A compact summary to read the night before." },
      { mode: "audio", why: "A recap to listen to on the way to the exam." },
    ],
    limits: [DAILY_LIMIT_SENTENCE, PAGE_LIMIT_SENTENCE, AUDIO_LIMIT_SENTENCE],
    faqs: [
      {
        question: "How does the flashcard scheduling work?",
        answer:
          LEITNER_SENTENCE,
      },
      {
        question: "Can I make study material for a whole course?",
        answer: `Upload each source as a separate document. ${DAILY_LIMIT_SENTENCE}`,
      },
      {
        question: "Are the quiz questions like my real exam?",
        answer:
          "They are generated from your material, not from past papers, so they test the content rather than your exam's exact format. Use them alongside official past papers if you have them.",
      },
    ],
    related: ["university-students", "pdf-textbooks", "lecture-recordings"],
    updated: "2026-11-26",
  },
  {
    slug: "certification-study",
    axis: "goal",
    label: "Certification study",
    h1: "Study for a professional certification from your official guide",
    metaTitle: "Certification Exam Prep from Your Study Guide | Source.io",
    metaDescription:
      "Turn sections of your certification study guide into flashcards with spaced review and practice quizzes, with chat answers that show the source passages.",
    intro:
      "Certification exams reward precise definitions and procedures. Source.io works from the study material you upload, such as a section of an official guide or your course notes, so the flashcards and questions stick to that wording.",
    steps: [
      "Upload one domain or section of your study guide as a PDF, Word file or pasted text.",
      OPEN_DOC_STEP,
      "Generate flashcards for terms, acronyms and steps, and review the due cards each day.",
      "Take the practice quiz on each section and read the explanations.",
      ASK_STEP,
    ],
    modes: [
      { mode: "flashcards", why: "Acronyms, definitions and procedures are what spaced review is best at." },
      { mode: "quiz", why: "Checks you can apply a section, with the reasoning explained." },
      { mode: "chat", why: "Answers that show the exact passages help you avoid learning a paraphrase that is subtly wrong." },
      { mode: "audio", why: "Revise a section during a commute." },
    ],
    limits: [
      PAGE_LIMIT_SENTENCE,
      "Practice questions come from your material. They are not official exam questions and are not a substitute for the provider's own practice tests.",
      "Only upload material you are allowed to use; some providers restrict how their guides are shared.",
    ],
    faqs: [
      {
        question: "Does Source.io have question banks for specific certifications?",
        answer:
          "No. Everything is generated from the material you upload, so it works for any certification where you have study notes or a guide.",
      },
      {
        question: "Can I study on the commute?",
        answer: `Yes. The audio recap is a two-host conversation played by your browser. ${AUDIO_LIMIT_SENTENCE}`,
      },
      {
        question: "How many sections can I keep at once?",
        answer: DAILY_LIMIT_SENTENCE,
      },
    ],
    related: ["professionals", "exam-revision", "pdf-textbooks"],
    updated: "2026-11-26",
  },
  {
    slug: "research-papers",
    axis: "goal",
    label: "Reading research papers",
    h1: "Read research papers faster and check every answer against the text",
    metaTitle: "Read Research Papers with Source-Checked Chat | Source.io",
    metaDescription:
      "Upload a paper and ask questions about methods and results. Each chat answer lists the passages it used with a similarity score, so you can verify it.",
    intro:
      "When you are reading a paper, you need answers you can check. Source.io's chat retrieves the passages most similar to your question and shows them with each answer, so you can read the original sentences before you rely on a summary.",
    steps: [
      "Upload the paper as a PDF from the File tab.",
      OPEN_DOC_STEP,
      "Open the Ask panel and ask about the method, sample, results or limitations.",
      "Open the listed source passages and read them before quoting or citing anything.",
      "Generate flashcards for terms and findings you want to remember across papers.",
    ],
    modes: [
      { mode: "chat", why: "Answers come with the passages used and a similarity score, so verification takes seconds." },
      { mode: "notes", why: "A structured overview of the paper before a close read." },
      { mode: "flashcards", why: "Keep definitions and key results from a reading list in memory." },
      { mode: "audio", why: "A spoken overview of a paper you are deciding whether to read in full." },
    ],
    limits: [
      PAGE_LIMIT_SENTENCE,
      "Each document is studied on its own; chat does not compare several papers at once.",
      "Tables and figures are only used as far as their text is extractable from the PDF.",
    ],
    faqs: [
      {
        question: "What does the similarity score mean?",
        answer:
          "It shows how closely each retrieved passage matches your question. A low score is a signal to read the passage carefully before trusting the answer.",
      },
      {
        question: "Can I ask questions across several papers?",
        answer: "Not yet. Each paper is a separate document with its own chat.",
      },
      {
        question: "Are my unpublished papers used to train AI models?",
        answer:
          "Source.io does not train its own models on your documents. Text is sent to the AI providers named in the Privacy Policy to generate your material; read it before uploading confidential work.",
      },
    ],
    related: ["researchers", "pdf-textbooks", "reading-assignments"],
    updated: "2026-11-26",
  },
  {
    slug: "reading-assignments",
    axis: "goal",
    label: "Weekly reading assignments",
    h1: "Keep up with weekly readings without losing what you read",
    metaTitle: "Study Weekly Course Readings with Flashcards | Source.io",
    metaDescription:
      "Paste or upload each week's reading and get notes for seminar prep, flashcards for spaced review and a quiz to check you understood it.",
    intro:
      "Seminar courses assign articles and chapters every week, and by the exam most of it has faded. Add each reading as a document and Source.io gives you notes for discussion and flashcards that keep it in memory.",
    steps: [
      "Upload the reading as a PDF or Word file, or paste an article into the Text tab with a title.",
      OPEN_DOC_STEP,
      "Read the notes before the seminar and ask the Ask panel about anything unclear.",
      "Generate flashcards and keep reviewing them through the term.",
      "Listen to the audio recap from the Podcast tab when you need a refresher.",
    ],
    modes: [
      { mode: "notes", why: "A structured summary to bring to discussion." },
      { mode: "chat", why: "Find what the author argues about a point, with the passages to quote." },
      { mode: "flashcards", why: "Spaced review across the term so early readings are not forgotten." },
      { mode: "audio", why: "A quick spoken recap before class." },
    ],
    limits: [DAILY_LIMIT_SENTENCE, PAGE_LIMIT_SENTENCE],
    faqs: [
      {
        question: "Can I add web articles?",
        answer: "Copy the article text and paste it into the Text tab. Source.io does not fetch web pages from a URL.",
      },
      {
        question: "Can I keep a whole term of readings?",
        answer: DAILY_LIMIT_SENTENCE,
      },
      {
        question: "Will the notes replace doing the reading?",
        answer:
          "They should not. Use them to prepare and to review; read the source passages in chat when you need the author's own words.",
      },
    ],
    related: ["university-students", "research-papers", "word-documents"],
    updated: "2026-11-26",
  },

  // ----------------------------------------------------------------- audience
  {
    slug: "university-students",
    axis: "audience",
    label: "University students",
    h1: "A study workspace for university students, built from your own courses",
    metaTitle: "AI Study Tool for University Students | Source.io",
    metaDescription:
      "Turn lecture slides, recordings, readings and textbook chapters into notes, Leitner flashcards, practice quizzes and audio recaps. Free plan available.",
    intro:
      "University courses mix slides, recordings, readings and textbook chapters. Source.io handles each of these as a document and gives you the same five study modes for all of them.",
    steps: [
      "Create a free account and open your library.",
      "Add a source from the upload dialog: a PDF or Word file, a lecture recording, a YouTube link or pasted text.",
      OPEN_DOC_STEP,
      "Generate flashcards and a quiz, and review the flashcards a little each day.",
      "Use the Ask panel to clear up confusing points, and the Podcast tab for an audio recap.",
    ],
    modes: [
      { mode: "notes", why: "One clean summary per lecture or chapter." },
      { mode: "flashcards", why: "Spaced review that fits into short daily sessions." },
      { mode: "quiz", why: "Practice questions with explanations before the exam." },
      { mode: "audio", why: "Revise while walking or commuting." },
      { mode: "chat", why: "Ask about the material and see where in it each answer comes from." },
    ],
    limits: [DAILY_LIMIT_SENTENCE, PAGE_LIMIT_SENTENCE, YOUTUBE_BETA_SENTENCE],
    faqs: [
      {
        question: "Is there a free plan?",
        answer: `Yes. ${DAILY_LIMIT_SENTENCE}`,
      },
      {
        question: "Which file types can I use?",
        answer:
          "PDF, Word (.docx), audio and video files (mp3, wav, mp4, mov), YouTube links (beta) and pasted text.",
      },
      {
        question: "Can I try it before signing up?",
        answer: "Yes. The public demo shows the notes, flashcards, quiz, audio script and chat for sample documents.",
      },
    ],
    related: ["exam-revision", "lecture-recordings", "reading-assignments"],
    updated: "2026-11-26",
  },
  {
    slug: "professionals",
    axis: "audience",
    label: "Professionals studying for certifications",
    h1: "Study efficiently around a full-time job",
    metaTitle: "Certification Study for Working Professionals | Source.io",
    metaDescription:
      "Short daily flashcard reviews, practice quizzes and audio recaps generated from your own study material, for professionals preparing for certifications.",
    intro:
      "When you study around work, sessions are short and spread out. Source.io keeps each study session small: a few due flashcards, a quiz on one section, or an audio recap for the commute.",
    steps: [
      "Upload one section of your study material at a time.",
      OPEN_DOC_STEP,
      "Review the due flashcards in a few minutes each day; the Leitner boxes decide what comes back.",
      "Take the section quiz at the end of the week.",
      "Generate an audio recap from the Podcast tab for travel time.",
    ],
    modes: [
      { mode: "flashcards", why: "Short daily reviews fit around work." },
      { mode: "audio", why: "Turns commute time into revision time." },
      { mode: "quiz", why: "A weekly check on each section, with explanations." },
      { mode: "chat", why: "Quick answers to specific questions, with the passages shown." },
    ],
    limits: [
      DAILY_LIMIT_SENTENCE,
      AUDIO_LIMIT_SENTENCE,
      "Questions are generated from your material and are not official exam questions.",
    ],
    faqs: [
      {
        question: "Can I use my own AI provider key?",
        answer: `Yes. You can add your own Groq, Gemini or OpenAI key. Generations that use your key have no Source.io daily cap. ${PAGE_LIMIT_SENTENCE}`,
      },
      {
        question: "Where is the audio generated?",
        answer:
          "The recap script is written by AI and then read aloud by your browser's built-in voices, so voice quality depends on your device.",
      },
      {
        question: "Does it work for any certification?",
        answer:
          "It works with any material you can upload as text, a document or a recording. There are no built-in question banks for specific exams.",
      },
    ],
    related: ["certification-study", "exam-revision", "word-documents"],
    updated: "2026-11-26",
  },
  {
    slug: "researchers",
    axis: "audience",
    label: "Researchers and graduate students",
    h1: "A source-checked reading assistant for researchers",
    metaTitle: "AI Paper Reading Assistant for Researchers | Source.io",
    metaDescription:
      "Ask questions about a paper and see the passages behind every answer, with a similarity score. Plus notes and flashcards to retain your reading list.",
    intro:
      "Researchers need to know where a claim comes from. Source.io answers questions about one paper at a time and lists the passages each answer used, so you can check before you quote or cite.",
    steps: [
      "Upload a paper or chapter as a PDF.",
      OPEN_DOC_STEP,
      ASK_STEP,
      "Generate flashcards for methods, definitions and findings you want to retain.",
      "Export your documents and generated material as JSON from Settings, Data & Storage, if you want a copy.",
    ],
    modes: [
      { mode: "chat", why: "Every answer is shown with its source passages and similarity scores." },
      { mode: "notes", why: "A structured overview before a close read." },
      { mode: "flashcards", why: "Retain terminology and results from a long reading list." },
    ],
    limits: [
      PAGE_LIMIT_SENTENCE,
      "Chat works within one document. Cross-paper synthesis is not supported.",
      "Text is processed by the AI providers named in the Privacy Policy. Check it before uploading confidential material, or add your own API key.",
    ],
    faqs: [
      {
        question: "Does Source.io cite page numbers?",
        answer:
          "Chat answers list the source passages they used, with a similarity score. Open the passage to read the original text in context.",
      },
      {
        question: "Can I use long papers or theses?",
        answer: PAGE_LIMIT_SENTENCE,
      },
      {
        question: "Can I export my work?",
        answer: "Yes. Settings, Data & Storage, Export downloads your documents and generated material as JSON.",
      },
    ],
    related: ["research-papers", "reading-assignments", "pdf-textbooks"],
    updated: "2026-11-26",
  },
  {
    slug: "teachers",
    axis: "audience",
    label: "Teachers preparing quizzes",
    h1: "Draft practice questions from your own teaching material",
    metaTitle: "Draft Quiz Questions from Your Lesson Material | Source.io",
    metaDescription:
      "Upload a handout or lesson notes and get draft practice questions with explanations and flashcards to review, edit and adapt for your class.",
    intro:
      "Writing practice questions takes time. Source.io drafts questions with explanations and flashcards from the material you already teach, which you can review and adapt. Treat them as a first draft: check every question before using it with students.",
    steps: [
      "Upload your handout, lesson notes or reading as a PDF or Word file, or paste the text.",
      OPEN_DOC_STEP,
      "Open the Quiz tab to generate practice questions with explanations.",
      "Read each question and its explanation, and check them against your material with the Ask panel.",
      "Copy the questions you want into your own quiz tool or worksheet.",
    ],
    modes: [
      { mode: "quiz", why: "Draft questions with explanations to adapt for class." },
      { mode: "flashcards", why: "A list of key terms and definitions from the lesson." },
      { mode: "notes", why: "A structured summary to compare with your lesson plan." },
      { mode: "chat", why: "Check an answer against the source passages before you use it." },
    ],
    limits: [
      "Source.io is a personal study workspace. It has no class rosters, assignments or sharing to students.",
      "Generated questions can contain mistakes. Review every question before use.",
      DAILY_LIMIT_SENTENCE,
    ],
    faqs: [
      {
        question: "Can students take the quiz inside Source.io?",
        answer:
          "Not as a class. Each account studies its own documents. Students can upload the same material to their own accounts.",
      },
      {
        question: "Can I export the questions?",
        answer:
          "Settings, Data & Storage, Export downloads all your documents and generated material, including quizzes, as JSON. You can also copy questions directly.",
      },
      {
        question: "Are the questions always correct?",
        answer:
          "No. They are generated by AI from your material and can be wrong or ambiguous. Review each one, and use the chat's source passages to check answers.",
      },
    ],
    related: ["word-documents", "pdf-textbooks", "exam-revision"],
    updated: "2026-11-26",
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
