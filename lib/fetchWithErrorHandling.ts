/**
 * Helper function to safely fetch JSON with error handling
 * Handles cases where API routes return HTML error pages instead of JSON
 */
export async function fetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; response: Response }> {
  try {
    const response = await fetch(url, options);
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      return {
        error: `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`,
        response,
      };
    }

    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        data,
        response,
      };
    }

    return { data, response };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      response: new Response(),
    };
  }
}

