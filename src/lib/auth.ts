'use server';

import { GoogleAuth } from 'google-auth-library';

export async function getGoogleAccessToken(): Promise<string> {
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    if (!accessTokenResponse || !accessTokenResponse.token) {
        throw new Error('Failed to get access token');
    }
    return accessTokenResponse.token;
}
