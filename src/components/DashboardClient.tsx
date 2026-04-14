'use client';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import WeightChart from './WeightChart';
import FoodHistogram from './FoodHistogram';

function parseFatSecretDate(dateInt: string) {
    const d = new Date(parseInt(dateInt) * 24 * 60 * 60 * 1000);
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}

function processArraySafe(dataObj: any) {
    if (!dataObj?.month?.day) return [];
    return Array.isArray(dataObj.month.day) ? dataObj.month.day : [dataObj.month.day];
}

export default function DashboardClient({ weightData1, weightData2, foodData1, foodData2, lastFetchTime }: { weightData1: any, weightData2: any, foodData1: any, foodData2: any, lastFetchTime: string }) {
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const pullData = async () => {
        setIsRefreshing(true);
        router.refresh(); // Automatically re-fetches the Server Component and passes new props down
        setTimeout(() => setIsRefreshing(false), 1000); // give it a min spin time
    };

    const combinedWeight = [...processArraySafe(weightData1), ...processArraySafe(weightData2)];
    const weightMap = new Map<string, { date: Date, weight: number }>();
    combinedWeight.forEach((d: any) => {
        const weight = Math.round(parseFloat(d.weight_kg) * 2.20462 * 10) / 10;
        const existing = weightMap.get(d.date_int);
        if (!existing || weight < existing.weight) {
            weightMap.set(d.date_int, {
                date: parseFatSecretDate(d.date_int),
                weight
            });
        }
    });
    const weightData = Array.from(weightMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    const combinedFood = [...processArraySafe(foodData1), ...processArraySafe(foodData2)];
    const foodData = combinedFood.map((d: any) => ({
        date: parseFatSecretDate(d.date_int),
        calories: parseFloat(d.calories || 0),
        protein: parseFloat(d.protein || 0),
        carbs: parseFloat(d.carbohydrate || 0),
        fat: parseFloat(d.fat || 0)
    }));

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={pullData} disabled={isRefreshing}>
                    <RefreshCw size={18} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                    {isRefreshing ? 'Pulling Data...' : 'Pull New Data'}
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <WeightChart data={weightData} />
                <FoodHistogram data={foodData} />
            </div>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '32px' }}>
                Last pulled: {lastFetchTime}
            </div>
        </div>
    );
}
