import crypto from 'crypto';

const FATSECRET_CLIENT_ID = process.env.FATSECRET_CLIENT_ID || '';
const FATSECRET_CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET || '';

const API_BASE = 'https://platform.fatsecret.com/rest/server.api';
const OAUTH_REQUEST_TOKEN = 'https://authentication.fatsecret.com/oauth/request_token';
const OAUTH_AUTHORIZE = 'https://authentication.fatsecret.com/oauth/authorize';
const OAUTH_ACCESS_TOKEN = 'https://authentication.fatsecret.com/oauth/access_token';

function encodeRFC3986(str: string) {
    return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateSignature(httpMethod: string, url: string, params: Record<string, string>, tokenSecret: string = '') {
    const sortedKeys = Object.keys(params).sort();
    const normalizedParams = sortedKeys.map(k => `${encodeRFC3986(k)}=${encodeRFC3986(params[k])}`).join('&');
    const signatureBaseString = `${httpMethod}&${encodeRFC3986(url)}&${encodeRFC3986(normalizedParams)}`;
    const signingKey = `${encodeRFC3986(FATSECRET_CLIENT_SECRET)}&${encodeRFC3986(tokenSecret)}`;
    return crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
}

export async function getRequestToken(callbackUrl: string) {
    const params: Record<string, string> = {
        oauth_consumer_key: FATSECRET_CLIENT_ID,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_version: '1.0',
        oauth_callback: callbackUrl,
    };

    const signature = generateSignature('POST', OAUTH_REQUEST_TOKEN, params);
    params['oauth_signature'] = signature;

    const response = await fetch(OAUTH_REQUEST_TOKEN, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        },
        body: new URLSearchParams(params).toString()
    });

    if (!response.ok) throw new Error(`Failed to get request token: ${await response.text()}`);
    
    const responseText = await response.text();
    const urlParams = new URLSearchParams(responseText);
    return {
        oauth_token: urlParams.get('oauth_token')!,
        oauth_token_secret: urlParams.get('oauth_token_secret')!
    };
}

export function getAuthorizationUrl(oauth_token: string) {
    return `${OAUTH_AUTHORIZE}?oauth_token=${oauth_token}`;
}

export async function getAccessToken(oauth_token: string, oauth_token_secret: string, oauth_verifier: string) {
    const params: Record<string, string> = {
        oauth_consumer_key: FATSECRET_CLIENT_ID,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_version: '1.0',
        oauth_token: oauth_token,
        oauth_verifier: oauth_verifier,
    };

    const signature = generateSignature('POST', OAUTH_ACCESS_TOKEN, params, oauth_token_secret);
    params['oauth_signature'] = signature;

    const response = await fetch(OAUTH_ACCESS_TOKEN, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        },
        body: new URLSearchParams(params).toString()
    });

    if (!response.ok) throw new Error(`Failed to get access token: ${await response.text()}`);
    
    const responseText = await response.text();
    const urlParams = new URLSearchParams(responseText);
    return {
        oauth_token: urlParams.get('oauth_token')!,
        oauth_token_secret: urlParams.get('oauth_token_secret')!
    };
}

export async function fetchFatSecretAPI(
    method: string, 
    apiParams: Record<string, string>, 
    oauth_token: string, 
    oauth_token_secret: string
) {
    const params: Record<string, string> = {
        method: method,
        ...apiParams,
        oauth_consumer_key: FATSECRET_CLIENT_ID,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_version: '1.0',
        oauth_token: oauth_token,
        format: 'json',
    };

    const signature = generateSignature('POST', API_BASE, params, oauth_token_secret);
    params['oauth_signature'] = signature;

    const response = await fetch(API_BASE, {
        method: 'POST',
        cache: 'no-store',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        },
        body: new URLSearchParams(params).toString()
    });

    if (!response.ok) throw new Error(`FatSecret API Error: ${await response.text()}`);
    return await response.json();
}
