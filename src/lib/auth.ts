'use server';

// This is a direct implementation to avoid a dependency on google-auth-library,
// which seems to cause issues with the server startup.
export async function getGoogleAccessToken(): Promise<string> {
    const metadataServerUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token?scopes=https://www.googleapis.com/auth/cloud-platform';
    
    let lastError: Error | null = null;

    // Retry logic for transient server errors from the metadata service.
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetch(metadataServerUrl, {
                headers: {
                    'Metadata-Flavor': 'Google',
                },
                cache: 'no-store',
            });

            if (!response.ok) {
                const errorText = await response.text();
                // For client errors (4xx), don't retry as it's likely a configuration issue.
                if (response.status >= 400 && response.status < 500) {
                    throw new Error(`Failed to get access token from metadata server (client error): ${response.status} ${response.statusText} - ${errorText}`);
                }
                // For server errors (5xx), we will retry.
                throw new Error(`Failed to get access token from metadata server (server error, attempt ${attempt}): ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            if (!data.access_token) {
                throw new Error('Access token not found in metadata server response.');
            }

            return data.access_token; // Success!
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < 3) {
                // Wait with exponential backoff before retrying
                const delay = 100 * Math.pow(2, attempt - 1);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
    
    const finalErrorMessage = `Could not obtain Google Cloud access token after multiple retries. Original error: ${lastError?.message || 'Unknown error'}`;
    console.error('Final error fetching access token from metadata server:', lastError);
    // For now, let's re-throw to make it clear that auth failed.
    throw new Error(finalErrorMessage);
}
