import * as React from 'react';
import * as d3 from 'd3';

type TrendPoint = { date: string; positive: number; neutral: number; negative: number };

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const ref = React.useRef<SVGSVGElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    const width = 600;
    const height = 200;
    const margin = { top: 10, right: 20, bottom: 20, left: 30 };

    svg.selectAll('*').remove();

    const x = d3.scalePoint<string>()
      .domain(data.map(d => d.date))
      .range([margin.left, width - margin.right]);

    const maxY = d3.max(data, d => Math.max(d.positive, d.neutral, d.negative)) ?? 1;
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([height - margin.bottom, margin.top]);

    const line = (key: keyof TrendPoint, color: string) => {
      const l = d3.line<TrendPoint>()
        .x(d => x(d.date) ?? 0)
        .y(d => y(d[key] as number));
      svg.append('path')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', (l(data) as string) || '');
    };

    line('positive', '#22c55e');
    line('neutral', '#eab308');
    line('negative', '#ef4444');

    const ax = d3.axisBottom(x);
    const ay = d3.axisLeft(y).ticks(5);
    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(ax as any);
    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(ay as any);
  }, [data]);

  return (
    <svg ref={ref} viewBox="0 0 600 200" className="w-full h-48" />
  );
}
