'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Sunset } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-8 h-8" />; // Placeholder to avoid layout shift
    }

    return (
        <button
            onClick={() => {
                if (theme === 'light') setTheme('dark');
                else if (theme === 'dark') setTheme('sepia');
                else setTheme('light');
            }}
            className="p-2 rounded-md hover:bg-foreground/5 text-foreground/70 hover:text-foreground transition-colors relative flex items-center justify-center h-9 w-9"
            title={`Toggle theme (Current: ${theme})`}
            aria-label="Toggle theme"
        >
            {theme === 'light' && <Sun className="w-5 h-5" />}
            {theme === 'dark' && <Moon className="w-5 h-5" />}
            {theme === 'sepia' && <Sunset className="w-5 h-5" />}
        </button>
    );
}
