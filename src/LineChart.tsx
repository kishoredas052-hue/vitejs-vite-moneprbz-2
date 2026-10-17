
type LineChartProps = {
  data: number[];
};

export default function LineChart({ data }: LineChartProps) {
  const width = 300;
  const height = 100;
  const padding = 5;

  const values = data.filter(
    (value) => Number.isFinite(value)
  );

  if (values.length < 2) {
    return (
      <div className="mt-4 flex h-24 items-center justify-center rounded-xl border border-white/10 text-sm text-gray-400">
        Not enough chart data
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x =
        padding +
        (index / (values.length - 1)) *
          (width - padding * 2);

      const y =
        height -
        padding -
        ((value - min) / range) *
          (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");

  const first = values[0];
  const last = values[values.length - 1];
  const isPositive = last >= first;
  const lineColor = isPositive ? "#22c55e" : "#ef4444";
  const gradientId = isPositive
    ? "chartGradientGreen"
    : "chartGradientRed";

  const areaPoints = `${padding},${height} ${points} ${width - padding},${height}`;

  return (
    <div className="mt-4 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950/30 p-2">
      <div className="mb-2 flex items-center justify-between px-1 text-xs">
        <span className="text-gray-400">
          Price trend
        </span>
        <span
          className={
            isPositive
              ? "font-semibold text-green-400"
              : "font-semibold text-red-400"
          }
        >
          {isPositive ? "▲" : "▼"}{" "}
          {Math.abs(last - first).toFixed(2)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-24 w-full"
        role="img"
        aria-label={`Price trend ${isPositive ? "upward" : "downward"}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={lineColor}
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor={lineColor}
              stopOpacity="0.01"
            />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1="0"
            y1={height * fraction}
            x2={width}
            y2={height * fraction}
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeDasharray="3 4"
          />
        ))}

        <polygon
          points={areaPoints}
          fill={`url(#${gradientId})`}
        />

        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
