import { formatMinutes } from "../types"

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  totalValue: number
}

export function DonutChart({ segments, totalValue }: DonutChartProps) {
  const filtered = segments.filter((s) => typeof s.value === "number")
  const total = filtered.reduce((a, s) => a + s.value, 0)

  const cx = 100
  const cy = 100
  const radius = 78
  const strokeWidth = 30
  const circumference = 2 * Math.PI * radius

  let cumulative = 0
  const circles = (total > 0 ? filtered.filter((s) => s.value > 0) : filtered).map((s) => {
    const percent = total > 0 ? s.value / total : 0
    const dash = total > 0 ? percent * circumference : 0
    const gap = total > 0 ? circumference - dash : circumference
    const offset = -cumulative * circumference
    cumulative += percent
    return {
      ...s,
      percent,
      dasharray: `${dash} ${gap}`,
      dashoffset: offset,
    }
  })

  const displayTotal = formatMinutes(Math.round(totalValue * 60))
  const largest = total > 0 ? [...circles].sort((a, b) => b.percent - a.percent)[0] : null

  const pct = (v: number) => Number.isFinite(v) && v > 0 ? `${(v * 100).toFixed(0)}%` : "0%"
  const feedback = !largest
    ? "Nenhum registro para distribuir."
    : largest.percent > 0.8
      ? `${pct(largest.percent)} da jornada foi em horário regular.`
      : largest.percent > 0.5
        ? `${pct(largest.percent)} corresponde a ${largest.label.toLowerCase()}.`
        : `Distribuição: ${circles.map((s) => `${pct(s.percent)} ${s.label.toLowerCase()}`).join(", ")}.`

  return (
    <div className="w-full h-48 flex items-center justify-start gap-8 pl-1">
      <div className="relative shrink-0">
        <svg viewBox="0 0 200 200" className="w-[156px] h-[156px]">
          <circle cx={cx} cy={cy} r={radius} fill="none" className="stroke-[#D5DEEF] dark:stroke-[#1F3250]" strokeWidth={strokeWidth} />
          {total > 0 && circles.map((s) => (
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
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="transition-all duration-700"
            />
          ))}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            className="fill-[#1B2A41] dark:fill-[#FFFFFF]"
            fontSize="19"
            fontFamily="monospace"
            fontWeight="800"
          >
            {displayTotal}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            className="fill-[#5F6F89] dark:fill-[#B1C9EF]"
            fontSize="10"
            fontWeight="500"
            fontFamily="sans-serif"
          >
            Total acumulado
          </text>
        </svg>
      </div>

      <div className="flex flex-col gap-3.5">
        {circles.map((s) => (
          <div key={s.label} className="flex items-start gap-3">
            <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: s.color }} />
            <div className="flex flex-col gap-px">
              <span className="text-sm font-medium text-secondary leading-tight">{s.label}</span>
              <span className="text-sm font-semibold text-primary font-mono">
                {formatMinutes(Math.round(s.value * 60))}
                <span className="text-muted font-light mx-1">|</span>
                <span className="text-muted font-medium">{Number.isFinite(s.percent) && s.percent > 0 ? `${(s.percent * 100).toFixed(0)}%` : "0%"}</span>
              </span>
            </div>
          </div>
        ))}
        <div className="mt-2 pt-3 border-t border-default max-w-[220px]">
          <p className="text-[11px] text-muted leading-relaxed">{feedback}</p>
        </div>
      </div>
    </div>
  )
}
