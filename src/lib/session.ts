import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET || 'a-very-secure-secret-key-that-should-be-in-env';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch {
        return null;
    }
}

export async function setSession(tokenData: { oauth_token: string; oauth_token_secret: string }) {
    const session = await encrypt({ fatsecretToken: tokenData, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
    const cookiesStore = await cookies();
    cookiesStore.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
}

export async function getSession() {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get('session')?.value;
    if (!sessionCookie) return null;
    return await decrypt(sessionCookie);
}

export async function clearSession() {
    const cookiesStore = await cookies();
    cookiesStore.delete('session');
}
