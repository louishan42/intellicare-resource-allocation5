/**
 * Extract client IP and user-agent from request.
 * Handles proxies (X-Forwarded-For, X-Real-IP).
 */
export function getRequestContext(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "";
  const userAgent = req.headers["user-agent"] || "";
  const deviceHash = simpleDeviceHash(userAgent);
  return { ip, userAgent, deviceHash };
}

function simpleDeviceHash(ua) {
  if (!ua) return "";
  const str = ua.slice(0, 200);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(Math.abs(h));
}
