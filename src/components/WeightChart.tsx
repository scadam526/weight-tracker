'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, differenceInDays } from 'date-fns';
import { useState, useMemo } from 'react';

type WeightEntry = { date: Date; weight: number };

export default function WeightChart({ data }: { data: WeightEntry[] }) {
    const [daysRange, setDaysRange] = useState(28);

    const filteredData = useMemo(() => {
        const cutoff = subDays(new Date(), daysRange);
        return data.filter(d => d.date >= cutoff).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [data, daysRange]);

    const { avgWeeklyChange, sevenDayTrend, currentWeight } = useMemo(() => {
        if (filteredData.length < 2) return { avgWeeklyChange: 0, sevenDayTrend: 0, currentWeight: data.length > 0 ? data[data.length - 1].weight : 0 };
        
        const last7Days = data.filter(d => differenceInDays(new Date(), d.date) <= 7).sort((a, b) => a.date.getTime() - b.date.getTime());
        let sevenDayTrend = 0;
        if (last7Days.length >= 2) {
            sevenDayTrend = last7Days[last7Days.length - 1].weight - last7Days[0].weight;
        }

        const weeks = new Map<string, number[]>();
        filteredData.forEach(d => {
            const wStart = format(startOfWeek(d.date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (!weeks.has(wStart)) weeks.set(wStart, []);
            weeks.get(wStart)!.push(d.weight);
        });
        
        const weekAvgs: number[] = [];
        Array.from(weeks.values()).forEach(wData => {
            if (wData.length > 0) weekAvgs.push(wData.reduce((a, b) => a + b, 0) / wData.length);
        });

        let totalChange = 0;
        let changeCount = 0;
        for (let i = 1; i < weekAvgs.length; i++) {
            totalChange += (weekAvgs[i] - weekAvgs[i - 1]);
            changeCount++;
        }
        const avgWeeklyChange = changeCount > 0 ? totalChange / changeCount : 0;

        const currentWeight = data.length > 0 ? data[data.length - 1].weight : 0;

        return { avgWeeklyChange, sevenDayTrend, currentWeight };
    }, [filteredData, data]);

    const stillToGo = currentWeight > 175 ? currentWeight - 175 : 0;

    const chartData = filteredData.map(d => ({
        dateStr: format(d.date, 'MMM dd'),
        weight: d.weight
    }));

    // Dynamic Y-Axis domains to make trend visibly clear
    const minWeight = chartData.length > 0 ? Math.min(...chartData.map(d => d.weight)) : 0;
    const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 100;

    return (
        <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Weight Tracking</h3>
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
            
            <div className="flex-row" style={{ marginBottom: '20px' }}>
                <div className="metric-card">
                    <div className="metric-label">7-Day Trend</div>
                    <div className="metric-value" style={{ color: sevenDayTrend > 0 ? 'var(--chart-protein)' : 'var(--chart-other)' }}>
                        {sevenDayTrend > 0 ? '+' : ''}{sevenDayTrend.toFixed(1)} lbs
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Avg Weekly Change</div>
                    <div className="metric-value" style={{ color: avgWeeklyChange > 0 ? 'var(--chart-protein)' : 'var(--chart-other)' }}>
                        {avgWeeklyChange > 0 ? '+' : ''}{avgWeeklyChange.toFixed(2)} lbs/wk
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-label">Still to go (Goal: 175 lbs)</div>
                    <div className="metric-value" style={{ color: 'var(--text-primary)' }}>
                        {stillToGo > 0 ? stillToGo.toFixed(1) : 0} lbs
                    </div>
                </div>
            </div>

            <div className="chart-container" style={{ width: '100%', height: 400, minHeight: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickMargin={10} />
                        <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} domain={[Math.floor(minWeight - 1), Math.ceil(maxWeight + 1)]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="var(--accent-primary)" strokeWidth={4} dot={{ r: 4, fill: 'var(--bg-base)', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
