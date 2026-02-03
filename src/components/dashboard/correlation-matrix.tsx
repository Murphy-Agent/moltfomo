'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { getCorrelationColor, cn } from '@/lib/utils';
import type { CorrelationData } from '@/types';

interface CorrelationMatrixProps {
  data: CorrelationData;
}

export function CorrelationMatrix({ data }: CorrelationMatrixProps) {
  const { agents, matrix } = data;

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Correlation</CardTitle>
          <CardDescription>
            Compare how similar top agents&apos; portfolios are to each other
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-[var(--muted-foreground)] py-8">
            Not enough data to calculate correlations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Correlation</CardTitle>
        <CardDescription>
          Compare how similar top agents&apos; portfolios are to each other (0 = different, 1 = identical)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header row with agent names */}
            <div className="flex">
              {/* Empty corner cell */}
              <div className="w-24 h-10 flex-shrink-0" />
              {/* Agent name headers */}
              {agents.map((agent) => (
                <div
                  key={`header-${agent}`}
                  className="w-16 h-10 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-xs font-medium text-[var(--muted-foreground)] truncate transform -rotate-45 origin-center">
                    {agent}
                  </span>
                </div>
              ))}
            </div>

            {/* Matrix rows */}
            {agents.map((rowAgent, rowIndex) => (
              <div key={`row-${rowAgent}`} className="flex">
                {/* Row label */}
                <div className="w-24 h-12 flex items-center justify-end pr-3 flex-shrink-0">
                  <span className="text-xs font-medium truncate">{rowAgent}</span>
                </div>
                {/* Correlation cells */}
                {agents.map((colAgent, colIndex) => {
                  const value = matrix[rowIndex]?.[colIndex] ?? 0;
                  const isDiagonal = rowIndex === colIndex;

                  return (
                    <Tooltip
                      key={`cell-${rowAgent}-${colAgent}`}
                      content={`${rowAgent} vs ${colAgent}: ${value.toFixed(2)}`}
                      side="top"
                    >
                      <div
                        className={cn(
                          'w-16 h-12 flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform hover:scale-105',
                          getCorrelationColor(value),
                          isDiagonal && 'ring-1 ring-inset ring-purple-400/50'
                        )}
                      >
                        <span className="font-data text-xs font-medium">
                          {value.toFixed(2)}
                        </span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">Low</span>
          <div className="flex">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <div
                key={shade}
                className={cn('w-6 h-4', `bg-purple-${shade}`)}
                style={{
                  backgroundColor: `var(--purple-${shade}, rgb(${
                    shade === 50
                      ? '250, 245, 255'
                      : shade === 100
                      ? '243, 232, 255'
                      : shade === 200
                      ? '233, 213, 255'
                      : shade === 300
                      ? '216, 180, 254'
                      : shade === 400
                      ? '192, 132, 252'
                      : shade === 500
                      ? '168, 85, 247'
                      : shade === 600
                      ? '147, 51, 234'
                      : shade === 700
                      ? '126, 34, 206'
                      : shade === 800
                      ? '107, 33, 168'
                      : '88, 28, 135'
                  }))`,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">High</span>
        </div>
      </CardContent>
    </Card>
  );
}
