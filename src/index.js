export default {
    async fetch(request) {
      const url = new URL(request.url);
  
      if (url.pathname === "/proxy") {
        const targetUrl = url.searchParams.get("url");
  
        if (!targetUrl) {
          return new Response("Missing ?url param", { status: 400 });
        }
  
        const startTime = performance.now();
        try {
          const response = await fetch(targetUrl, {
            headers: {
              "Fastly-Debug": "1",
              "Pantheon-Debug": "1",
            },
          });
  
          const endTime = performance.now();
          const responseTime = endTime - startTime;
  
          const headers = {};
          response.headers.forEach((v, k) => {
            headers[k] = v;
          });
  
          const body = await response.text();
  
          return new Response(JSON.stringify({
            url: targetUrl,
            status: response.status,
            responseTime: responseTime.toFixed(2),
            headers,
            body,
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          });
  
        } catch (err) {
          return new Response(JSON.stringify({
            error: "Failed to fetch target",
            details: err.message,
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }
  
      return new Response("Not Found", { status: 404 });
    }
  }
  