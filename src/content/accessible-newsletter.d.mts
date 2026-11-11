export interface WordHeading { level: number; text: string; }
export interface WordPicture { alt: string; contentType: string; bytes: Uint8Array; /** Its size on the Word page, in CSS pixels. */ size?: { width: number; height: number }; }
export interface AccessibleNewsletterResult { problems: string[]; html: string; headings: WordHeading[]; images: WordPicture[]; }
export function headingsOf(html: string): WordHeading[];
export function headingProblems(headings: WordHeading[]): string[];
export function stripManualReview(html: string): string;
export function shiftHeadings(html: string, by?: number): string;
export function readAccessibleNewsletter(bytes: Uint8Array): Promise<AccessibleNewsletterResult>;
