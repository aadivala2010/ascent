import ReactECharts from 'echarts-for-react';

export interface ChartSeries {
  name: string;
  data: Array<[number, number]>;
  type?: 'line' | 'scatter';
  dash?: boolean;
}

export function TelemetryChart({ title, unit, series, height = 210, xUnit = 's' }: { title: string; unit: string; series: ChartSeries[]; height?: number; xUnit?: string }) {
  return (
    <div className="chart" aria-label={`${title} chart`}>
      <ReactECharts
        style={{ height, width: '100%' }}
        notMerge
        option={{
          backgroundColor: 'transparent',
          animation: false,
          title: { text: title, left: 12, top: 10, textStyle: { color: 'var(--text)', fontSize: 13, fontWeight: 650, fontFamily: 'Inter, system-ui' } },
          grid: { left: 52, right: 20, top: 44, bottom: 38, containLabel: false },
          tooltip: { trigger: 'axis', backgroundColor: 'var(--elevated)', borderColor: 'var(--border)', textStyle: { color: 'var(--text)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }, valueFormatter: (value: number) => `${value.toLocaleString()} ${unit}` },
          legend: series.length > 1 ? { top: 10, right: 12, textStyle: { color: 'var(--muted)', fontSize: 11 } } : undefined,
          xAxis: { type: 'value', name: xUnit, nameTextStyle: { color: 'var(--muted)' }, axisLine: { lineStyle: { color: 'var(--border-strong)' } }, axisLabel: { color: 'var(--muted)', fontSize: 10 }, splitLine: { lineStyle: { color: 'var(--grid)' } } },
          yAxis: { type: 'value', name: unit, nameTextStyle: { color: 'var(--muted)' }, axisLine: { show: true, lineStyle: { color: 'var(--border-strong)' } }, axisLabel: { color: 'var(--muted)', fontSize: 10 }, splitLine: { lineStyle: { color: 'var(--grid)' } } },
          dataZoom: [{ type: 'inside', filterMode: 'none' }],
          series: series.map((item, index) => ({
            name: item.name,
            type: item.type ?? 'line',
            data: item.data,
            showSymbol: false,
            smooth: false,
            lineStyle: { width: index === 0 ? 2 : 1.5, type: item.dash ? 'dashed' : 'solid', color: index === 0 ? 'var(--chart-a)' : 'var(--chart-b)' },
            itemStyle: { color: index === 0 ? 'var(--chart-a)' : 'var(--chart-b)' },
          })),
        }}
      />
    </div>
  );
}

export function pairs(times: Float64Array, values: Float64Array, scale = 1, maxPoints = 1200): Array<[number, number]> {
  const step = Math.max(1, Math.ceil(times.length / maxPoints));
  const output: Array<[number, number]> = [];
  for (let index = 0; index < times.length; index += step) output.push([times[index], values[index] / scale]);
  if (times.length && output.at(-1)?.[0] !== times.at(-1)) output.push([times.at(-1)!, values.at(-1)! / scale]);
  return output;
}
