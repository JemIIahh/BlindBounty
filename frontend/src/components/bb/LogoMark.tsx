export function LogoMark({ size = 24, blade = 'currentColor', slit = 'transparent' }: {
  size?: number; blade?: string; slit?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill={blade} />
      <rect x="10" y="4" width="4" height="16" rx="2" fill={slit} />
    </svg>
  );
}
