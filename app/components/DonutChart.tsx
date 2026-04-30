'use client';

import { memo } from 'react';

interface DonutChartProps {
  data: Record<string, number>;
  title: string;
  colors: string[];
}

const DonutChart = memo(function DonutChart({ data, title, colors }: DonutChartProps) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-500">No data</p>
      </div>
    );
  }

  const centerX = 60;
  const centerY = 60;
  const outerRadius = 45;
  const innerRadius = 30;

  let currentAngle = -90; // Start from top
  const segments: Array<{ tag: string; percentage: number; color: string; path: string }> = [];

  entries.forEach(([tag, value], index) => {
    const percentage = (value / total) * 100;
    const sliceAngle = (percentage / 100) * 360;

    if (sliceAngle === 360) {
      // Handle full circle case - draw as two semicircles
      const startRad = (-90 * Math.PI) / 180;
      const midRad = (90 * Math.PI) / 180;
      const endRad = (270 * Math.PI) / 180;

      // First semicircle (outer)
      const x1 = centerX + outerRadius * Math.cos(startRad);
      const y1 = centerY + outerRadius * Math.sin(startRad);
      const x2 = centerX + outerRadius * Math.cos(midRad);
      const y2 = centerY + outerRadius * Math.sin(midRad);
      const x3 = centerX + outerRadius * Math.cos(endRad);
      const y3 = centerY + outerRadius * Math.sin(endRad);

      // Inner semicircles
      const x4 = centerX + innerRadius * Math.cos(endRad);
      const y4 = centerY + innerRadius * Math.sin(endRad);
      const x5 = centerX + innerRadius * Math.cos(midRad);
      const y5 = centerY + innerRadius * Math.sin(midRad);
      const x6 = centerX + innerRadius * Math.cos(startRad);
      const y6 = centerY + innerRadius * Math.sin(startRad);

      const pathData = `
        M ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2}
        A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3}
        L ${x4} ${y4}
        A ${innerRadius} ${innerRadius} 0 0 0 ${x5} ${y5}
        A ${innerRadius} ${innerRadius} 0 0 0 ${x6} ${y6}
        Z
      `;

      segments.push({
        tag,
        percentage,
        color: colors[index % colors.length],
        path: pathData,
      });
    } else {
      const endAngle = currentAngle + sliceAngle;

      // Convert angles to radians
      const startRad = (currentAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Calculate outer arc points
      const x1 = centerX + outerRadius * Math.cos(startRad);
      const y1 = centerY + outerRadius * Math.sin(startRad);
      const x2 = centerX + outerRadius * Math.cos(endRad);
      const y2 = centerY + outerRadius * Math.sin(endRad);

      // Calculate inner arc points
      const x3 = centerX + innerRadius * Math.cos(endRad);
      const y3 = centerY + innerRadius * Math.sin(endRad);
      const x4 = centerX + innerRadius * Math.cos(startRad);
      const y4 = centerY + innerRadius * Math.sin(startRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      // Create path
      const pathData = `
        M ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;

      segments.push({
        tag,
        percentage,
        color: colors[index % colors.length],
        path: pathData,
      });

      currentAngle = endAngle;
    }
  });

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
      <svg width="160" height="160" viewBox="0 0 120 120" className="mt-4">
        {segments.map((segment) => (
          <path
            key={segment.tag}
            d={segment.path}
            fill={segment.color}
            className="hover:opacity-80 transition-opacity"
          />
        ))}
      </svg>
      <div className="mt-6 w-full space-y-2">
        {segments.map((segment) => (
          <div key={segment.tag} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              ></div>
              <span className="truncate text-zinc-700 dark:text-zinc-300">
                {segment.tag}
              </span>
            </div>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default DonutChart;
