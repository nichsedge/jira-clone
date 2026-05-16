
export function Logo() {
  return (
    <div className="relative flex items-center justify-center w-8 h-8 rounded-xl overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent animate-gradient-xy group-hover:rotate-12 transition-transform duration-500" />
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 text-white group-hover:scale-110 transition-transform duration-300"
      >
        <path
          d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
