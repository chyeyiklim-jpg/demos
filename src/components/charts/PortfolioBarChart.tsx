'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useD3 } from '@/hooks/useD3'
import type { WeekSnapshot } from '@/app/api/portfolio-history/route'

interface Props {
  data: WeekSnapshot[]
  height?: number
}

interface TooltipState {
  x: number
  y: number
  week: string
  costBasis: number
  estimatedValue: number
  visible: boolean
}

export default function PortfolioBarChart({ data, height = 200 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, week: '', costBasis: 0, estimatedValue: 0, visible: false })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(containerRef.current)
    setWidth(containerRef.current.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  const margin = { top: 16, right: 16, bottom: 32, left: 56 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const ref = useD3<SVGSVGElement>((svg) => {
    if (data.length === 0 || innerW <= 0) return

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const weeks = data.map(d => d.week)
    const maxVal = d3.max(data, d => Math.max(d.costBasis, d.estimatedValue)) ?? 0

    const x0 = d3.scaleBand().domain(weeks).range([0, innerW]).paddingInner(0.3).paddingOuter(0.1)
    const x1 = d3.scaleBand().domain(['costBasis', 'estimatedValue']).range([0, x0.bandwidth()]).padding(0.05)
    const y = d3.scaleLinear().domain([0, maxVal * 1.1]).nice().range([innerH, 0])

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat(() => ''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#E5E7EB').attr('stroke-opacity', 0.5))

    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat(v => {
        const n = v as number
        return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`
      }))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('.tick text').attr('fill', '#6B7280').attr('font-size', '11px'))

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x0).tickSize(0))
      .call(g => g.select('.domain').attr('stroke', '#E5E7EB'))
      .call(g => g.selectAll('.tick text').attr('fill', '#6B7280').attr('font-size', '11px').attr('dy', '1.2em'))

    const barsA = g.selectAll('.bar-cost')
      .data(data)
      .join('rect')
      .attr('class', 'bar-cost')
      .attr('x', d => (x0(d.week) ?? 0) + (x1('costBasis') ?? 0))
      .attr('y', innerH)
      .attr('width', x1.bandwidth())
      .attr('height', 0)
      .attr('fill', '#0EA5E9')
      .attr('rx', 2)

    barsA.transition()
      .duration(600)
      .delay((_, i) => i * 30)
      .ease(d3.easeQuadOut)
      .attr('y', d => y(d.costBasis))
      .attr('height', d => innerH - y(d.costBasis))

    const barsB = g.selectAll('.bar-est')
      .data(data)
      .join('rect')
      .attr('class', 'bar-est')
      .attr('x', d => (x0(d.week) ?? 0) + (x1('estimatedValue') ?? 0))
      .attr('y', innerH)
      .attr('width', x1.bandwidth())
      .attr('height', 0)
      .attr('fill', '#6366F1')
      .attr('rx', 2)

    barsB.transition()
      .duration(600)
      .delay((_, i) => i * 30 + 80)
      .ease(d3.easeQuadOut)
      .attr('y', d => y(d.estimatedValue))
      .attr('height', d => innerH - y(d.estimatedValue))

    g.selectAll('.hover-rect')
      .data(data)
      .join('rect')
      .attr('class', 'hover-rect')
      .attr('x', d => x0(d.week) ?? 0)
      .attr('y', 0)
      .attr('width', x0.bandwidth())
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .on('mousemove', function(event, d) {
        const [mx, my] = d3.pointer(event, containerRef.current)
        setTooltip({ x: mx, y: my, week: d.week, costBasis: d.costBasis, estimatedValue: d.estimatedValue, visible: true })
      })
      .on('mouseleave', () => setTooltip(t => ({ ...t, visible: false })))
  }, [data, width])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No trade history yet
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-4 mb-2 px-1">
        {[['#0EA5E9', 'Cost Basis'], ['#6366F1', 'Est. Value']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <svg ref={ref} width={width} height={height} />

      {tooltip.visible && (
        <div
          className="absolute pointer-events-none z-10 bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs"
          style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}
        >
          <p className="font-semibold text-foreground mb-1">{tooltip.week}</p>
          <p className="text-muted-foreground">Cost Basis: <span className="text-foreground font-medium">${tooltip.costBasis.toLocaleString()}</span></p>
          <p className="text-muted-foreground">Est. Value: <span className="text-foreground font-medium">${tooltip.estimatedValue.toLocaleString()}</span></p>
          <p className="text-muted-foreground">Change: <span className={tooltip.estimatedValue >= tooltip.costBasis ? 'text-green-500' : 'text-red-500'}>
            {tooltip.costBasis > 0 ? `${((tooltip.estimatedValue - tooltip.costBasis) / tooltip.costBasis * 100).toFixed(1)}%` : '—'}
          </span></p>
        </div>
      )}
    </div>
  )
}
