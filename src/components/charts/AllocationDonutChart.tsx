'use client'

import { useState } from 'react'
import * as d3 from 'd3'
import { useD3 } from '@/hooks/useD3'

interface Props {
  data: Record<string, number>
  totalValue: number
  size?: number
}

const SECTOR_COLORS: Record<string, string> = {
  stock:  '#0EA5E9',
  crypto: '#6366F1',
  etf:    '#10B981',
}
const FALLBACK_COLORS = ['#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function getColor(sector: string, index: number): string {
  return SECTOR_COLORS[sector.toLowerCase()] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function AllocationDonutChart({ data, totalValue, size = 200 }: Props) {
  const sectors = Object.entries(data).filter(([, pct]) => pct > 0)
  const [hovered, setHovered] = useState<string | null>(null)

  const largest = sectors.reduce((a, b) => (b[1] > a[1] ? b : a), sectors[0] ?? ['—', 0])
  const centerSector = hovered ?? largest?.[0] ?? '—'
  const centerPct = data[centerSector] ?? 0

  const radius = size / 2
  const outerR = radius - 10
  const innerR = outerR * 0.58

  const ref = useD3<SVGSVGElement>((svg) => {
    if (sectors.length === 0) return

    const g = svg.append('g').attr('transform', `translate(${radius},${radius})`)

    const pie = d3.pie<[string, number]>()
      .value(d => d[1])
      .sort(null)
      .startAngle(-Math.PI / 2)

    const arc = d3.arc<d3.PieArcDatum<[string, number]>>()
      .innerRadius(innerR)
      .outerRadius(outerR)
      .cornerRadius(2)

    const arcExpanded = d3.arc<d3.PieArcDatum<[string, number]>>()
      .innerRadius(innerR)
      .outerRadius(outerR + 6)
      .cornerRadius(2)

    const arcs = g.selectAll('.arc')
      .data(pie(sectors))
      .join('path')
      .attr('class', 'arc')
      .attr('fill', (_, i) => getColor(sectors[i][0], i))
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5)

    arcs
      .transition()
      .duration(700)
      .ease(d3.easeCubicInOut)
      .attrTween('d', function(d) {
        const interp = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d)
        return (t) => arc(interp(t)) ?? ''
      })

    arcs
      .on('mouseenter', function(_, d) {
        d3.select(this).transition().duration(150).attr('d', arcExpanded(d) ?? '')
        setHovered(d.data[0])
      })
      .on('mouseleave', function(_, d) {
        d3.select(this).transition().duration(150).attr('d', arc(d) ?? '')
        setHovered(null)
      })
  }, [data, size])

  if (sectors.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={radius} cy={radius} r={outerR} fill="#F3F4F6" />
          <circle cx={radius} cy={radius} r={innerR} fill="white" />
          <text x={radius} y={radius} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#9CA3AF">No data</text>
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg ref={ref} width={size} height={size} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-foreground">{centerPct.toFixed(0)}%</span>
          <span className="text-xs text-muted-foreground capitalize">{centerSector}</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2">
        {sectors.map(([sector, pct], i) => (
          <div key={sector} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: getColor(sector, i) }} />
              <span className="text-xs text-secondary capitalize">{sector}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-foreground">{pct.toFixed(1)}%</span>
              <span className="text-[10px] text-muted-foreground">${fmt(totalValue * pct / 100)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
