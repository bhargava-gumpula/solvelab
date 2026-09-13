/** Isometric cube mark. Uses currentColor so it follows design tokens. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m4 7.4 8 4.6 8-4.6M12 12v9.2M8 5.1l8 4.6M8 9.7v9.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}
