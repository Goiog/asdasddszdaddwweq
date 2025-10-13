import React, { useMemo } from "react";

type Stats = {
  totalByHSK: Record<string, number>;
  ownedByHSK: Record<string, number>;
};

type Props = {
  progressPercentage: number;
  uniqueCards: any[]; // number of currently owned unique cards
  allWords: any[]; // number of words in the full set (total)
  stats: Stats;
};

const HSK_COLOR_MAP: Record<string, string> = {
  "1": "from-emerald-400 to-emerald-600",
  "2": "from-sky-400 to-indigo-400",
  "3": "from-violet-400 to-fuchsia-400",
  "4": "from-yellow-400 to-orange-400",
  "5": "from-red-400 to-rose-500",
  "6": "from-lime-400 to-emerald-400",
  default: "from-gray-400 to-gray-600",
};

const clamp = (v: number, a = 0, b = 100) => Math.min(b, Math.max(a, v));

/** Single tile for a level */
const LevelTile: React.FC<{
  level: string;
  owned: number;
  total: number;
  colorClass: string;
}> = ({ level, owned, total, colorClass }) => {
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
  const widthPct = `${clamp(pct)}%`;
  const empty = total === 0;

  return (
    <div
      className={`bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-4 hover:shadow-md transition-transform hover:scale-[1.01]`}
      title={empty ? `HSK ${level}: no cards` : `HSK ${level}: ${owned}/${total} (${pct}%)`}
      aria-label={`HSK ${level} breakdown: ${owned} of ${total} cards (${pct} percent)`}
      role="group"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {/* Big number */}
          <div className="text-xl md:text-2xl font-extrabold leading-none flex items-baseline gap-2">
            <span className="tabular-nums">{owned}</span>
            <span className="text-sm font-medium text-muted-foreground">/ {total}</span>
          </div>
          <div className="mt-1 text-xs sm:text-sm text-muted-foreground">HSK {level}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={`text-sm font-semibold tabular-nums ${empty ? "text-muted-foreground" : ""}`}
            aria-hidden
          >
            {pct}%
          </div>
          {/* Small fraction */}
          <div
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border text-muted-foreground`}
            style={{ background: "rgba(0,0,0,0.02)" }}
          >
            {empty ? "—" : `${owned}/${total}`}
          </div>
        </div>
      </div>

      {/* micro progress / accent */}
      <div className="flex items-center gap-3">
        {/* left color accent */}
        <div
          className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${colorClass}`}
          aria-hidden
        />

        <div
          className={`flex-1 h-3 rounded-full bg-muted overflow-hidden`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`HSK ${level} progress`}
        >
          <div
            className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-300 ease-out`}
            style={{ width: empty ? "0%" : widthPct }}
          />
        </div>
      </div>
    </div>
  );
};


/** Horizontal stacked distribution showing fraction of the ENTIRE set (allWords)
    contributed by owned cards per level. */
const DistributionStrip: React.FC<{
  totalsByLevel: { level: string; total: number; owned: number; colorClass: string }[];
  totalWords: number;
}> = ({ totalsByLevel, totalWords }) => {
  if (totalWords === 0) {
    return (
      <div className="mt-3 text-xs text-muted-foreground">
        No distribution available — no words in collection.
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="w-full h-4 bg-muted rounded-lg overflow-hidden flex" aria-hidden>
        {totalsByLevel.map(({ level, total, owned, colorClass }) => {
          // percentage of the ENTIRE set that is owned in this level
          const pctRaw = (owned / totalWords) * 100;
          const pctDisplay = Math.round(pctRaw);

          // fractional width so small slices are represented (not rounded to 0%)
          const widthStyle = { width: `${pctRaw}%` };

          // ensure gradient direction utility is present so colorClass renders
          const segmentClass = `h-full bg-gradient-to-r ${colorClass} flex items-center justify-center`;

          // only show inline label when there is room
          const showLabel = pctRaw >= 6;

          // tooltip shows owned/total and percent-of-allWords
          const tooltip = `HSK ${level}: ${owned}/${total} owned — ${pctDisplay}% of all words`;

          return (
            <div
              key={level}
              title={tooltip}
              className={segmentClass}
              style={widthStyle}
              aria-hidden
            >
              {showLabel ? (
                <span className="text-[10px] font-medium text-white select-none" aria-hidden>
                  {pctDisplay}%
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Compact block that shows Owned / Total percentage for a level */
const HSKBlock: React.FC<{
  level: string;
  owned: number;
  total: number;
  colorClass: string;
}> = ({ level, owned, total, colorClass }) => {
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
  const widthPct = `${clamp(pct)}%`;
  const empty = total === 0;

  return (
    <div
      className="bg-card border border-border rounded-xl p-3 flex flex-col justify-between hover:shadow-sm transition-transform hover:scale-[1.01]"
      title={empty ? `HSK ${level}: no cards` : `HSK ${level}: ${owned}/${total} (${pct}%)`}
      aria-label={`HSK ${level} progress: ${owned} of ${total} cards (${pct} percent)`}
      role="group"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold leading-none flex items-baseline gap-2">
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">HSK {level}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-medium tabular-nums" aria-hidden>
            {owned}/{total}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-3">
          {/* left color accent */}
          <div className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${colorClass}`} aria-hidden />

          <div
            className="flex-1 h-3 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label={`HSK ${level} progress`}
          >
            <div
              className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-300 ease-out`}
              style={{ width: empty ? "0%" : widthPct }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};



export const ProgressHSKPanel: React.FC<Props> = ({
  progressPercentage,
  uniqueCards,
  allWords,
  stats,
}) => {
  // ensure levels show HSK1..HSK6 plus any keys in stats
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

  const overallPct = clamp(Number.isFinite(progressPercentage) ? progressPercentage : 0);

  // compute totals for distribution strip
  const totalsByLevel = useMemo(() => {
    const arr = levels.map((lvl) => {
      const total = stats.totalByHSK?.[lvl] ?? 0;
      const owned = stats.ownedByHSK?.[lvl] ?? 0;
      const colorClass = HSK_COLOR_MAP[lvl] ?? HSK_COLOR_MAP.default;
      return { level: lvl, total, owned, colorClass };
    });
    // keep stable ordering (by level numeric)
    return arr.sort((a, b) => Number(a.level) - Number(b.level));
  }, [levels, stats.totalByHSK, stats.ownedByHSK]);

  // fall back to sum of totals if allWords isn't available
  const totalWords = useMemo(() => {
    if (Array.isArray(allWords) && allWords.length > 0) return allWords.length;
    return totalsByLevel.reduce((s, t) => s + t.total, 0);
  }, [allWords, totalsByLevel]);


  return (
    <div className="w-full">
      <div className="bg-card border border-border rounded-2xl p-6">
          {/* Top: HSK Breakdown + Distribution */}
          <div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium tracking-wide">Owned Cards</div>
                  <div className="flex items-baseline gap-1">
                    <div className="text-sm font-semibold tabular-nums">
                      {overallOwned} / {totalWords}
                    </div>
                    <div className="text-xs text-gray-500">
                      {totalWords > 0 ? ((overallOwned / totalWords) * 100).toFixed(0) : "0"}%
                    </div>
                  </div>
                </div>

            {/* Distribution strip sits above the tiles to communicate mass distribution */}
            <DistributionStrip totalsByLevel={totalsByLevel} totalWords={totalWords} />

            {/* Bottom Grid: compact HSK blocks showing owned/total percentage */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {levels.map((level) => {
                const owned = stats.ownedByHSK?.[level] ?? 0;
                const total = stats.totalByHSK?.[level] ?? 0;
                const colorClass = HSK_COLOR_MAP[level] ?? HSK_COLOR_MAP.default;

                return (
                  <HSKBlock
                    key={level}
                    level={level}
                    owned={owned}
                    total={total}
                    colorClass={colorClass}
                  />
                );
              })}
            </div>
          </div>
      </div>
    </div>
  );
};

export default ProgressHSKPanel;
