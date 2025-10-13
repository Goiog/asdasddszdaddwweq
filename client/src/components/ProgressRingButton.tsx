import React, { useId, useMemo } from "react";

type Stats = {
  totalByHSK: Record<string, number>;
  ownedByHSK: Record<string, number>;
};

type ProgressToggleButtonProps = {
  isOpen?: boolean;
  onToggle?: () => void;
  progressPercentage?: number;
  uniqueCards?: any[];
  allWords?: any[];
  stats?: Stats;
  size?: number;
  strokeWidth?: number;
  colors?: [string, string];
};

const clamp = (v: number, a = 0, b = 100) => Math.min(b, Math.max(a, v));

export const ProgressRing: React.FC<{
  percent: number;
  size?: number;
  strokeWidth?: number;
  colors?: [string, string];
  showLabel?: boolean;
}> = ({
  percent,
  size = 24,
  strokeWidth = 3.5,
  colors = ["#10b981", "#6366f1"],
  showLabel = false,
}) => {
  const id = useId();
  const clamped = clamp(Number.isFinite(percent) ? percent : 0);

  const half = size / 2;
  const radius = half - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  const gradId = `grad-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="inline-block align-middle"
      role="img"
      aria-label={`Owned cards: ${Math.round(clamped)} percent`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>

      <circle
        cx={half}
        cy={half}
        r={radius}
        fill="transparent"
        stroke="rgba(15,23,42,0.08)"
        strokeWidth={strokeWidth}
      />

      <g transform={`rotate(-90 ${half} ${half})`}>
        <circle
          cx={half}
          cy={half}
          r={radius}
          fill="transparent"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 320ms ease, stroke 250ms ease" }}
        />
      </g>

      {showLabel && size >= 36 && (
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={Math.max(10, Math.floor(size / 4.5))}
          fontWeight={600}
          fill="#0f172a"
        >
          {`${Math.round(clamped)}%`}
        </text>
      )}
    </svg>
  );
};

export const ProgressToggleButton: React.FC<ProgressToggleButtonProps> = ({
  isOpen = false,
  onToggle,
  progressPercentage = 0,
  uniqueCards = [],
  allWords = [],
  stats = { totalByHSK: {}, ownedByHSK: {} },
  size = 28,
  strokeWidth = 3,
  colors = ["#10b981", "#6366f1"],
}) => {
  // consistent with ProgressHSKPanel
  const levels = useMemo(() => {
    const statKeys = Object.keys(stats.totalByHSK || {});
    const union = new Set<string>([...statKeys, "1", "2", "3", "4", "5", "6"]);
    return Array.from(union)
      .map((k) => Number(k))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b)
      .map(String);
  }, [stats.totalByHSK]);

  const overallOwned = useMemo(
    () => levels.reduce((sum, lvl) => sum + (stats.ownedByHSK?.[lvl] ?? 0), 0),
    [levels, stats.ownedByHSK]
  );

  const totalWords = useMemo(() => {
    if (Array.isArray(allWords) && allWords.length > 0) return allWords.length;
    return levels.reduce((sum, lvl) => sum + (stats.totalByHSK?.[lvl] ?? 0), 0);
  }, [allWords, stats.totalByHSK, levels]);

  const percent = useMemo(() => {
    if (Number.isFinite(progressPercentage)) return clamp(progressPercentage);
    if (totalWords === 0) return 0;
    return clamp((overallOwned / totalWords) * 100);
  }, [progressPercentage, overallOwned, totalWords]);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls="progression-panel"
      title={isOpen ? "Fold progression panel" : "Unfold progression panel"}
      className="inline-flex items-center justify-center gap-3 px-3 py-2 rounded-md hover:bg-muted/10 focus:outline-none focus:ring-2 focus:ring-ring transition select-none"
    >
      <div className="flex items-center gap-3 pointer-events-none">
        {/* Ring and label grouped visually but not intercepting clicks */}
        <ProgressRing percent={percent} size={size} strokeWidth={strokeWidth} colors={colors} />
        <div className="flex flex-col items-start text-left">
          <div className="text-sm font-semibold tabular-nums leading-none">
            {overallOwned} / {totalWords}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {totalWords > 0 ? `${Math.round((overallOwned / totalWords) * 100)}%` : "0%"}
          </div>
        </div>
      </div>

      <span
        className={`ml-1 transform transition-transform duration-300 ${
          isOpen ? "rotate-180" : "rotate-0"
        }`}
      >
        ▼
      </span>

      <span className="sr-only">
        {isOpen ? "Fold progression panel" : "Unfold progression panel"}
      </span>
    </button>

  );
};

export default ProgressRing;
