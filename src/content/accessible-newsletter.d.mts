export interface WordHeading { level: number; text: string; }
export interface WordPicture { name: string; alt: string; decorative: boolean; }
export interface WordStructure { headings: WordHeading[]; usesTitleStyle: boolean; pictures: WordPicture[]; }
export interface AccessibleNewsletterCheck { problems: string[]; headings: WordHeading[]; pictures: WordPicture[]; }
export function readWordStructure(bytes: Uint8Array): Promise<WordStructure | undefined>;
export function headingProblems(headings: WordHeading[]): string[];
export function checkAccessibleNewsletter(bytes: Uint8Array): Promise<AccessibleNewsletterCheck>;
