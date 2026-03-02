'use client';

export interface Chapter {
    title: string;
    word_index: number;
}

export interface ParseResult {
    words: string[];
    chapters: Chapter[];
}

function tokenizeText(text: string): string[] {
    if (!text) return [];
    return text.trim().split(/\s+/).filter(Boolean);
}

async function parsePDF(file: File): Promise<ParseResult> {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const chapters: Chapter[] = [];
    let currentWordSum = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
        // Create a 'Chapter' milestone every 5 pages for easy scrubbing if no real TOC exists
        if (i === 1 || i % 5 === 0) {
            chapters.push({ title: `Page ${i}`, word_index: currentWordSum });
        }

        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: unknown) =>
            (item && typeof item === 'object' && 'str' in item) ? (item as { str: string }).str : ''
        ).join(' ');

        const wordsInPage = tokenizeText(pageText);
        currentWordSum += wordsInPage.length;
        fullText += pageText + '\n';
    }

    return { words: tokenizeText(fullText), chapters };
}

async function parseDocx(file: File): Promise<ParseResult> {
    const mammoth = (await import('mammoth')).default;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const words = tokenizeText(result.value);
    return { words, chapters: [{ title: 'Start', word_index: 0 }] };
}

async function parseEpub(file: File): Promise<ParseResult> {
    const ePub = (await import('epubjs')).default;
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await book.ready;

    let fullText = '';
    const chapters: Chapter[] = [];
    let currentWordSum = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spineItems: any[] = (book.spine as any).items || [];
    for (let i = 0; i < spineItems.length; i++) {
        const section = book.spine.get(i);
        if (section) {
            try {
                // Record the chapter start
                const chapterTitle = section.idref || `Section ${i + 1}`;
                chapters.push({ title: chapterTitle, word_index: currentWordSum });

                const item = await section.load(book.load.bind(book));

                let sectionText = '';
                if (item && item.textContent) {
                    sectionText = item.textContent;
                } else if (item && typeof item === 'string') {
                    const doc = new DOMParser().parseFromString(item as string, 'text/html');
                    sectionText = doc.body.textContent || '';
                }

                const wordsInSection = tokenizeText(sectionText);
                currentWordSum += wordsInSection.length;
                fullText += sectionText + '\n';

            } catch (e) {
                console.warn('Failed to parse a section of epub', e);
            }
        }
    }
    return { words: tokenizeText(fullText), chapters };
}

async function parsePlainText(file: File): Promise<ParseResult> {
    const text = await file.text();
    return { words: tokenizeText(text), chapters: [{ title: 'Start', word_index: 0 }] };
}

export async function extractDocumentWords(file: File): Promise<ParseResult> {
    try {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            return await parsePDF(file);
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            return await parseDocx(file);
        } else if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
            return await parseEpub(file);
        } else if (
            file.type === 'text/plain' ||
            file.type === 'text/markdown' ||
            file.name.endsWith('.txt') ||
            file.name.endsWith('.md')
        ) {
            return await parsePlainText(file);
        } else {
            throw new Error('Unsupported file format');
        }
    } catch (error) {
        console.error('Document parsing failed:', error);
        throw new Error('Failed to parse document content');
    }
}
