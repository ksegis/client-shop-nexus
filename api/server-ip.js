export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ipServices = [
      'https://ifconfig.me/ip',
      'https://ipinfo.io/ip',
      'https://api.ipify.org',
      'https://checkip.amazonaws.com'
    ];

    let serverIP = null;
    let service = null;
    let attempts = [];

    for (const serviceUrl of ipServices ) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(serviceUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'KeystoneIPDiscovery/1.0'
          }
        });

        clearTimeout(timeoutId);
        
        if (response.ok) {
          serverIP = (await response.text()).trim();
          service = serviceUrl;
          attempts.push({ service: serviceUrl, success: true, ip: serverIP });
          break;
        } else {
          attempts.push({ service: serviceUrl, success: false, error: `HTTP ${response.status}` });
        }
      } catch (error) {
        attempts.push({ 
          service: serviceUrl, 
          success: false, 
          error: error.message || 'Unknown error' 
        });
        continue;
      }
    }

    if (!serverIP) {
      return res.status(500).json({
        error: 'Unable to determine server IP from any service',
        attempts,
        timestamp: new Date().toISOString()
      });
    }

    const vercelInfo = {
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown',
      environment: process.env.VERCEL_ENV || 'unknown'
    };

    const serverInfo = {
      serverIP,
      discoveredVia: service,
      timestamp: new Date().toISOString(),
      vercel: vercelInfo,
      attempts,
      keystoneRegistration: {
        ipToRegister: serverIP,
        environment: vercelInfo.environment === 'production' ? 'production' : 'development',
        notes: [
          'Register this IP with Keystone Automotive',
          `Use ${vercelInfo.environment === 'production' ? 'production' : 'development'} security key`,
          'Vercel functions run on AWS infrastructure'
        ]
      }
    };

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json(serverInfo);

  } catch (error) {
    console.error('Server IP discovery failed:', error);
    
    return res.status(500).json({
      error: 'Server IP discovery failed',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
