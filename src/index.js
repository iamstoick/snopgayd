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
          redirect: "follow",
        });

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        const rawHeaders = {};
        response.headers.forEach((v, k) => {
          rawHeaders[k] = v;
        });

        // Check the 'server' header
        const serverHeader = rawHeaders["server"] || "";

        const headers = {};
        for (const [key, value] of Object.entries(rawHeaders)) {
          // Strip cf-* headers only if server is NOT Cloudflare
          if (
            serverHeader.toLowerCase() !== "cloudflare" &&
            (key.startsWith("cf-") || key === "report-to" || key === "nel")
          ) {
            continue;
          }
          headers[key] = value;
        }

        const body = await response.text();

        return new Response(JSON.stringify({
          url: targetUrl,
          finalUrl: response.url,
          redirected: response.redirected,
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
