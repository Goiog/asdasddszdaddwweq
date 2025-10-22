import React from 'react';

interface BatteryProps {
  level?: number;        // battery fill level (0–10)
  proportion: number;    // base scaling factor, e.g. style.proportion
}

const Battery: React.FC<BatteryProps> = ({ level = 0, proportion }) => {
  const segments = Array.from({ length: 10 });

  // All visual properties derived from proportion
  const gap = proportion * 1;
  const width = proportion * 70;
  const flex = proportion * 1;
  const height = proportion * 18;
  const borderRadius = proportion * 2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row-reverse',
        gap,
        width,
      }}
    >
      {segments.map((_, i) => (
        <div
          key={i}
          className={`segment ${i < level ? 'filled' : ''}`}
          style={{
            flex,
            height,
            borderRadius,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
            transition: 'background .25s',
          }}
        />
      ))}
    </div>
  );
};

export default Battery;
