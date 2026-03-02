'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, FastForward, Rewind, BookmarkPlus, ChevronLeft, Type, Minus, Plus, Menu, X, Save, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';

export interface Chapter {
    title: string;
    word_index: number;
}

export interface Bookmark {
    id: string;
    word_index: number;
    note?: string;
}

export default function RSVPReader({
    documentId,
    title,
    words,
    chapters = [],
    initialBookmarks = [],
    initialIndex
}: {
    documentId: string;
    title: string;
    words: string[];
    chapters?: Chapter[];
    initialBookmarks?: Bookmark[];
    initialIndex: number;
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [wpm, setWpm] = useState(300);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isSaving, setIsSaving] = useState(false);

    // Typography preferences
    const [fontSize, setFontSize] = useState(2); // Mid size default
    const [fontFamily, setFontFamily] = useState('font-mono');
    const fontSizes = [
        'text-2xl sm:text-3xl md:text-4xl',
        'text-3xl sm:text-4xl md:text-5xl',
        'text-4xl sm:text-5xl md:text-6xl',
        'text-5xl sm:text-6xl md:text-7xl',
        'text-6xl sm:text-7xl md:text-8xl',
    ];

    const [isTocOpen, setIsTocOpen] = useState(false);

    // Bookmark State
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
    const [bookmarkNote, setBookmarkNote] = useState('');
    const [isSavingBookmark, setIsSavingBookmark] = useState(false);
    const [isDeletingBookmark, setIsDeletingBookmark] = useState<string | null>(null);

    // Reading Engine Settings
    const [isPunctuationPauseEnabled, setIsPunctuationPauseEnabled] = useState(true);

    const lastUpdateRef = useRef<number>(0);
    const requestRef = useRef<number | null>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Maintain a ref to the current index for the animation loop
    const currentIndexRef = useRef(currentIndex);
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    const totalWords = words.length;
    const currentWord = words[currentIndex] || '';
    const progressPercent = totalWords > 0 ? (currentIndex / totalWords) * 100 : 0;

    // Sync progress to DB
    const saveProgress = useCallback(async (index: number) => {
        setIsSaving(true);
        const supabase = createClient();
        const percent = (index / totalWords) * 100;

        await supabase
            .from('reading_progress')
            .update({
                current_word_index: index,
                percent_complete: percent,
                updated_at: new Date().toISOString()
            })
            .eq('document_id', documentId);

        setIsSaving(false);
    }, [documentId, totalWords]);

    const handleCreateBookmark = useCallback(async () => {
        if (isSavingBookmark) return;
        setIsSavingBookmark(true);
        const supabase = createClient();

        const { data, error } = await supabase
            .from('bookmarks')
            .insert({
                document_id: documentId,
                word_index: currentIndex,
                note: bookmarkNote.trim() || null,
            })
            .select()
            .single();

        if (!error && data) {
            setBookmarks(prev => [...prev, data as Bookmark].sort((a, b) => a.word_index - b.word_index));
            setIsBookmarkModalOpen(false);
            setBookmarkNote('');
        } else {
            console.error("Failed to save bookmark", error);
        }
        setIsSavingBookmark(false);
    }, [isSavingBookmark, documentId, currentIndex, bookmarkNote]);

    const handleDeleteBookmark = async (e: React.MouseEvent, bmId: string) => {
        e.stopPropagation();
        setIsDeletingBookmark(bmId);
        const supabase = createClient();

        const { error } = await supabase.from('bookmarks').delete().eq('id', bmId);

        if (!error) {
            setBookmarks(prev => prev.filter(b => b.id !== bmId));
        } else {
            console.error("Failed to delete bookmark", error);
        }
        setIsDeletingBookmark(null);
    };

    // Debounced save
    useEffect(() => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

        // Save every 5 seconds or when paused
        syncTimeoutRef.current = setTimeout(() => {
            saveProgress(currentIndex);
        }, isPlaying ? 5000 : 1000);

        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        }
    }, [currentIndex, isPlaying, saveProgress]);

    // Playback Loop using requestAnimationFrame for smooth non-blocking execution
    const animate = useCallback((time: number) => {
        if (!isPlaying) return;

        let interval = 60000 / wpm; // ms per word

        // Smart Punctuation Pauses
        if (isPunctuationPauseEnabled && words.length > 0) {
            const currentRenderedWord = words[currentIndexRef.current] || '';
            // Match sentence-ending punctuation (optionally followed by quotes/parentheses)
            if (currentRenderedWord.match(/[\.\!\?]["'\)]?$/)) {
                interval = interval * 2.5;
            }
            // Match minor punctuation
            else if (currentRenderedWord.match(/[\,\;\:]["'\)]?$/)) {
                interval = interval * 1.5;
            }
        }

        if (time - lastUpdateRef.current >= interval) {
            setCurrentIndex((prev) => {
                if (prev >= totalWords - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
            lastUpdateRef.current = time;
        }
        requestRef.current = requestAnimationFrame(animate);
    }, [isPlaying, wpm, totalWords, isPunctuationPauseEnabled, words]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        } else if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isBookmarkModalOpen) return; // Disable shortcuts when modal is open

            if (e.code === 'Space') {
                e.preventDefault();
                setIsPlaying(p => !p);
            } else if (e.code === 'ArrowRight') {
                setCurrentIndex(p => Math.min(totalWords - 1, p + 10));
            } else if (e.code === 'ArrowLeft') {
                setCurrentIndex(p => Math.max(0, p - 10));
            } else if (e.code === 'ArrowUp') {
                setWpm(p => Math.min(1000, p + 25));
            } else if (e.code === 'ArrowDown') {
                setWpm(p => Math.max(100, p - 25));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalWords]);

    return (
        <div className="flex flex-col h-full min-h-[80vh] w-full max-w-4xl mx-auto p-4 sm:p-8 relative">

            {/* Table of Contents Overlay */}
            {isTocOpen && (
                <div className="absolute inset-0 z-50 flex">
                    {/* The Sidebar */}
                    <div className="w-full sm:w-80 bg-background border-r h-full shadow-2xl flex flex-col pt-4 pb-8 overflow-y-auto z-50">
                        <div className="flex justify-between items-center px-6 mb-6">
                            <h3 className="font-semibold text-lg">Table of Contents</h3>
                            <button onClick={() => setIsTocOpen(false)} className="p-2 hover:bg-foreground/5 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        {chapters.length === 0 ? (
                            <div className="px-6 text-sm text-foreground/50">No chapters found.</div>
                        ) : (
                            <ul className="flex flex-col">
                                {chapters.map((chap, i) => (
                                    <li key={i}>
                                        <button
                                            onClick={() => {
                                                setCurrentIndex(chap.word_index);
                                                setIsPlaying(false);
                                                setIsTocOpen(false);
                                            }}
                                            className="w-full text-left px-6 py-3 hover:bg-foreground/5 text-sm transition-colors flex flex-col gap-1 border-b border-foreground/5"
                                        >
                                            <span className="font-medium text-foreground/90">{chap.title}</span>
                                            <span className="text-xs text-foreground/50">Word {chap.word_index.toLocaleString()}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Bookmarks Section */}
                        <div className="flex justify-between items-center px-6 mt-8 mb-4 border-t border-foreground/10 pt-8">
                            <h3 className="font-semibold text-lg flex items-center gap-2">Bookmarks</h3>
                        </div>
                        {bookmarks.length === 0 ? (
                            <div className="px-6 text-sm text-foreground/50">No bookmarks yet.</div>
                        ) : (
                            <ul className="flex flex-col">
                                {bookmarks.map((bm, i) => (
                                    <li key={i}>
                                        <button
                                            onClick={() => {
                                                setCurrentIndex(bm.word_index);
                                                setIsPlaying(false);
                                                setIsTocOpen(false);
                                            }}
                                            className="w-full text-left px-6 py-3 hover:bg-foreground/5 text-sm transition-colors flex flex-col gap-1 border-b border-foreground/5 group"
                                        >
                                            <div className="flex justify-between items-start w-full gap-2">
                                                <span className="font-medium text-foreground/90 leading-tight pt-1">{bm.note || `Bookmark #${i + 1}`}</span>
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={(e) => handleDeleteBookmark(e, bm.id)}
                                                    className={`p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all ${isDeletingBookmark === bm.id ? 'opacity-50 pointer-events-none' : ''}`}
                                                    title="Delete Bookmark"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <div className="flex justify-between w-full text-xs text-foreground/50 mt-1">
                                                <span>Word {bm.word_index.toLocaleString()}</span>
                                                <span className="italic truncate max-w-[120px]">"{words.slice(bm.word_index, bm.word_index + 3).join(' ')}..."</span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* The Clickaway Backdrop */}
                    <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setIsTocOpen(false)} />
                </div>
            )}

            {/* Bookmark Modal */}
            {isBookmarkModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsBookmarkModalOpen(false)} />
                    <div className="bg-background rounded-xl shadow-2xl z-10 w-full max-w-sm overflow-hidden flex flex-col border border-foreground/10 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4">Create Bookmark</h3>
                        <p className="text-sm text-foreground/60 mb-4">You are bookmarking word <span className="font-mono text-foreground font-medium">{currentIndex.toLocaleString()}</span>. You can optionally add a note below.</p>
                        <input
                            type="text"
                            className="w-full bg-foreground/5 border border-foreground/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500 transition-colors mb-6"
                            placeholder="My note (optional)"
                            value={bookmarkNote}
                            onChange={(e) => setBookmarkNote(e.target.value)}
                            autoFocus
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter' && !isSavingBookmark) {
                                    handleCreateBookmark();
                                }
                            }}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsBookmarkModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-foreground/5 rounded-lg transition-colors">Cancel</button>
                            <button
                                onClick={handleCreateBookmark}
                                disabled={isSavingBookmark}
                                className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingBookmark ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-1 text-foreground/60 hover:text-foreground transition-colors p-2 -ml-2 rounded-md hover:bg-foreground/5"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Library</span>
                    </Link>
                    <button
                        onClick={() => setIsTocOpen(true)}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-foreground/5 text-foreground/60 hover:text-foreground transition-colors"
                        title="Table of Contents"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 bg-foreground/5 py-1 px-2 sm:px-3 rounded-full border shadow-sm">
                    <button
                        onClick={() => {
                            setIsPlaying(false);
                            setBookmarkNote('');
                            setIsBookmarkModalOpen(true);
                        }}
                        className="p-1.5 hover:text-foreground text-foreground/60 hover:bg-foreground/5 rounded-full transition-colors"
                        title="Create Bookmark"
                    >
                        <BookmarkPlus className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-foreground/20 mx-1 hidden sm:block" />

                    <button onClick={() => setFontSize(p => Math.max(0, p - 1))} className="p-1 hover:text-foreground text-foreground/60 transition-colors" title="Decrease Font Size"><Minus className="w-4 h-4" /></button>
                    <Type className="w-4 h-4 text-foreground/40 hidden sm:block" />
                    <button onClick={() => setFontSize(p => Math.min(fontSizes.length - 1, p + 1))} className="p-1 hover:text-foreground text-foreground/60 transition-colors" title="Increase Font Size"><Plus className="w-4 h-4" /></button>

                    <div className="w-px h-4 bg-foreground/20 mx-1" />

                    <button onClick={() => setFontFamily('font-sans')} className={`text-sm px-1 sm:px-2 transition-colors ${fontFamily === 'font-sans' ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground/80'}`}>Aa</button>
                    <button onClick={() => setFontFamily('font-serif')} className={`text-sm px-1 sm:px-2 font-serif transition-colors ${fontFamily === 'font-serif' ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground/80'}`}>Aa</button>
                    <button onClick={() => setFontFamily('font-mono')} className={`text-sm px-1 sm:px-2 font-mono transition-colors ${fontFamily === 'font-mono' ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground/80'}`}>Aa</button>

                    <div className="w-px h-4 bg-foreground/20 mx-1" />
                    <button
                        onClick={() => setIsPunctuationPauseEnabled(p => !p)}
                        className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 font-medium rounded-full transition-colors border ${isPunctuationPauseEnabled ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-foreground/60 hover:text-foreground border-foreground/20'}`}
                        title="Smart Punctuation Pauses"
                    >
                        {isPunctuationPauseEnabled ? 'Smart Pause: ON' : 'Smart Pause: OFF'}
                    </button>

                    <div className="w-px h-4 bg-foreground/20 mx-1" />
                    <ThemeToggle />
                </div>

                <div className="flex items-center gap-2 text-sm text-foreground/50 text-right">
                    <span className="hidden sm:inline max-w-[150px] truncate" title={title}>{title}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isSaving ? '#fbbf24' : '#22c55e' }} title={isSaving ? 'Saving...' : 'Saved'} />
                </div>
            </div>

            {/* Reader Zone */}
            <div className="flex-1 flex flex-col justify-center items-center py-20">
                <div className="relative w-full max-w-2xl h-48 flex items-center justify-center rounded-2xl">
                    {/* Center Alignment Guides */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500/20 -translate-x-1/2" />

                    <div className={`${fontSizes[fontSize]} ${fontFamily} font-medium tracking-wide text-foreground transition-all duration-200`}>
                        {currentWord}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mt-auto flex flex-col gap-8 bg-background p-6 rounded-2xl border shadow-sm">

                {/* Playback Controls */}
                <div className="flex justify-center items-center gap-6">
                    <button
                        onClick={() => setCurrentIndex(p => Math.max(0, p - 15))}
                        className="p-3 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors flex flex-col items-center gap-0.5"
                        title="Rollback 15 words"
                    >
                        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-[10px] font-bold">-15</span>
                    </button>

                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-4 bg-foreground text-background rounded-full hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />}
                    </button>

                    <button
                        onClick={() => setCurrentIndex(p => Math.min(totalWords - 1, p + 15))}
                        className="p-3 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors flex flex-col items-center gap-0.5"
                        title="Forward 15 words"
                    >
                        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 scale-x-[-1]" />
                        <span className="text-[10px] font-bold">+15</span>
                    </button>
                </div>

                {/* Sliders */}
                <div className="grid md:grid-cols-2 gap-8">

                    {/* Progress timeline */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-foreground/60 font-medium">
                            <span>{progressPercent.toFixed(1)}%</span>
                            <span>{totalWords - currentIndex} words left</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={totalWords - 1}
                            value={currentIndex}
                            onChange={(e) => {
                                setIsPlaying(false);
                                setCurrentIndex(Number(e.target.value));
                            }}
                            className="w-full h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-foreground"
                        />
                    </div>

                    {/* WPM Control */}
                    <div className="flex flex-col gap-3">
                        <div className="text-center sm:text-left text-xs text-foreground/60 font-medium uppercase tracking-wider pl-2">Speed (WPM)</div>
                        <div className="flex items-center justify-between border bg-foreground/5 rounded-2xl p-1.5 shadow-sm">
                            <button
                                onClick={() => setWpm(p => Math.max(100, p - 50))}
                                className="p-3 hover:bg-background rounded-xl transition-all font-semibold active:scale-95 text-foreground/80 hover:text-foreground border border-transparent hover:border-foreground/10 hover:shadow-sm"
                            >
                                <Minus className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                            <span className="text-3xl sm:text-4xl font-bold w-24 text-center tabular-nums tracking-tight">{wpm}</span>
                            <button
                                onClick={() => setWpm(p => Math.min(1000, p + 50))}
                                className="p-3 hover:bg-background rounded-xl transition-all font-semibold active:scale-95 text-foreground/80 hover:text-foreground border border-transparent hover:border-foreground/10 hover:shadow-sm"
                            >
                                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
