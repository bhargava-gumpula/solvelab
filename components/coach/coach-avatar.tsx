/**
 * The coach's face: a cube with eyes, drawn from design tokens so it follows
 * the theme. It is decoration, so it never carries text for screen readers.
 */
export function CoachAvatar({
  size = "sm",
  thinking = false,
  className,
}: {
  size?: "sm" | "lg";
  /** Narrows the eyes and speeds the blink while the coach works something out. */
  thinking?: boolean;
  className?: string;
}) {
  const large = size === "lg";
  return (
    <span
      aria-hidden
      data-thinking={thinking ? "true" : undefined}
      className={[
        "coach-avatar relative grid shrink-0 place-items-center rounded-2xl",
        "bg-gradient-to-br from-primary/25 to-primary/5 text-primary ring-1 ring-primary/25",
        large ? "size-12" : "size-8",
        className ?? "",
      ].join(" ")}
    >
      <svg viewBox="0 0 32 32" fill="none" className={large ? "size-8" : "size-5"}>
        {/* The cube face: a 3×3 grid, dimmed so the eyes read first. */}
        <rect
          x="3.5"
          y="3.5"
          width="25"
          height="25"
          rx="6"
          stroke="currentColor"
          strokeWidth="1.6"
          opacity="0.75"
        />
        <path
          d="M12 4v24M20 4v24M4 12h24M4 20h24"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.22"
        />
        <g className="coach-avatar-eyes" fill="currentColor">
          <rect x="9.5" y="12" width="4" height="6" rx="2" />
          <rect x="18.5" y="12" width="4" height="6" rx="2" />
        </g>
        <path
          d="M12.5 22.2c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    </span>
  );
}
