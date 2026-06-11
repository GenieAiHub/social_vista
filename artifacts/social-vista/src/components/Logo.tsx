import { useId } from "react";

export default function Logo({ className = "w-9 h-9" }: { className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0188C" />
          <stop offset="1" stopColor="#8B3DE5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id})`} />
      <path
        d="M15 44 L27 31 L36 40 L49 21"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="44" r="3.2" fill="white" />
      <circle cx="27" cy="31" r="3.2" fill="white" />
      <circle cx="36" cy="40" r="3.2" fill="white" />
      <circle cx="49" cy="21" r="4.6" fill="white" />
    </svg>
  );
}
