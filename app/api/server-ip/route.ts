// Keystone IP Discovery API Route for Vercel
// File: app/api/server-ip/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get IP discovery services
    const ipServices = [
      'https://ifconfig.me/ip',
      'https://ipinfo.io/ip',
      'https://api.ipify.org',
      'https://checkip.amazonaws.com'
    ];

    let serverIP = null;
    let service = null;
    let attempts = [];

    // Try each service
    for (const serviceUrl of ipServices) {
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
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        continue;
      }
    }

    if (!serverIP) {
      return NextResponse.json({
        error: 'Unable to determine server IP from any service',
        attempts,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Get Vercel-specific information
    const vercelInfo = {
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown',
      environment: process.env.VERCEL_ENV || 'unknown',
      deployment: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
    };

    // Get request headers for additional context
    const requestInfo = {
      userAgent: request.headers.get('user-agent') || 'unknown',
      cfRay: request.headers.get('cf-ray') || null,
      cfConnectingIp: request.headers.get('cf-connecting-ip') || null,
      xForwardedFor: request.headers.get('x-forwarded-for') || null,
      xRealIp: request.headers.get('x-real-ip') || null
    };

    const serverInfo = {
      serverIP,
      discoveredVia: service,
      timestamp: new Date().toISOString(),
      vercel: vercelInfo,
      request: requestInfo,
      attempts,
      keystoneRegistration: {
        ipToRegister: serverIP,
        environment: vercelInfo.environment === 'production' ? 'production' : 'development',
        notes: [
          'Register this IP with Keystone Automotive',
          `Use ${vercelInfo.environment === 'production' ? 'production' : 'development'} security key`,
          'Vercel functions run on AWS infrastructure',
          'IP may vary within AWS IP ranges'
        ]
      }
    };

    return NextResponse.json(serverInfo, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Server IP discovery failed:', error);
    
    return NextResponse.json({
      error: 'Server IP discovery failed',
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

