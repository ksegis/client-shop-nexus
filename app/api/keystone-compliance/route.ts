// Keystone Compliance Validation API Route for Vercel
// File: app/api/keystone-compliance/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface KeystoneConfig {
  accountNumber: string;
  securityKey: string;
  environment: 'development' | 'production';
}

export async function GET(request: NextRequest) {
  try {
    // Get current server IP
    const serverIPResponse = await fetch(`${request.nextUrl.origin}/api/server-ip`);
    const serverIPData = await serverIPResponse.json();
    
    if (!serverIPData.serverIP) {
      throw new Error('Unable to determine server IP');
    }

    const currentIP = serverIPData.serverIP;
    
    // Get Keystone configuration from environment
    const keystoneConfig: KeystoneConfig = {
      accountNumber: process.env.KEYSTONE_ACCOUNT_NUMBER || '',
      securityKey: process.env.VERCEL_ENV === 'production' 
        ? process.env.KEYSTONE_PRODUCTION_KEY || ''
        : process.env.KEYSTONE_DEVELOPMENT_KEY || '',
      environment: process.env.VERCEL_ENV === 'production' ? 'production' : 'development'
    };

    // Validate configuration
    const configurationIssues = [];
    if (!keystoneConfig.accountNumber) {
      configurationIssues.push('KEYSTONE_ACCOUNT_NUMBER environment variable not set');
    }
    if (!keystoneConfig.securityKey) {
      configurationIssues.push(`KEYSTONE_${keystoneConfig.environment.toUpperCase()}_KEY environment variable not set`);
    }

    // Prepare compliance report
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
        'Test connectivity using Keystone UtilityReportMyIP function',
        'Validate IP registration using Keystone UtilityReportApprovedIPs function'
      ],
      keystoneUtilityFunctions: {
        reportMyIP: 'UtilityReportMyIP',
        reportApprovedIPs: 'UtilityReportApprovedIPs',
        reportApprovedMethods: 'UtilityReportApprovedMethods'
      },
      vercelSpecificNotes: [
        'Vercel functions run on AWS infrastructure',
        'IP addresses come from AWS IP ranges',
        'Functions may use different IPs within the same range',
        'Consider registering AWS IP ranges with Keystone if individual IP registration is insufficient'
      ]
    };

    // If configuration is complete, we could test Keystone connectivity here
    if (configurationIssues.length === 0) {
      try {
        // This would be where you'd call Keystone's UtilityReportMyIP
        // const keystoneIP = await callKeystoneUtilityReportMyIP(keystoneConfig);
        // complianceReport.keystoneValidation = { ... };
        
        complianceReport.nextSteps.unshift('Configuration complete - ready to test Keystone connectivity');
      } catch (error) {
        complianceReport.configurationIssues.push(`Keystone connectivity test failed: ${error}`);
      }
    }

    return NextResponse.json(complianceReport, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Keystone compliance check failed:', error);
    
    return NextResponse.json({
      error: 'Keystone compliance check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

// Helper function for future Keystone API integration
async function callKeystoneUtilityReportMyIP(config: KeystoneConfig): Promise<string> {
  // This would implement the actual Keystone API call
  // For now, it's a placeholder
  throw new Error('Keystone API integration not yet implemented');
}

