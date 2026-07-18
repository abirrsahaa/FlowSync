import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import type { SkillProficiency } from '@/domain/user'

export interface SkillProficiencyRadarProps {
  data: SkillProficiency[]
}

export function SkillProficiencyRadar({ data }: SkillProficiencyRadarProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--app-border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: 'var(--app-ink-muted)', fontSize: 11, fontFamily: 'var(--font-mono, monospace)' }}
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} tickCount={2} />
          <Radar
            dataKey="score"
            stroke="var(--app-navy)"
            fill="var(--app-navy)"
            fillOpacity={0.12}
            dot={{ r: 3, fill: 'var(--app-navy)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
