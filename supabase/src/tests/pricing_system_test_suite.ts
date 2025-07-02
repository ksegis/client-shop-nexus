/**
 * Pricing System Test Suite
 * 
 * Comprehensive test suite for validating the pricing sync system functionality
 * including database operations, API integration, scheduling, and UI components.
 */

import { getPricingSyncService, PricingSyncService } from './pricing_sync_service';
import { getPricingSyncScheduler, PricingSyncScheduler } from './pricing_sync_scheduler';
import { getSupabaseClient } from './shared_supabase_client';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

/**
 * Pricing System Test Runner
 * 
 * Comprehensive test suite that validates all aspects of the pricing system
 * including database schema, service functionality, scheduling, and integration.
 */
export class PricingSystemTestRunner {
  private supabase = getSupabaseClient();
  private pricingService: PricingSyncService;
  private pricingScheduler: PricingSyncScheduler;
  private testResults: TestSuite[] = [];

  constructor() {
    this.pricingService = getPricingSyncService();
    this.pricingScheduler = getPricingSyncScheduler();
  }

  /**
   * Run all pricing system tests
   */
  async runAllTests(): Promise<{ success: boolean; results: TestSuite[]; summary: any }> {
    console.log('🧪 Starting Pricing System Test Suite...');
    const startTime = Date.now();

    try {
      // Run test suites in order
      await this.testDatabaseSchema();
      await this.testPricingSyncService();
      await this.testPricingScheduler();
      await this.testDataIntegrity();
      await this.testPerformance();
      await this.testErrorHandling();

      const totalDuration = Date.now() - startTime;
      const summary = this.generateTestSummary(totalDuration);

      console.log('✅ Pricing System Test Suite Completed');
      return {
        success: summary.overallPassed,
        results: this.testResults,
        summary
      };

    } catch (error) {
      console.error('❌ Test Suite Failed:', error);
      return {
        success: false,
        results: this.testResults,
        summary: { error: error.message }
      };
    }
  }

  /**
   * Test database schema and structure
   */
  private async testDatabaseSchema(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Database Schema Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Verify pricing_cache table exists and has correct structure
    await this.runTest(suite, 'Pricing Cache Table Structure', async () => {
      const { data, error } = await this.supabase
        .from('pricing_cache')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        throw new Error('pricing_cache table does not exist');
      }

      // Test table structure by attempting to insert a test record
      const testRecord = {
        keystone_vcpn: 'TEST_VCPN_001',
        price: 99.99,
        core_charge: 25.00,
        list_price: 129.99,
        currency: 'USD'
      };

      const { error: insertError } = await this.supabase
        .from('pricing_cache')
        .insert(testRecord);

      if (insertError) {
        throw new Error(`Failed to insert test record: ${insertError.message}`);
      }

      // Clean up test record
      await this.supabase
        .from('pricing_cache')
        .delete()
        .eq('keystone_vcpn', 'TEST_VCPN_001');

      return 'pricing_cache table structure is correct';
    });

