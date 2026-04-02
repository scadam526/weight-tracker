import { NextResponse } from 'next/server';
import { fetchFatSecretAPI } from '@/lib/fatsecret';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
    const session = await getSession();
    if (!session || !session.fatsecretToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { method, ...apiParams } = body;

        const data = await fetchFatSecretAPI(
            method,
            apiParams,
            session.fatsecretToken.oauth_token,
            session.fatsecretToken.oauth_token_secret
        );
        return NextResponse.json(data);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
