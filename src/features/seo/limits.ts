import { CHARS_PER_PAGE, PLANS } from "@/lib/plans";

/** Plan-limit sentences for public SEO pages. Every number comes from src/lib/plans.ts. */
const { free, scholar, byok } = PLANS;

const fmt = (n: number) => n.toLocaleString("en-US");

export const PAGE_LIMIT_SENTENCE = `Each document can be up to ${free.pagesPerDocument} pages on ${free.name}, ${scholar.pagesPerDocument} pages on ${scholar.name} and ${byok.pagesPerDocument} pages with your own API key. A page is counted as ${fmt(CHARS_PER_PAGE)} characters of extracted text, so pasted text and transcripts follow the same rule.`;

export const UPLOAD_LIMIT_SENTENCE = `Uploaded files can be up to ${free.uploadMb} MB on ${free.name} and ${scholar.uploadMb} MB on ${scholar.name}.`;

export const DAILY_LIMIT_SENTENCE = `${free.name} includes ${free.dailyActions} AI actions per day and ${free.documents} documents; ${scholar.name} ($${scholar.priceMonthlyUsd}/month) includes ${scholar.dailyActions} AI actions per day and ${scholar.documents} documents.`;

export const AUDIO_LIMIT_SENTENCE = `Audio recaps are limited to ${free.dailyAudioRenders} per day on ${free.name} and ${scholar.dailyAudioRenders} per day on ${scholar.name}.`;

export const YOUTUBE_BETA_SENTENCE =
  "YouTube links are in beta: Source.io needs the video's captions, and some videos do not have captions it can fetch. If that happens, paste the transcript into the Text tab instead.";

export const FREE_PLAN_SHORT = `${free.dailyActions} AI actions a day on the ${free.name} plan, no card needed`;
