export function authRateLimit({ max = 10, windowMs = 15 * 60 * 1000, now = Date.now } = {}) {
  const requests = new Map();
  return (req, res, next) => {
    const time = now();
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    let entry = requests.get(key);
    if (!entry || entry.expires <= time) {
      if (requests.size >= 10000) requests.delete(requests.keys().next().value);
      entry = { count: 0, expires: time + windowMs };
      requests.set(key, entry);
    }
    if (++entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.expires - time) / 1000)));
      return res.status(429).json({ success: false, message: 'Too many attempts. Please try again later.' });
    }
    next();
  };
}
