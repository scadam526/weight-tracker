import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/fatsecret';
import { setSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const oauth_token = url.searchParams.get('oauth_token');
    const oauth_verifier = url.searchParams.get('oauth_verifier');

    if (!oauth_token || !oauth_verifier) {
        return NextResponse.json({ error: 'Missing token or verifier' }, { status: 400 });
    }

    const cookiesStore = await cookies();
    const oauth_token_secret = cookiesStore.get('oauth_token_secret')?.value;

    if (!oauth_token_secret) {
        return NextResponse.redirect(new URL('/?error=timeout', request.url));
    }

    try {
        const tokens = await getAccessToken(oauth_token, oauth_token_secret, oauth_verifier);
        await setSession(tokens);
        cookiesStore.delete('oauth_token_secret');

        return NextResponse.redirect(new URL('/', request.url));
    } catch (e: any) {
        return NextResponse.redirect(new URL('/?error=failed_exchange', request.url));
    }
}
