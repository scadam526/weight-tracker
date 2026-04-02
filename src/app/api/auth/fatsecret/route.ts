import { NextResponse } from 'next/server';
import { getRequestToken, getAuthorizationUrl } from '@/lib/fatsecret';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const origin = new URL(request.url).origin;
    const callbackUrl = `${origin}/api/auth/callback`;
    try {
        const { oauth_token, oauth_token_secret } = await getRequestToken(callbackUrl);

        const cookiesStore = await cookies();
        cookiesStore.set('oauth_token_secret', oauth_token_secret, { httpOnly: true, path: '/', maxAge: 60 * 10 });

        const authUrl = getAuthorizationUrl(oauth_token);
        return NextResponse.redirect(authUrl);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
