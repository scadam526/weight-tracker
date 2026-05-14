import ConnectFatSecret from '@/components/ConnectFatSecret';
import { getSession } from '@/lib/session';
import { fetchFatSecretAPI } from '@/lib/fatsecret';
import DashboardClient from '@/components/DashboardClient';

export default async function Home() {
    const session = await getSession();
    if (!session || !session.fatsecretToken) {
        return <ConnectFatSecret />;
    }

    try {
        const now = new Date();
        const startYear = 2026;
        const startMonth = 2; // March is month index 2

        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const totalMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;

        const epochsToFetch: number[] = [];
        for (let i = 0; i < totalMonths; i++) {
            const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 15));
            epochsToFetch.push(Math.floor(d.getTime() / 86400000));
        }

        // Fetch up to 6 months of history
        const weightPromises = epochsToFetch.map(epoch => 
            fetchFatSecretAPI('weights.get_month', { date: epoch.toString() }, session.fatsecretToken.oauth_token, session.fatsecretToken.oauth_token_secret)
        );
        const foodPromises = epochsToFetch.map(epoch => 
            fetchFatSecretAPI('food_entries.get_month', { date: epoch.toString() }, session.fatsecretToken.oauth_token, session.fatsecretToken.oauth_token_secret)
        );

        const weightDataList = await Promise.all(weightPromises);
        const foodDataList = await Promise.all(foodPromises);

        const fetchTime = new Date().toLocaleString();

        return (
            <div className="layout-container">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    body { background-image: radial-gradient(circle at 50% -20%, #2e1065, var(--bg-base) 80%); }
                `}} />

                <DashboardClient
                    weightDataList={weightDataList}
                    foodDataList={foodDataList}
                    lastFetchTime={fetchTime}
                />
            </div>
        );
    } catch (e: any) {
        console.error(e);
        return (
            <div className="layout-container">
                <div className="glass-panel" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--chart-protein)' }}>Error fetching data</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>There was a problem retrieving your FatSecret data. Your token may have expired or is invalid.</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
                        {e.message}
                    </p>
                    <div style={{ marginTop: '24px' }}>
                        <ConnectFatSecret />
                    </div>
                </div>
            </div>
        );
    }
}
