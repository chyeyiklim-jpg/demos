'use client'

import { useRef, useEffect, RefObject } from 'react'
import * as d3 from 'd3'

export function useD3<T extends SVGSVGElement | SVGGElement>(
  renderFn: (selection: d3.Selection<T, unknown, null, undefined>) => void,
  deps: React.DependencyList
): RefObject<T | null> {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!ref.current) return
    const selection = d3.select(ref.current) as d3.Selection<T, unknown, null, undefined>
    renderFn(selection)
    return () => {
      selection.selectAll('*').remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
