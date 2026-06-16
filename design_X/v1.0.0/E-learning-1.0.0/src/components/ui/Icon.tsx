import React from "react";

type IconProps = {
  icon: string;
  className?: string;
};

/**
 * Local Icon component that renders inline SVGs for all icons used
 * on the landing page. Replaces @iconify/react which fetches from
 * api.simplesvg.com (unreachable from GitHub Pages CDN).
 */
export function Icon({ icon, className = "" }: IconProps) {
  const base = `inline-block shrink-0 ${className}`;

  switch (icon) {
    // --- Hero ---
    case "solar:verified-check-bold":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.1 2.7a3 3 0 0 1 3.8 0l.9.8a1 1 0 0 0 .8.2l1.2-.2a3 3 0 0 1 3.3 2l.4 1.1a1 1 0 0 0 .5.6l1 .5a3 3 0 0 1 1.4 3.5l-.4 1.1a1 1 0 0 0 0 .8l.4 1.1a3 3 0 0 1-1.4 3.5l-1 .5a1 1 0 0 0-.5.6l-.4 1.1a3 3 0 0 1-3.3 2l-1.2-.2a1 1 0 0 0-.8.2l-.9.8a3 3 0 0 1-3.8 0l-.9-.8a1 1 0 0 0-.8-.2l-1.2.2a3 3 0 0 1-3.3-2l-.4-1.1a1 1 0 0 0-.5-.6l-1-.5a3 3 0 0 1-1.4-3.5l.4-1.1a1 1 0 0 0 0-.8l-.4-1.1a3 3 0 0 1 1.4-3.5l1-.5a1 1 0 0 0 .5-.6l.4-1.1a3 3 0 0 1 3.3-2l1.2.2a1 1 0 0 0 .8-.2l.9-.8Z" />
          <path d="M9 12.5 11 14.5L15.5 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case "solar:magnifer-linear":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );

    // --- Features ---
    case "solar:notebook-minimalistic-outline":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16v16H4z" />
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M8 10h8" />
          <path d="M8 14h6" />
          <path d="M8 18h4" />
        </svg>
      );

    case "solar:library-outline":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 21V7l4-3 4 3v14" />
          <path d="M4 21h16" />
          <path d="M12 7v14" />
          <path d="M8 21V11" />
          <path d="M16 11v4" />
          <path d="M16 19v2" />
          <path d="M20 11v4" />
          <path d="M20 19v2" />
          <path d="M8 7v2" />
        </svg>
      );

    case "solar:clipboard-check-outline":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="2" width="12" height="4" rx="1" />
          <path d="M8 2H6a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );

    case "solar:magic-stick-3-outline":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 4V2" />
          <path d="M15 16v-2" />
          <path d="M8 9h2" />
          <path d="M20 9h2" />
          <path d="M17.5 5.5 19 4" />
          <path d="M17.5 12.5 19 14" />
          <path d="M10.5 5.5 9 4" />
          <path d="M10.5 12.5 9 14" />
          <path d="M6 18 18 6" />
        </svg>
      );

    case "solar:chart-square-outline":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 16V8" />
          <path d="M12 16v-5" />
          <path d="M17 16v-3" />
        </svg>
      );

    case "solar:shield-check-outline":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    // --- Courses extra ---
    case "solar:users-group-rounded-linear":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="7" r="3" />
          <circle cx="15" cy="7" r="3" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h1" />
          <path d="M21 21v-2a4 4 0 0 0-4-4h-1" />
          <path d="M9 15h6" />
        </svg>
      );

    // --- Social / Contact (Footer) ---
    case "tabler:brand-facebook":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />
        </svg>
      );

    case "tabler:brand-twitter":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
          <path d="M4 20l6.768 -6.768m2.46 -2.46L20 4" />
        </svg>
      );

    case "tabler:brand-instagram":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17" cy="7" r="1" fill="currentColor" />
        </svg>
      );

    case "tabler:brand-google-maps":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="3" />
          <path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z" />
        </svg>
      );

    case "tabler:phone":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );

    case "tabler:folder":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z" />
        </svg>
      );

    // --- Stars ---
    case "tabler:star-filled":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );

    case "tabler:star-half-filled":
      return (
        <svg className={base} width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" opacity="0.3" />
          <path d="M12 2v15.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );

    default:
      return <span className={base} />;
  }
}
