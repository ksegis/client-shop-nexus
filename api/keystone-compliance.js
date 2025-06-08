export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get server IP from our other function
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const serverIPUrl = `${protocol}://${host}/api/server-ip`;
    
    const serverIPResponse = await fetch(serverIPUrl );
    const serverIPData = await serverIPResponse.json();
    
    if (!serverIPData.serverIP) {
      throw new Error('Unable to determine server IP');
    }

    const currentIP = serverIPData.serverIP;
    
    const keystoneConfig = {
      accountNumber: process.env.KEYSTONE_ACCOUNT_NUMBER || '',
      securityKey: process.env.VERCEL_ENV === 'production' 
        ? process.env.KEYSTONE_PRODUCTION_KEY || ''
        : process.env.KEYSTONE_DEVELOPMENT_KEY || '',
      environment: process.env.VERCEL_ENV === 'production' ? 'production' : 'development'
    };

    const configurationIssues = [];
    if (!keystoneConfig.accountNumber) {
      configurationIssues.push('KEYSTONE_ACCOUNT_NUMBER environment variable not set');
    }
    if (!keystoneConfig.securityKey) {
      configurationIssues.push(`KEYSTONE_${keystoneConfig.environment.toUpperCase()}_KEY environment variable not set`);
    }

    const complianceReport = {
      timestamp: new Date().toISOString(),
      environment: keystoneConfig.environment,
      serverIP: currentIP,
      vercelRegion: process.env.VERCEL_REGION || 'unknown',
      configuration: {
        accountNumber: keystoneConfig.accountNumber ? '***configured***' : 'missing',
        securityKey: keystoneConfig.securityKey ? '***configured***' : 'missing',
        environment: keystoneConfig.environment
      },
      configurationIssues,
      complianceStatus: {
        ipDiscovered: true,
        configurationComplete: configurationIssues.length === 0,
        readyForKeystone: configurationIssues.length === 0
      },
      nextSteps: [
        `Register IP ${currentIP} with Keystone for ${keystoneConfig.environment} environment`,
        'Use the appropriate security key for this environment',
        'Test connectivity using Keystone UtilityReportMyIP function'
      ]
    };

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json(complianceReport);

  } catch (error) {
    console.error('Keystone compliance check failed:', error);
    
    return res.status(500).json({
      error: 'Keystone compliance check failed',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
