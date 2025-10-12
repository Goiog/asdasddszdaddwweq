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

/** Horizontal stacked distribution showing relative totals per level */
const DistributionStrip: React.FC<{
  totalsByLevel: { level: string; total: number; colorClass: string }[];
  overallTotal: number;
}> = ({ totalsByLevel, overallTotal }) => {
  if (overallTotal === 0) {
    return (
      <div className="mt-3 text-xs text-muted-foreground">No distribution available — no words in collection.</div>
    );
  }

  return (
    <div className="mt-3">
      <div className="w-full h-4 bg-muted rounded-lg overflow-hidden flex" aria-hidden>
        {totalsByLevel.map(({ level, total, colorClass }) => {
          const pct = Math.round((total / overallTotal) * 100);
          const widthStyle = { width: `${pct}%` };
          return (
            <div
              key={level}
              title={`HSK ${level}: ${total} (${pct}%)`}
              className={`h-full ${colorClass}`}
              style={widthStyle}
              aria-hidden
            />
          );
        })}
      </div>

      {/* <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>Distribution across levels</div>
        <div className="hidden sm:flex items-center gap-2">
          {totalsByLevel.slice(0, 6).map(({ level, total }) => (
            <div key={level} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted inline-block" aria-hidden />
              <span className="text-xs">{`HSK ${level} (${total})`}</span>
            </div>
          ))}
        </div>
      </div> */}
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

  const overallPct = clamp(Number.isFinite(progressPercentage) ? progressPercentage : 0);

  // compute totals for distribution strip
  const totalsByLevel = useMemo(() => {
    const arr = levels.map((lvl) => {
      const total = stats.totalByHSK?.[lvl] ?? 0;
      const colorClass = HSK_COLOR_MAP[lvl] ?? HSK_COLOR_MAP.default;
      return { level: lvl, total, colorClass };
    });
    // sort descending so big segments render left-to-right more meaningful
    return arr.sort((a, b) => b.total - a.total);
  }, [levels, stats.totalByHSK]);

  const overallTotal = useMemo(
    () => totalsByLevel.reduce((s, t) => s + t.total, 0),
    [totalsByLevel]
  );

  return (
    <div className="w-full">
      <div className="bg-card border border-border rounded-2xl p-6">
        {/*<div className="grid grid-cols-1 lg:grid-cols-[0.3fr_0.7fr] gap-6"></div> */}
          {/* Left: Overall Progress 
          <div className="flex flex-col justify-between">
            <div>
              <div className="text-sm text-muted-foreground font-medium tracking-wide">Overall Progress</div>

              <div className="mt-4">
                <div
                  className="w-full bg-muted rounded-full h-4 overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(overallPct)}
                  aria-label="Collection progress"
                >
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                    style={{ width: `${clamp(overallPct)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">
                    <span className="tabular-nums">{uniqueCards.length}</span> /{" "}
                    <span className="tabular-nums">{allWords.length}</span>{" "}
                    <span className="text-xs font-normal text-muted-foreground">cards</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-border text-sm font-medium tabular-nums"
                      aria-hidden
                    >
                      {overallPct.toFixed(1)}%
                    </div>
                    <div className="hidden md:inline-flex items-center text-xs text-muted-foreground">
                      {Math.round(overallPct)} / 100
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Progress is calculated from learned cards in your collection.</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              {allWords.length === 0 ? <span>No words in the collection yet.</span> : null}
            </div>
          </div>*/}

          {/* Right: HSK Breakdown + Distribution */}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground font-medium tracking-wide">HSK Breakdown</div>
              <div className="text-xs text-muted-foreground">By level (tiles)</div>
            </div>

            {/* Distribution strip sits above the tiles to communicate mass distribution */}
            <DistributionStrip totalsByLevel={totalsByLevel} overallTotal={overallTotal} />

            {/* Grid of tiles */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {levels.map((level) => {
                const owned = stats.ownedByHSK?.[level] ?? 0;
                const total = stats.totalByHSK?.[level] ?? 0;
                const colorClass = HSK_COLOR_MAP[level] ?? HSK_COLOR_MAP.default;

                return (
                  <LevelTile
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
