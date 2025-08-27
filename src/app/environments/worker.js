// Cloudflare Worker script
export default {
  async fetch(request, env, ctx) {
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, Referer, Origin',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);

      // Extract the path after /api/leetcode/
      const pathMatch = url.pathname.match(/^\/api\/leetcode(.*)$/);
      if (!pathMatch) {
        return new Response('Invalid path', { status: 400, headers: corsHeaders });
      }

      const leetcodePath = pathMatch[1];
      const leetcodeUrl = `https://leetcode.com${leetcodePath}`;

      // Create headers for LeetCode request
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set(
        'User-Agent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      headers.set('Referer', 'https://leetcode.com/');
      headers.set('Origin', 'https://leetcode.com');
      headers.set('Accept', 'application/json, text/plain, */*');
      headers.set('Accept-Language', 'en-US,en;q=0.9');
      headers.set('Accept-Encoding', 'gzip, deflate, br');
      headers.set('Connection', 'keep-alive');
      headers.set('Sec-Fetch-Dest', 'empty');
      headers.set('Sec-Fetch-Mode', 'cors');
      headers.set('Sec-Fetch-Site', 'same-origin');

      // Forward the request to LeetCode
      const leetcodeRequest = new Request(leetcodeUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' ? await request.text() : null,
      });

      console.log(`Proxying to: ${leetcodeUrl}`);

      const response = await fetch(leetcodeRequest);

      // Get response body
      const responseBody = await response.text();

      console.log(`Response status: ${response.status}`);
      console.log(`Response body length: ${responseBody.length}`);

      // Create response with CORS headers
      const proxyResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...corsHeaders,
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
        },
      });

      return proxyResponse;
    } catch (error) {
      console.error('Proxy error:', error);

      return new Response(
        JSON.stringify({
          error: 'Proxy error',
          message: error.message,
          details: 'Failed to fetch from LeetCode API',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};
