'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, FastForward, Rewind, BookmarkPlus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function RSVPReader({
    documentId,
    title,
    words,
    initialIndex
}: {
    documentId: string;
    title: string;
    words: string[];
    initialIndex: number;
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [wpm, setWpm] = useState(300);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isSaving, setIsSaving] = useState(false);

    const lastUpdateRef = useRef<number>(0);
    const requestRef = useRef<number | null>(null);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

        const interval = 60000 / wpm; // ms per word

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
    }, [isPlaying, wpm, totalWords]);

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
        <div className="flex flex-col h-full min-h-[80vh] w-full max-w-4xl mx-auto p-4 sm:p-8">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-12">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Back to Library
                </Link>
                <div className="font-semibold text-lg truncate max-w-[50%]">{title}</div>
                <div className="flex items-center gap-2 text-sm text-foreground/50">
                    {isSaving ? 'Saving...' : 'Saved'}
                </div>
            </div>

            {/* Reader Zone */}
            <div className="flex-1 flex flex-col justify-center items-center py-20">
                <div className="relative w-full max-w-md h-32 flex items-center justify-center bg-foreground/5 rounded-2xl shadow-inner overflow-hidden">
                    {/* Center Alignment Guides */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500/20 -translate-x-1/2" />

                    <div className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-wide text-foreground font-mono">
                        {currentWord}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="mt-auto flex flex-col gap-8 bg-background p-6 rounded-2xl border shadow-sm">

                {/* Playback Controls */}
                <div className="flex justify-center items-center gap-6">
                    <button
                        onClick={() => setCurrentIndex(p => Math.max(0, p - 10))}
                        className="p-3 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
                        title="Rewind 10 words"
                    >
                        <Rewind className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-4 bg-foreground text-background rounded-full hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>

                    <button
                        onClick={() => setCurrentIndex(p => Math.min(totalWords - 1, p + 10))}
                        className="p-3 text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
                        title="Forward 10 words"
                    >
                        <FastForward className="w-6 h-6" />
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
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs text-foreground/60 font-medium">
                            <span>Speed</span>
                            <span>{wpm} WPM</span>
                        </div>
                        <input
                            type="range"
                            min="100"
                            max="1000"
                            step="10"
                            value={wpm}
                            onChange={(e) => setWpm(Number(e.target.value))}
                            className="w-full h-2 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
