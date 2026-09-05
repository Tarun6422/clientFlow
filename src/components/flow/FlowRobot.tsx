import { cn } from '../../lib/utils';

export type FlowRobotState =
  | 'idle'
  | 'asking'
  | 'listening'
  | 'thinking'
  | 'suggesting'
  | 'analyzing'
  | 'generating'
  | 'success'
  | 'warning';

/* Friendly futuristic robot — expressive LED eyes, antenna, soft glow.
   State changes the eye colour + animation via CSS classes. */

export default function FlowRobot({
  state = 'idle',
  size = 40,
  className,
}: {
  state?: FlowRobotState;
  size?: number;
  className?: string;
}) {
  const glow =
    state === 'success'
      ? '#10b981'
      : state === 'warning'
        ? '#f59e0b'
        : state === 'generating' || state === 'analyzing'
          ? '#8b5cf6'
          : state === 'thinking'
            ? '#6366f1'
            : '#818cf8';
  const blink = state === 'thinking' || state === 'analyzing' || state === 'generating';

  return (
    <div
      className={cn('flow-robot shrink-0', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        {/* antenna */}
        <line x1="24" y1="6" x2="24" y2="12" stroke={glow} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="24" cy="4.4" r="2.4" fill={glow} className={blink ? 'flow-eye--thinking' : undefined} />
        {/* head */}
        <rect
          x="7"
          y="11"
          width="34"
          height="26"
          rx="9"
          fill="#1e1b4b"
          stroke={glow}
          strokeWidth="1.6"
          className="flow-head"
        />
        {/* visor */}
        <rect x="12" y="16.5" width="24" height="11" rx="5.5" fill="#0f172a" />
        {/* LED eyes */}
        <circle cx="19" cy="22" r="3.1" fill={glow} className={blink ? 'flow-eye--thinking' : 'flow-eye'} />
        <circle cx="29" cy="22" r="3.1" fill={glow} className={blink ? 'flow-eye--thinking' : 'flow-eye'} />
        {/* mouth */}
        {state === 'success' || state === 'listening' ? (
          <path d="M18.5 30.5h11" stroke={glow} strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <circle cx="24" cy="30.5" r="2" fill={glow} opacity="0.9" />
        )}
        {/* body hint */}
        <rect x="17" y="37.5" width="14" height="5" rx="2.5" fill="#312e81" stroke={glow} strokeWidth="1.2" opacity="0.85" />
      </svg>
    </div>
  );
}