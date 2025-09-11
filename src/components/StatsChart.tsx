import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { type Center, type Village } from '@/data/campaignData';

interface StatsChartProps {
  type: 'center' | 'village';
  data: Center | Village;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const StatsChart: React.FC<StatsChartProps> = ({ type, data }) => {
  if (type === 'center') {
    const center = data as Center;
    const chartData = center.localUnits.map(unit => ({
      name: unit.name.replace('الوحدة المحلية ', ''),
      population: unit.villages.reduce((sum, village) => sum + village.population, 0),
      officials: unit.villages.reduce((sum, village) => sum + village.officials.length, 0),
      villages: unit.villages.length
    }));

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-center">إحصائيات السكان بالوحدات المحلية</h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                stroke="hsl(var(--foreground))"
              />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="population" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'village') {
    const village = data as Village;
    const pieData = [
      { name: 'مسؤولين', value: village.officials.length },
      { name: 'بدون مسؤولين', value: Math.max(0, Math.floor(village.population / 1000) - village.officials.length) }
    ];

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm text-center">توزيع المسؤولين</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={50}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 text-xs">
          {pieData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default StatsChart;