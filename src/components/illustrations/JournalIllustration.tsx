export const JournalIllustration = () => {
  return (
    <svg viewBox="0 0 400 400" width="100%" height="100%" fill="none">
      <defs>
        <linearGradient id="jGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4F46E5" stopOpacity="0.12" />
          <stop offset="1" stopColor="#7E3000" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="160" fill="url(#jGrad)" />
      <rect x="90" y="130" width="220" height="160" rx="10" stroke="#4F46E5" strokeWidth="2" strokeOpacity="0.45" fill="#FFFFFF" />
      <rect x="90" y="130" width="110" height="160" rx="10" stroke="#4F46E5" strokeWidth="2" strokeOpacity="0.6" fill="#F7F9FB" />
      <line x1="200" y1="130" x2="200" y2="290" stroke="#4F46E5" strokeWidth="1.5" strokeOpacity="0.3" />
      {[165, 185, 205, 225, 245].map((y, i) => (
        <line key={i} x1="108" y1={y} x2={180} y2={y} stroke="#4F46E5" strokeWidth="1.5" strokeOpacity={0.25 + i * 0.02} strokeLinecap="round" />
      ))}
      {[165, 185, 205, 225].map((y, i) => (
        <line key={i} x1="220" y1={y} x2={290} y2={y} stroke="#4F46E5" strokeWidth="1.5" strokeOpacity={0.25 + i * 0.02} strokeLinecap="round" />
      ))}
      <path d="M260 130 L260 320 L275 305 L290 320 L290 130 Z" fill="#7E3000" fillOpacity="0.7" />
      <g transform="rotate(18 210 270)">
        <rect x="150" y="265" width="120" height="8" rx="3" fill="#4F46E5" fillOpacity="0.85" />
        <path d="M270 265 L285 269 L270 273 Z" fill="#191C1E" />
        <rect x="150" y="265" width="18" height="8" rx="2" fill="#7E3000" />
      </g>
      <circle cx="140" cy="155" r="3" fill="#7E3000" fillOpacity="0.6" />
      <circle cx="300" cy="165" r="2.5" fill="#4F46E5" fillOpacity="0.5" />
    </svg>
  );
}
