"use client";

interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
  total: number;
  formatter?: (value: number) => string;
}

export function DonutChart({ data, total, formatter }: DonutChartProps) {
  const filtered = data.filter((s) => typeof s.value === "number" && s.value > 0);
  const totalValue = filtered.reduce((a, s) => a + s.value, 0);

  if (!totalValue || totalValue <= 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-muted">
        Nenhum registro para distribuir.
      </div>
    );
  }

  const fmt = formatter ?? ((v: number) => `${v}`);

  const cx = 100;
  const cy = 100;
  const radius = 82;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const sorted = [...filtered].sort((a, b) => b.value - a.value);
  const circles = sorted.map((s) => {
    const percent = s.value / totalValue;
    const segLen = percent * circumference;
    const offset = -cumulative * circumference;
    cumulative += percent;
    return {
      ...s,
      percent,
      dasharray: `${segLen} ${circumference - segLen}`,
      dashoffset: offset,
    };
  });

  const displayTotal = fmt(total);

  return (
    <div className="w-full h-48 flex items-start justify-start gap-10 pl-1">
      <div className="relative shrink-0">
        <svg viewBox="0 0 200 200" className="w-[164px] h-[164px]">
          <circle cx={cx} cy={cy} r={radius} fill="none" className="stroke-[#F0F0F0] dark:stroke-white/10" strokeWidth={strokeWidth} />
          {circles.map((s) => (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              transform="rotate(-90 100 100)"
              className="transition-all duration-700"
            />
          ))}
          <text
            x={cx}
            y={cy - 7}
            textAnchor="middle"
            fill="var(--text-primary)"
            fontSize="22"
            fontFamily="monospace"
            fontWeight="800"
          >
            {displayTotal}
          </text>
          <text
            x={cx}
            y={cy + 15}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="10"
            fontWeight="500"
            fontFamily="sans-serif"
          >
            Total
          </text>
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        {circles.map((s) => (
          <div key={s.label} className="flex items-start gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: s.color }} />
            <div className="flex flex-col gap-px">
              <span className="text-xs font-medium text-secondary leading-tight">{s.label}</span>
              <span className="text-xs font-semibold text-primary font-mono">
                {fmt(s.value)}
                <span className="text-muted font-light mx-1">|</span>
                <span className="text-muted font-medium">{Number.isFinite(s.percent) ? `${(s.percent * 100).toFixed(0)}%` : "0%"}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