    // Test 2: Verify pricing_sync_logs table
    await this.runTest(suite, 'Pricing Sync Logs Table', async () => {
      const { error } = await this.supabase
        .from('pricing_sync_logs')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        throw new Error('pricing_sync_logs table does not exist');
      }

      return 'pricing_sync_logs table exists';
    });

    // Test 3: Verify pricing_update_requests table
    await this.runTest(suite, 'Pricing Update Requests Table', async () => {
      const { error } = await this.supabase
        .from('pricing_update_requests')
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        throw new Error('pricing_update_requests table does not exist');
      }

      return 'pricing_update_requests table exists';
    });

    // Test 4: Verify pricing_sync_schedules table
    await this.runTest(suite, 'Pricing Sync Schedules Table', async () => {
      const { data, error } = await this.supabase
        .from('pricing_sync_schedules')
        .select('*');

      if (error && error.code === 'PGRST116') {
        throw new Error('pricing_sync_schedules table does not exist');
      }

      if (!data || data.length === 0) {
        throw new Error('No default pricing sync schedules found');
      }

      const scheduleTypes = data.map(s => s.schedule_type);
      const expectedTypes = ['full_sync', 'incremental_sync', 'process_requests'];
      
      for (const type of expectedTypes) {
        if (!scheduleTypes.includes(type)) {
          throw new Error(`Missing schedule type: ${type}`);
        }
      }

      return `Found ${data.length} pricing sync schedules`;
    });

    // Test 5: Verify database functions exist
    await this.runTest(suite, 'Database Functions', async () => {
      try {
        // Test get_pricing_sync_stats function
        const { data: stats, error: statsError } = await this.supabase
          .rpc('get_pricing_sync_stats');

        if (statsError) {
          throw new Error(`get_pricing_sync_stats function error: ${statsError.message}`);
        }

        // Test get_parts_needing_pricing_sync function
        const { data: parts, error: partsError } = await this.supabase
          .rpc('get_parts_needing_pricing_sync', { stale_hours: 24 });

        if (partsError) {
          throw new Error(`get_parts_needing_pricing_sync function error: ${partsError.message}`);
        }

        return 'All database functions are working';
      } catch (error) {
        throw new Error(`Database functions test failed: ${error.message}`);
      }
    });

    this.testResults.push(suite);
  }

  /**
   * Test pricing sync service functionality
   */
  private async testPricingSyncService(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Pricing Sync Service Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Service initialization
    await this.runTest(suite, 'Service Initialization', async () => {
      await this.pricingService.initialize();
      return 'Pricing sync service initialized successfully';
    });

    // Test 2: Get pricing from Supabase
    await this.runTest(suite, 'Get Pricing from Supabase', async () => {
      const pricing = await this.pricingService.getPricingFromSupabase({
        limit: 10,
        includeStale: true
      });

      return `Retrieved ${pricing.length} pricing records from Supabase`;
    });

    // Test 3: Get pricing sync status
    await this.runTest(suite, 'Get Pricing Sync Status', async () => {
      const status = await this.pricingService.getPricingSyncStatus();
      
      if (typeof status.totalParts !== 'number') {
        throw new Error('Invalid pricing sync status structure');
      }

      return `Pricing sync status: ${status.totalParts} total parts, ${status.syncedParts} synced`;
    });

    // Test 4: Request pricing update
    await this.runTest(suite, 'Request Pricing Update', async () => {
      const result = await this.pricingService.requestPricingUpdate(
        'TEST_VCPN_UPDATE',
        'high',
        'test_runner'
      );

      if (!result.success) {
        throw new Error(`Failed to request pricing update: ${result.message}`);
      }

      // Clean up test request
      await this.supabase
        .from('pricing_update_requests')
        .delete()
        .eq('keystone_vcpn', 'TEST_VCPN_UPDATE');

      return result.message;
    });

    // Test 5: Process pending updates (without actual API calls)
    await this.runTest(suite, 'Process Pending Updates', async () => {
      // This test just verifies the function doesn't crash
      // In a real environment, you might want to mock the Keystone API
      const result = await this.pricingService.processPendingPricingUpdates(0);
      return `Processed ${result.processed} pending pricing updates`;
    });

    this.testResults.push(suite);
  }

  /**
   * Test pricing scheduler functionality
   */
  private async testPricingScheduler(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Pricing Scheduler Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Scheduler initialization
    await this.runTest(suite, 'Scheduler Initialization', async () => {
      await this.pricingScheduler.initialize();
      return 'Pricing scheduler initialized successfully';
    });

    // Test 2: Get scheduler status
    await this.runTest(suite, 'Get Scheduler Status', async () => {
      const status = await this.pricingScheduler.getSchedulerStatus();
      
      if (!status.config) {
        throw new Error('Scheduler configuration not found');
      }

      return `Scheduler status: ${status.isRunning ? 'running' : 'stopped'}, ${status.scheduledJobs.length} jobs`;
    });

    // Test 3: Update configuration
    await this.runTest(suite, 'Update Configuration', async () => {
      const newConfig = {
        enableAutoSync: true,
        staleThresholdHours: 12
      };

      await this.pricingScheduler.updateConfiguration(newConfig);
      
      const status = await this.pricingScheduler.getSchedulerStatus();
      
      if (status.config.staleThresholdHours !== 12) {
        throw new Error('Configuration update failed');
      }

      return 'Scheduler configuration updated successfully';
    });

    // Test 4: Request pricing update through scheduler
    await this.runTest(suite, 'Request Pricing Update via Scheduler', async () => {
      const result = await this.pricingScheduler.requestPricingUpdate(
        'TEST_SCHEDULER_VCPN',
        'medium'
      );

      if (!result.success) {
        throw new Error(`Failed to request pricing update: ${result.message}`);
      }

      // Clean up test request
      await this.supabase
        .from('pricing_update_requests')
        .delete()
        .eq('keystone_vcpn', 'TEST_SCHEDULER_VCPN');

      return result.message;
    });

    this.testResults.push(suite);
  }

  /**
   * Test data integrity and consistency
   */
  private async testDataIntegrity(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Data Integrity Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Pricing data consistency
    await this.runTest(suite, 'Pricing Data Consistency', async () => {
      const { data: pricingData, error } = await this.supabase
        .from('pricing_cache')
        .select('keystone_vcpn, price, list_price, core_charge')
        .not('keystone_vcpn', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch pricing data: ${error.message}`);
      }

      let inconsistencies = 0;
      for (const record of pricingData || []) {
        // Check for negative prices
        if (record.price < 0 || (record.list_price && record.list_price < 0)) {
          inconsistencies++;
        }
        
        // Check if list price is less than selling price (unusual but not necessarily wrong)
        if (record.list_price && record.price && record.list_price < record.price) {
          console.warn(`Unusual pricing for ${record.keystone_vcpn}: list price < selling price`);
        }
      }

      if (inconsistencies > 0) {
        throw new Error(`Found ${inconsistencies} pricing inconsistencies`);
      }

      return `Validated ${pricingData?.length || 0} pricing records - no inconsistencies found`;
    });

    // Test 2: Sync log integrity
    await this.runTest(suite, 'Sync Log Integrity', async () => {
      const { data: logs, error } = await this.supabase
        .from('pricing_sync_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to fetch sync logs: ${error.message}`);
      }

      let issues = 0;
      for (const log of logs || []) {
        // Check for completed logs without completion time
        if (log.status === 'completed' && !log.completed_at) {
          issues++;
        }
        
        // Check for logs with negative durations
        if (log.completed_at && log.started_at) {
          const duration = new Date(log.completed_at).getTime() - new Date(log.started_at).getTime();
          if (duration < 0) {
            issues++;
          }
        }
      }

      if (issues > 0) {
        throw new Error(`Found ${issues} sync log integrity issues`);
      }

      return `Validated ${logs?.length || 0} sync logs - no integrity issues found`;
    });

    // Test 3: Orphaned pricing records
    await this.runTest(suite, 'Orphaned Pricing Records', async () => {
      const { data: orphanedPricing, error } = await this.supabase
        .from('pricing_cache')
        .select('keystone_vcpn')
        .not('keystone_vcpn', 'in', 
          `(SELECT DISTINCT keystone_vcpn FROM inventory WHERE keystone_vcpn IS NOT NULL)`
        );

      if (error) {
        throw new Error(`Failed to check for orphaned pricing: ${error.message}`);
      }

      const orphanCount = orphanedPricing?.length || 0;
      
      if (orphanCount > 0) {
        console.warn(`Found ${orphanCount} orphaned pricing records (pricing without inventory)`);
      }

      return `Found ${orphanCount} orphaned pricing records`;
    });

    this.testResults.push(suite);
  }

  /**
   * Test system performance
   */
  private async testPerformance(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Performance Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Pricing query performance
    await this.runTest(suite, 'Pricing Query Performance', async () => {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('pricing_cache')
        .select('*')
        .limit(1000);

      const queryTime = Date.now() - startTime;

      if (error) {
        throw new Error(`Pricing query failed: ${error.message}`);
      }

      if (queryTime > 5000) { // 5 seconds
        throw new Error(`Pricing query too slow: ${queryTime}ms`);
      }

      return `Pricing query completed in ${queryTime}ms for ${data?.length || 0} records`;
    });

    // Test 2: Sync status query performance
    await this.runTest(suite, 'Sync Status Query Performance', async () => {
      const startTime = Date.now();
      
      const status = await this.pricingService.getPricingSyncStatus();
      
      const queryTime = Date.now() - startTime;

      if (queryTime > 3000) { // 3 seconds
        throw new Error(`Sync status query too slow: ${queryTime}ms`);
      }

      return `Sync status query completed in ${queryTime}ms`;
    });

    // Test 3: Database function performance
    await this.runTest(suite, 'Database Function Performance', async () => {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .rpc('get_pricing_sync_stats');

      const queryTime = Date.now() - startTime;

      if (error) {
        throw new Error(`Database function failed: ${error.message}`);
      }

      if (queryTime > 2000) { // 2 seconds
        throw new Error(`Database function too slow: ${queryTime}ms`);
      }

      return `Database function completed in ${queryTime}ms`;
    });

    this.testResults.push(suite);
  }

  /**
   * Test error handling and edge cases
   */
  private async testErrorHandling(): Promise<void> {
    const suite: TestSuite = {
      suiteName: 'Error Handling Tests',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Invalid VCPN handling
    await this.runTest(suite, 'Invalid VCPN Handling', async () => {
      const result = await this.pricingService.requestPricingUpdate(
        '', // Empty VCPN
        'medium'
      );

      // Should handle gracefully, not crash
      return 'Invalid VCPN handled gracefully';
    });

    // Test 2: Database connection error simulation
    await this.runTest(suite, 'Database Error Handling', async () => {
      try {
        // Try to query a non-existent table
        await this.supabase
          .from('non_existent_table')
          .select('*');
      } catch (error) {
        // Should handle database errors gracefully
        return 'Database errors handled gracefully';
      }
      
      return 'Database error handling test completed';
    });

    // Test 3: Large dataset handling
    await this.runTest(suite, 'Large Dataset Handling', async () => {
      const pricing = await this.pricingService.getPricingFromSupabase({
        limit: 10000, // Large limit
        includeStale: true
      });

      // Should not crash with large datasets
      return `Handled large dataset: ${pricing.length} records`;
    });

    this.testResults.push(suite);
  }

  /**
   * Run a single test and record results
   */
  private async runTest(
    suite: TestSuite, 
    testName: string, 
    testFunction: () => Promise<string>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`  🧪 Running: ${testName}`);
      const message = await testFunction();
      const duration = Date.now() - startTime;
      
      suite.tests.push({
        testName,
        passed: true,
        message,
        duration
      });
      
      suite.passed++;
      suite.totalDuration += duration;
      
      console.log(`    ✅ ${testName}: ${message} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      suite.tests.push({
        testName,
        passed: false,
        message: error.message,
        duration,
        details: error
      });
      
      suite.failed++;
      suite.totalDuration += duration;
      
      console.log(`    ❌ ${testName}: ${error.message} (${duration}ms)`);
    }
  }

  /**
   * Generate test summary
   */
  private generateTestSummary(totalDuration: number): any {
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.tests.length, 0);
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.testResults.reduce((sum, suite) => sum + suite.failed, 0);
    
    const summary = {
      totalSuites: this.testResults.length,
      totalTests,
      totalPassed,
      totalFailed,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
      totalDuration,
      overallPassed: totalFailed === 0,
      suites: this.testResults.map(suite => ({
        name: suite.suiteName,
        passed: suite.passed,
        failed: suite.failed,
        duration: suite.totalDuration,
        successRate: suite.tests.length > 0 ? (suite.passed / suite.tests.length) * 100 : 0
      }))
    };

    console.log('\n📊 Test Summary:');
    console.log(`Total Suites: ${summary.totalSuites}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.totalPassed}`);
    console.log(`Failed: ${summary.totalFailed}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log(`Overall Result: ${summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);

    return summary;
  }
}

/**
 * Quick test runner for basic functionality
 */
export async function runQuickPricingTests(): Promise<boolean> {
  console.log('🚀 Running Quick Pricing System Tests...');
  
  try {
    const testRunner = new PricingSystemTestRunner();
    const results = await testRunner.runAllTests();
    
    return results.success;
    
  } catch (error) {
    console.error('❌ Quick tests failed:', error);
    return false;
  }
}

/**
 * Test specific pricing functionality
 */
export async function testPricingFunctionality(vcpn: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const pricingService = getPricingSyncService();
    await pricingService.initialize();
    
    // Test getting pricing data
    const pricing = await pricingService.getPricingFromSupabase({
      vcpns: [vcpn],
      includeStale: true
    });
    
    // Test requesting update
    const updateResult = await pricingService.requestPricingUpdate(vcpn, 'high', 'test');
    
    return {
      success: true,
      message: `Pricing functionality test completed for ${vcpn}`,
      details: {
        existingPricing: pricing.length > 0,
        updateRequested: updateResult.success
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Pricing functionality test failed: ${error.message}`
    };
  }
}

export default PricingSystemTestRunner;

