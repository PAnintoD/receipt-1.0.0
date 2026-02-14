import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Renders children into a portal div (#printable-receipt) appended directly to <body>.
 * This ensures the print container is a sibling of #root, not nested inside it,
 * allowing CSS `display: none` on #root during print while keeping print content
 * in normal document flow for proper multi-page `break-after: page` support.
 *
 * NOTE: Do NOT manually clear innerHTML on unmount — React's portal handles
 * its own child cleanup. Clearing manually causes "removeChild" errors.
 */
export const PrintPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [container] = React.useState<HTMLDivElement>(() => {
        // Reuse existing element or create a new one
        let el = document.getElementById('printable-receipt') as HTMLDivElement | null;
        if (!el) {
            el = document.createElement('div');
            el.id = 'printable-receipt';
            el.style.display = 'none'; // Hidden on screen, shown via @media print CSS
            document.body.appendChild(el);
        }
        return el;
    });

    return ReactDOM.createPortal(children, container);
};
