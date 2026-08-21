const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = function(app) {
  // 1. Gentle Request Filtering
  const suspiciousPatterns = [
    /<script>/i,
    /union select/i,
    /(\.\.\/)+/i,
    /\/etc\/passwd/i
  ];

  app.use((req, res, next) => {
    for (let pattern of suspiciousPatterns) {
      if (pattern.test(req.originalUrl)) {
        console.log(`Blocked suspicious request from ${req.ip}: ${req.originalUrl}`);
        return res.status(403).send('Request blocked');
      }
    }
    next();
  });

  // 2. Moderate Rate Limiting
  const rateLimitMap = {};
  const RATE_LIMIT = 200;
  const WINDOW = 1000 * 60 * 60; // 1 hour

  app.use((req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    if (!rateLimitMap[ip]) rateLimitMap[ip] = [];
    rateLimitMap[ip] = rateLimitMap[ip].filter(t => now - t < WINDOW);
    if (rateLimitMap[ip].length >= RATE_LIMIT) {
      return res.status(429).send('Too many requests, please wait a bit');
    }
    rateLimitMap[ip].push(now);
    next();
  });

  // 3. Auto-update threat list daily
  const THREATS_FILE = path.join(__dirname, 'threats.json');
  async function updateThreatSignatures() {
    try {
      const response = await axios.get('https://example.com/latest-threats.json');
      fs.writeFileSync(THREATS_FILE, JSON.stringify(response.data, null, 2));
    } catch (e) {
      console.error('Threat update failed:', e.message);
    }
  }
  updateThreatSignatures();
  setInterval(updateThreatSignatures, 24 * 60 * 60 * 1000);

  // 4. Block known malicious IPs
  let blockedIPs = [];
  function loadBlockedIPs() {
    if (fs.existsSync(THREATS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(THREATS_FILE));
        blockedIPs = data.blockedIPs || [];
      } catch (err) {        console.error('Error reading threats file:', err);
      }
    }
  }
  loadBlockedIPs();
  setInterval(loadBlockedIPs, 24 * 60 * 60 * 1000);

  app.use((req, res, next) => {
    if (blockedIPs.includes(req.ip)) {
      console.log(`Blocked IP: ${req.ip}`);
      return res.status(403).send('Access restricted');
    }
    next();
  });

  console.log('Gentle security module loaded: filtering, rate limiting, IP blocking.');
};
