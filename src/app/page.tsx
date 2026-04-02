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
        const thisMonthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 15));
        const prevMonthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 15));

        const todayEpoch = Math.floor(thisMonthDate.getTime() / 86400000);
        // Ensure we cover the prior month fully
        const lastMonthEpoch = Math.floor(prevMonthDate.getTime() / 86400000);

        // Weight
        const weightData1 = await fetchFatSecretAPI('weights.get_month', { date: todayEpoch.toString() }, session.fatsecretToken.oauth_token, session.fatsecretToken.oauth_token_secret);
        const weightData2 = await fetchFatSecretAPI('weights.get_month', { date: lastMonthEpoch.toString() }, session.fatsecretToken.oauth_token, session.fatsecretToken.oauth_token_secret);

        // Foods
        const foodData1 = await fetchFatSecretAPI('food_entries.get_month', { date: todayEpoch.toString() }, session.fatsecretToken.oauth_token, session.fatsecretToken.oauth_token_secret);
        const foodData2 = await fetchFatSecretAPI('food_entries.get_month', { date: lastMonthEpoch.toString() }, session.fatsecretToken.oauth_token, session.fatsecretToken.oauth_token_secret);

        const fetchTime = new Date().toLocaleString();

        return (
            <div className="layout-container">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    body { background-image: radial-gradient(circle at 50% -20%, #2e1065, var(--bg-base) 80%); }
                `}} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <h1 className="page-title">FatSecret Dashboard</h1>
                </div>
                <DashboardClient
                    weightData1={weightData1}
                    weightData2={weightData2}
                    foodData1={foodData1}
                    foodData2={foodData2}
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
