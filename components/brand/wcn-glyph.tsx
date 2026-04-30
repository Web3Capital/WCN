type GlyphProps = {
  size?: number;
  className?: string;
  variant?: "mark" | "outline" | "ledger";
};

export function WCNGlyph({ size = 16, className, variant = "mark" }: GlyphProps) {
  if (variant === "ledger") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 2.5L21 7.5V16.5L12 21.5L3 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" opacity="0.45" />
        <path d="M12 2.5L21 7.5L12 12.5L3 7.5L12 2.5Z" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M3 7.5V16.5L12 21.5V12.5L3 7.5Z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M12 12.5V21.5L21 16.5V7.5L12 12.5Z" fill="currentColor" opacity="0.32" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === "outline") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 3L21 8L12 13L3 8L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M3 8V16L12 21L21 16V8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 13V21" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 3L21 8V16L12 21L3 16V8L12 3Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M12 3L21 8L12 13L3 8L12 3Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M12 13V21"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.35"
      />
    </svg>
  );
}
