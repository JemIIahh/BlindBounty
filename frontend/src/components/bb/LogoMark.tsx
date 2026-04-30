interface LogoMarkProps {
  size?: number;
  blade?: string;
  slit?: string;
  className?: string;
}

export function LogoMark({ size = 24, blade = 'currentColor', slit = 'var(--bb-bg)', className = '' }: LogoMarkProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 44 44" className={className}>
      <circle cx="22" cy="22" r="21" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
      <g transform="translate(22 22)">
        <g id="bb-blade">
          <path d="M 0 -18 L 15 -9 L 0 -2 Z" fill={blade} opacity="0.8" />
        </g>
        <use href="#bb-blade" transform="rotate(60)" />
        <use href="#bb-blade" transform="rotate(120)" />
        <use href="#bb-blade" transform="rotate(180)" />
        <use href="#bb-blade" transform="rotate(240)" />
        <use href="#bb-blade" transform="rotate(300)" />
      </g>
      <circle cx="22" cy="22" r="4.5" fill={blade} />
      <rect x="16.5" y="21" width="11" height="2" fill={slit} rx="1" />
    </svg>
  );
}
