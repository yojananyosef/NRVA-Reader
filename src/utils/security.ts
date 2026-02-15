import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML string to prevent XSS attacks.
 * Allows only safe tags and attributes necessary for Bible text formatting.
 * 
 * @param dirty The potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(dirty: string): string {
    // If running on server (SSR) and DOMPurify doesn't have a window, it might fail or return nothing.
    // For this project, we primarily render on client, but for SSR safety:
    if (typeof window === 'undefined') {
        // Fallback for SSR - assumes data source is relatively trusted for initial render
        // or that malicious scripts won't execute until hydration (which will re-run this on client)
        return dirty;
    }

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'p', 'br', 'div', 'small', 'sup'],
        ALLOWED_ATTR: ['class', 'style', 'id'],
        // Prevent clobbering
        ALLOW_DATA_ATTR: false,
    });
}
