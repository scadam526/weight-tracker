'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, differenceInDays } from 'date-fns';
import { useState, useMemo } from 'react';

type WeightEntry = { date: Date; weight: number };

export default function WeightChart({ data }: { data: WeightEntry[] }) {
    const [daysRange, setDaysRange] = useState(7);

    const filteredData = useMemo(() => {
        if (daysRange === 0) {
            return [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
        }
        const cutoff = subDays(new Date(), daysRange);
        return data.filter(d => d.date >= cutoff).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [data, daysRange]);

    const { regressionSlope, trendData, daysUntilTarget, trendWeeklySlope } = useMemo(() => {
        if (filteredData.length < 2) return { regressionSlope: 0, trendData: [], daysUntilTarget: null, trendWeeklySlope: 0 };

        const pts = filteredData.map((d, index) => ({
            x: index,
            y: d.weight,
        }));

        const xMean = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
        const yMean = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;

        let num = 0;
        let den = 0;
        for (const p of pts) {
            num += (p.x - xMean) * (p.y - yMean);
            den += (p.x - xMean) ** 2;
        }

        const slope = den === 0 ? 0 : num / den;
        const intercept = yMean - slope * xMean;

        const trendData = pts.map(p => ({
            trend: p.x * slope + intercept
        }));

        const lastWeight = filteredData[filteredData.length - 1].weight;
        const firstDate = filteredData[0].date;
        const lastDate = filteredData[filteredData.length - 1].date;
        const totalDaysSpan = differenceInDays(lastDate, firstDate);
        const avgDaysPerPoint = filteredData.length > 1 ? totalDaysSpan / (filteredData.length - 1) : 1;
        
        const trendWeeklySlope = avgDaysPerPoint > 0 ? (slope / avgDaysPerPoint) * 7 : 0;

        let daysUntilTarget: number | null = null;
        if (slope < 0 && lastWeight > 175) {
            const currentX = pts[pts.length - 1].x;
            const targetX = (175 - intercept) / slope;
            const pointsRemaining = Math.max(0, targetX - currentX);
            
            daysUntilTarget = pointsRemaining * avgDaysPerPoint;
        }

        return { regressionSlope: slope, trendData, daysUntilTarget, trendWeeklySlope };
    }, [filteredData]);

    const { avgWeeklyChange, sevenDayTrend, currentWeight, totalWeightLost } = useMemo(() => {
        const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

        if (sortedData.length < 2) return { avgWeeklyChange: 0, sevenDayTrend: 0, currentWeight: sortedData.length > 0 ? sortedData[sortedData.length - 1].weight : 0, totalWeightLost: 0 };
        
        const last7Days = sortedData.filter(d => differenceInDays(new Date(), d.date) <= 7);
        let sevenDayTrend = 0;
        if (last7Days.length >= 2) {
            sevenDayTrend = last7Days[last7Days.length - 1].weight - last7Days[0].weight;
        }

        const weeks = new Map<string, number[]>();
        sortedData.forEach(d => {
            const wStart = format(startOfWeek(d.date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (!weeks.has(wStart)) weeks.set(wStart, []);
            weeks.get(wStart)!.push(d.weight);
        });
        
        const weekEntries = Array.from(weeks.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
        const parsedWeeks = weekEntries.map(([dateStr, wData]) => ({
            date: new Date(dateStr),
            avg: wData.reduce((a, b) => a + b, 0) / wData.length
        }));

        let avgWeeklyChange = 0;
        if (parsedWeeks.length >= 2) {
            const firstWeek = parsedWeeks[0];
            const lastWeek = parsedWeeks[parsedWeeks.length - 1];
            const totalChange = lastWeek.avg - firstWeek.avg;
            const diffWeeks = Math.round(differenceInDays(lastWeek.date, firstWeek.date) / 7);
            
            if (diffWeeks > 0) {
                avgWeeklyChange = totalChange / diffWeeks;
            }
        }

        const currentWeight = sortedData[sortedData.length - 1].weight;
        const totalWeightLost = sortedData[0].weight - currentWeight;

        return { avgWeeklyChange, sevenDayTrend, currentWeight, totalWeightLost };
    }, [data]);

    const stillToGo = currentWeight > 175 ? currentWeight - 175 : 0;

    const chartData = filteredData.map((d, i) => ({
        dateStr: format(d.date, 'MMM dd'),
        weight: d.weight,
        trend: trendData[i]?.trend !== undefined ? Number(trendData[i].trend.toFixed(1)) : undefined
    }));

    // Dynamic Y-Axis domains to make trend visibly clear
    const minWeight = chartData.length > 0 ? Math.min(...chartData.map(d => d.weight)) : 0;
    const maxWeight = chartData.length > 0 ? Math.max(...chartData.map(d => d.weight)) : 100;

    let targetEstStr = 'N/A';
    let targetDateStr = 'N/A';
    if (daysUntilTarget !== null) {
        let w = Math.floor(daysUntilTarget / 7);
        let d = Math.round(daysUntilTarget % 7);
        if (d === 7) {
            w += 1;
            d = 0;
        }
        if (w > 0 && d > 0) targetEstStr = `${w}w ${d}d`;
        else if (w > 0) targetEstStr = `${w}w`;
        else targetEstStr = `${d}d`;

        if (filteredData.length > 0) {
            const lastDate = filteredData[filteredData.length - 1].date;
            const targetDate = new Date(lastDate.getTime() + daysUntilTarget * 24 * 60 * 60 * 1000);
            targetDateStr = format(targetDate, 'MMM dd');
        }
    }

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
                    <option value={0}>All Time</option>
                </select>
            </div>
            
            <div className="flex-row" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="metric-card" style={{ flex: '1 1 min-content' }}>
                    <div className="metric-label">7-Day Trend</div>
                    <div className="metric-value" style={{ color: sevenDayTrend > 0 ? 'var(--chart-protein)' : 'var(--chart-other)' }}>
                        {sevenDayTrend > 0 ? '+' : ''}{sevenDayTrend.toFixed(1)} lbs
                    </div>
                </div>
                <div className="metric-card" style={{ flex: '1 1 min-content' }}>
                    <div className="metric-label">Total Lost</div>
                    <div className="metric-value" style={{ color: totalWeightLost > 0 ? 'var(--chart-protein)' : 'var(--chart-other)' }}>
                        {totalWeightLost.toFixed(1)} lbs
                    </div>
                </div>
                <div className="metric-card" style={{ flex: '1 1 min-content' }}>
                    <div className="metric-label">Avg Weekly Change</div>
                    <div className="metric-value" style={{ color: avgWeeklyChange > 0 ? 'var(--chart-protein)' : 'var(--chart-other)' }}>
                        {avgWeeklyChange > 0 ? '+' : ''}{avgWeeklyChange.toFixed(2)} lbs/wk
                    </div>
                </div>
                <div className="metric-card" style={{ flex: '1 1 min-content' }}>
                    <div className="metric-label">Left to go</div>
                    <div className="metric-value" style={{ color: 'var(--text-secondary)' }}>
                        {stillToGo > 0 ? stillToGo.toFixed(1) : 0} lbs
                    </div>
                </div>
                <div className="metric-card" style={{ flex: '1 1 min-content' }}>
                    <div className="metric-label">Target Est.</div>
                    <div className="metric-value" style={{ color: daysUntilTarget !== null ? 'var(--chart-protein)' : 'var(--text-secondary)' }}>
                        {targetEstStr}
                    </div>
                </div>
                <div className="metric-card" style={{ flex: '1 1 min-content' }}>
                    <div className="metric-label">Target Date</div>
                    <div className="metric-value" style={{ color: daysUntilTarget !== null ? 'var(--chart-protein)' : 'var(--text-secondary)' }}>
                        {targetDateStr}
                    </div>
                </div>
                <div className="metric-card" style={{ flex: '1 1 min-content' }}>
                    <div className="metric-label">Trend Rate</div>
                    <div className="metric-value" style={{ color: trendWeeklySlope > 0 ? 'var(--chart-protein)' : 'var(--chart-other)' }}>
                        {trendWeeklySlope > 0 ? '+' : ''}{trendWeeklySlope.toFixed(2)} lbs/wk
                    </div>
                </div>
            </div>

            <div className="chart-container" style={{ width: '100%', height: 400, minHeight: 400 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <LineChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="dateStr" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickMargin={10} />
                        <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} domain={[Math.floor(minWeight - 1), Math.ceil(maxWeight + 1)]} />
                        <Tooltip />
                        <Line type="linear" dataKey="trend" stroke="var(--chart-other)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                        <Line type="monotone" dataKey="weight" stroke="var(--accent-primary)" strokeWidth={4} dot={{ r: 4, fill: 'var(--bg-base)', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
