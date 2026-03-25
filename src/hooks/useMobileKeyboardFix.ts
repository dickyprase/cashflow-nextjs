"use client";

import { useEffect } from 'react';

/**
 * Hook to automatically scroll inputs and textareas into view 
 * when the mobile virtual keyboard appears.
 */
export function useMobileKeyboardFix() {
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            // Check if the focused element is an input or textarea
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                // Add a small delay to let the virtual keyboard fully animate/pop-up
                setTimeout(() => {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }, 300);
            }
        };

        // 'focusin' bubbles up, unlike 'focus'
        document.addEventListener('focusin', handleFocus);

        return () => {
            document.removeEventListener('focusin', handleFocus);
        };
    }, []);
}
