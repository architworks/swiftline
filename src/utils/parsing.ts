'use client';

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import ePub from 'epubjs';

// Setup PDF worker. We use a CDN or public URL to avoid Next.js bundling issues with the worker thread.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Normalizes extracted text into an array of words
 * Keeps punctuation attached to words.
 */
function tokenizeText(text: string): string[] {
    if (!text) return [];
    // Split by any whitespace character(s), filter out empty strings
    return text.trim().split(/\s+/).filter(Boolean);
}

async function parsePDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}

async function parseDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    // Mammoth extracts raw text, stripping formatting
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function parseEpub(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await book.ready;

    let fullText = '';

    // epubjs splits books into spine items
    // spine length is accessible via spine.items.length in epubjs but typed loosely
    const spineItems: any[] = (book.spine as any).items || [];
    for (let i = 0; i < spineItems.length; i++) {
        const section = book.spine.get(i);
        if (section) {
            try {
                const item = await section.load(book.load.bind(book));
                // Simple extraction: rip out all the HTML tags to get raw text
                if (item && item.textContent) {
                    fullText += item.textContent + '\n';
                } else if (item && typeof item === 'string') {
                    // Fallback if load returns string HTML
                    const doc = new DOMParser().parseFromString(item as string, 'text/html');
                    fullText += doc.body.textContent || '' + '\n';
                }
            } catch (e) {
                console.warn('Failed to parse a section of epub', e);
            }
        }
    }
    return fullText;
}

async function parsePlainText(file: File): Promise<string> {
    return await file.text();
}

/**
 * Main entry point for parsing any supported document type
 * Returns an array of normalized words.
 */
export async function extractDocumentWords(file: File): Promise<string[]> {
    let rawText = '';

    try {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            rawText = await parsePDF(file);
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            rawText = await parseDocx(file);
        } else if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
            rawText = await parseEpub(file);
        } else if (
            file.type === 'text/plain' ||
            file.type === 'text/markdown' ||
            file.name.endsWith('.txt') ||
            file.name.endsWith('.md')
        ) {
            rawText = await parsePlainText(file);
        } else {
            throw new Error('Unsupported file format');
        }

        return tokenizeText(rawText);
    } catch (error) {
        console.error('Document parsing failed:', error);
        throw new Error('Failed to parse document content');
    }
}
