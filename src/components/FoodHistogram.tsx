'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { format, subDays } from 'date-fns';
import { useState, useMemo } from 'react';

type FoodEntry = { date: Date; calories: number; protein: number; carbs: number; fat: number; };

const CustomXAxisTick = ({ x, y, payload, chartData }: any) => {
    const dataItem = chartData.find((d: any) => d.dateStr === payload.value);
    if (!dataItem) return null;
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="var(--text-secondary)" fontSize={12}>
                {payload.value}
            </text>
            <text x={0} y={0} dy={32} textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontWeight={600}>
                {dataItem.total} kcal
            </text>
        </g>
    );
};

export default function FoodHistogram({ data }: { data: FoodEntry[] }) {
    const [daysRange, setDaysRange] = useState(7); // default 7 days

    const chartData = useMemo(() => {
        const cutoff = subDays(new Date(), daysRange);
        return data
            .filter(d => d.date >= cutoff)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(d => {
                const proteinCals = d.protein * 4;
                const carbsCals = d.carbs * 4;
                const fatCals = d.fat * 9;
                let otherCals = d.calories - (proteinCals + carbsCals + fatCals);
                if (otherCals < 0) otherCals = 0;

                return {
                    dateStr: format(d.date, 'MMM dd'),
                    Protein: proteinCals,
                    Carbs: carbsCals,
                    Fats: fatCals,
                    Other: otherCals,
                    total: d.calories
                };
            });
    }, [data, daysRange]);

    return (
        <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Caloric Intake (Macros)</h3>
                <select 
                    value={daysRange} 
                    onChange={e => setDaysRange(parseInt(e.target.value))}
                    style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px' }}
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 2 Weeks</option>
                    <option value={28}>Last 4 Weeks</option>
                    <option value={60}>Last 2 Months</option>
                </select>
            </div>

            <div className="chart-container" style={{ width: '100%', height: 400, minHeight: 400 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="var(--text-secondary)" tick={<CustomXAxisTick chartData={chartData} />} />
                        <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                        <Tooltip 
                            formatter={(value: any, name: any) => [`${Math.round(Number(value) || 0)} kcal`, name]}
                            labelStyle={{ color: 'var(--text-primary)' }}
                            contentStyle={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                        />
                        <Legend 
                            content={() => (
                                <ul style={{ listStyle: 'none', display: 'flex', justifyContent: 'center', gap: '20px', padding: '20px 0 0 0', margin: 0 }}>
                                    {[
                                        { value: 'Protein', color: 'var(--chart-protein)' },
                                        { value: 'Carbs', color: 'var(--chart-carbs)' },
                                        { value: 'Fats', color: 'var(--chart-fat)' },
                                        { value: 'Other', color: 'var(--chart-other)' }
                                    ].map((entry, index) => (
                                        <li key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '14px' }}>
                                            <div style={{ width: '14px', height: '14px', backgroundColor: entry.color, borderRadius: '2px' }} />
                                            {entry.value}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        />
                        <Bar dataKey="Protein" stackId="a" fill="var(--chart-protein)" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Carbs" stackId="a" fill="var(--chart-carbs)" />
                        <Bar dataKey="Fats" stackId="a" fill="var(--chart-fat)" />
                        <Bar dataKey="Other" stackId="a" fill="var(--chart-other)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
