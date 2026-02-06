type SparklineProps = {
  points: number[];
  stroke?: string;
};

export default function Sparkline({ points, stroke = "#1c1914" }: SparklineProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-16 items-center justify-center rounded-xl border border-[#eadfcf] bg-white/70 text-xs text-[#6b5b45]">
        No data yet
      </div>
    );
  }

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const width = 240;
  const height = 64;
  const step = width / Math.max(points.length - 1, 1);

  const path = points
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full">
      <svg width="100%" height="64" viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
      <path
        d={`${path} L${width},${height} L0,${height} Z`}
        fill="url(#sparklineFill)"
        opacity="0.12"
      />
      {points.map((value, index) => {
        const x = index * step;
        const y = height - ((value - min) / range) * height;
        return (
          <g key={`point-${index}`}>
            <circle cx={x} cy={y} r="2.5" fill={stroke} />
            <title>{`Hour ${index + 1}: ${value} events`}</title>
          </g>
        );
      })}
      <defs>
        <linearGradient id="sparklineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] text-[#6b5b45]">
        <span>8h ago</span>
        <span>Now</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-[#6b5b45]">
        <span>Low: {min}</span>
        <span>High: {max}</span>
      </div>
    </div>
  );
}
