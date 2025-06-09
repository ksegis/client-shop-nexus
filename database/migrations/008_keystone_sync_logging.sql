-- =====================================================
-- PHASE 1 - WEEK 2: KEYSTONE SYNC LOGGING SYSTEM
-- Create comprehensive logging system for Keystone API operations
-- =====================================================

-- Step 2.3: Create Keystone Sync Logs table
-- This table tracks all synchronization operations with Keystone
CREATE TABLE IF NOT EXISTS keystone_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL, -- Type of sync operation
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
      ELSE NULL 
    END
  ) STORED,
  
  -- Sync statistics
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  error_details JSONB,
  
  -- Sync details and metadata
  sync_details JSONB,
  triggered_by VARCHAR(50), -- 'manual', 'scheduled', 'api_call'
  user_id UUID, -- User who triggered manual sync
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint for user tracking
ALTER TABLE keystone_sync_logs 
ADD CONSTRAINT fk_keystone_sync_logs_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Add RLS policies for keystone_sync_logs
ALTER TABLE keystone_sync_logs ENABLE ROW LEVEL SECURITY;

-- Admin and shop users can read all sync logs
CREATE POLICY "Shop users can read keystone_sync_logs" ON keystone_sync_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'shop_manager', 'shop_user')
  )
);

-- Only admin users can modify sync logs
CREATE POLICY "Admin users can modify keystone_sync_logs" ON keystone_sync_logs 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add indexes for keystone_sync_logs
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_type ON keystone_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_status ON keystone_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_started ON keystone_sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_completed ON keystone_sync_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_triggered_by ON keystone_sync_logs(triggered_by);
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_user ON keystone_sync_logs(user_id);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_keystone_sync_logs_type_status ON keystone_sync_logs(sync_type, status);

-- Step 2.4: Create Keystone API Logs table
-- This table logs individual API calls for debugging and monitoring
CREATE TABLE IF NOT EXISTS keystone_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_log_id UUID, -- Link to parent sync operation
  method_name VARCHAR(100) NOT NULL, -- Keystone API method called
  request_data JSONB, -- Request parameters (sanitized)
  response_data JSONB, -- Response data
  response_time_ms INTEGER, -- Response time in milliseconds
  status_code VARCHAR(50), -- Keystone status code
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  ip_address INET, -- IP address used for the call
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint to sync logs
ALTER TABLE keystone_api_logs 
ADD CONSTRAINT fk_keystone_api_logs_sync 
FOREIGN KEY (sync_log_id) REFERENCES keystone_sync_logs(id) 
ON DELETE CASCADE;

-- Add RLS policies for keystone_api_logs
ALTER TABLE keystone_api_logs ENABLE ROW LEVEL SECURITY;

-- Admin users can read all API logs
CREATE POLICY "Admin users can read keystone_api_logs" ON keystone_api_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Only system can insert API logs (no user modifications)
CREATE POLICY "System can insert keystone_api_logs" ON keystone_api_logs 
FOR INSERT WITH CHECK (true);

-- Add indexes for keystone_api_logs
CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_sync ON keystone_api_logs(sync_log_id);
CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_method ON keystone_api_logs(method_name);
CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_success ON keystone_api_logs(success);
CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_created ON keystone_api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_response_time ON keystone_api_logs(response_time_ms);

-- Add composite index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_keystone_api_logs_method_success ON keystone_api_logs(method_name, success);

-- Add comments for documentation
COMMENT ON TABLE keystone_sync_logs IS 'Tracks all Keystone synchronization operations with performance metrics';
COMMENT ON COLUMN keystone_sync_logs.sync_type IS 'Type of sync: inventory_full, inventory_updates, pricing, etc.';
COMMENT ON COLUMN keystone_sync_logs.triggered_by IS 'How sync was initiated: manual, scheduled, or api_call';
COMMENT ON COLUMN keystone_sync_logs.duration_seconds IS 'Computed duration of sync operation in seconds';

COMMENT ON TABLE keystone_api_logs IS 'Detailed logs of individual Keystone API calls for debugging';
COMMENT ON COLUMN keystone_api_logs.request_data IS 'Sanitized request parameters (no sensitive data)';
COMMENT ON COLUMN keystone_api_logs.response_time_ms IS 'API response time in milliseconds';
COMMENT ON COLUMN keystone_api_logs.status_code IS 'Keystone-specific status code from response';

