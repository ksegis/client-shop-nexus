export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight OK' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug: Check environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_TOKEN;
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl ? supabaseUrl.length : 0,
      keyLength: supabaseKey ? supabaseKey.length : 0
    });

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }

    // Debug: Check request body
    const { csvData, filename, userId } = req.body;
    
    console.log('Request check:', {
      hasCsvData: !!csvData,
      hasFilename: !!filename,
      csvDataLength: csvData ? csvData.length : 0,
      bodyKeys: Object.keys(req.body || {})
    });

    if (!csvData || !filename) {
      return res.status(400).json({ 
        error: 'CSV data and filename are required',
        received: {
          hasCsvData: !!csvData,
          hasFilename: !!filename,
          bodyKeys: Object.keys(req.body || {})
        }
      });
    }

    // For now, just return success without processing
    return res.status(200).json({
      success: true,
      message: 'Debug API working',
      environmentOK: true,
      requestOK: true,
      csvDataLength: csvData.length,
      filename: filename
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack
    });
  }
}

