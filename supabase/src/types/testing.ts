
// Testing and bug tracking type definitions

export type TestStatus = 'passed' | 'failed' | 'in_progress' | 'blocked';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';
export type TestSeverity = 'trivial' | 'minor' | 'major' | 'critical' | 'blocker';

export interface TestResult {
  id: string;
  test_name: string;
  description: string;
  feature_area: string;
  status: TestStatus;
  tester_id: string;
  created_at: string;
  updated_at: string;
  environment: string;
  priority: TestPriority;
  steps_to_reproduce?: string;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  status: BugStatus;
  reported_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  test_result_id?: string;
  feature_area: string;
  severity: TestSeverity;
  steps_to_reproduce?: string;
  expected_result?: string;
  actual_result?: string;
  attachments?: string[];
}

export interface Tester {
  id: string;
  name: string;
  email: string;
  role: string;
}
