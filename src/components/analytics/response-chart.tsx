'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QuestionStat } from '@/types'

interface ResponseChartProps {
  stat: QuestionStat
}

const COLORS = ['#7c3aed', '#a855f7', '#ec4899', '#8b5cf6', '#6366f1', '#0ea5e9']

export function ResponseChart({ stat }: ResponseChartProps) {
  const data = stat.optionStats.map((o) => ({
    name: o.optionText.length > 20 ? o.optionText.slice(0, 20) + '…' : o.optionText,
    count: o.count,
    percentage: o.percentage,
  }))

  return (
    <Card className="glass-card rounded-2xl border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground leading-snug">
          {stat.questionText}
        </CardTitle>
        <p className="text-xs text-white/50">{stat.totalAnswers} answers</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'oklch(0.12 0.01 265)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: 'oklch(0.95 0 0)',
                fontSize: '12px',
              }}
              formatter={(value, _name, entry) => [
                `${value ?? 0} (${'percentage' in entry.payload ? entry.payload.percentage : 0}%)`,
                'Votes',
              ]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
