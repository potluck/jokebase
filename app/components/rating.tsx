"use client";

interface RatingProps {
  value: number | null;
  onChange: (v: number | null) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function Rating({ value, onChange, size = "md", disabled = false }: RatingProps) {
  const sz = size === "sm" ? "text-base" : "text-xl";

  return (
    <span className={`inline-flex gap-0.5 ${sz}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === n ? null : n)}
          className={`leading-none transition-colors disabled:cursor-default ${
            value !== null && n <= value
              ? "text-yellow-400"
              : "text-neutral-300 dark:text-neutral-600 hover:text-yellow-300 disabled:hover:text-neutral-300 dark:disabled:hover:text-neutral-600"
          }`}
          title={disabled ? "Ratings locked" : `${n} star${n > 1 ? "s" : ""}${value === n ? " (click to clear)" : ""}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
