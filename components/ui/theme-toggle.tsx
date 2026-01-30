"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="p-2 rounded-full bg-gray-100 text-gray-500">
                <div className="w-5 h-5" />
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative p-2 rounded-full transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Toggle theme"
        >
            <Sun className={`w-5 h-5 text-amber-500 transition-all duration-500 rotate-0 scale-100 ${theme === 'dark' ? 'rotate-90 scale-0 absolute' : ''}`} />
            <Moon className={`w-5 h-5 text-blue-500 transition-all duration-500 rotate-90 scale-0 absolute top-2 left-2 ${theme === 'dark' ? 'rotate-0 scale-100 relative top-auto left-auto' : ''}`} />
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
