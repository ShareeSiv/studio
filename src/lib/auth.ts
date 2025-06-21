'use server';

// This is a direct implementation to avoid a dependency on google-auth-library,
// which seems to cause issues with the server startup.
export async function getGoogleAccessToken(): Promise<string> {
    const metadataServerUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token?scopes=https://www.googleapis.com/auth/cloud-platform';
    
    try {
        const response = await fetch(metadataServerUrl, {
            headers: {
                'Metadata-Flavor': 'Google',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get access token from metadata server: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        if (!data.access_token) {
            throw new Error('Access token not found in metadata server response.');
        }

        return data.access_token;
    } catch (error) {
        console.error('Error fetching access token from metadata server:', error);
        // Fallback or rethrow, depending on desired behavior.
        // For now, let's re-throw to make it clear that auth failed.
        throw new Error(`Could not obtain Google Cloud access token. Original error: ${error}`);
    }
}
