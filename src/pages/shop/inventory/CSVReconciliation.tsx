import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Edit, 
  Save, 
  X, 
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Upload,
  RefreshCw,
  Settings,
  Wand2,
  FileEdit,
  Info,
  Zap,
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StagingRecord {
  id: string;
  upload_session_id: string;
  row_number: number;
  validation_status: 'pending' | 'valid' | 'invalid' | 'corrected' | 'processed';
  action_type: 'insert' | 'update' | 'delete' | 'unknown';
  needs_review: boolean;
  validation_notes: string;
  original_data: any;
  
  // Key fields for display and editing
  vendor_name: string;
  vcpn: string;
  vendor_code: string;
  part_number: string;
  long_description: string;
  total_qty: number;
  calculated_total_qty: number;
  
  // Warehouse quantities
  east_qty: number;
  midwest_qty: number;
  california_qty: number;
  southeast_qty: number;
  pacific_nw_qty: number;
  texas_qty: number;
  great_lakes_qty: number;
  florida_qty: number;
}

interface CSVProcessingSession {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  status: string;
  total_records: number;
  processed_records: number;
  valid_records: number;
  invalid_records: number;
  corrected_records: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

interface CSVReconciliationProps {
  sessionId: string;
  onClose?: () => void;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface ValidationIssue {
  type: 'missing_field' | 'invalid_format' | 'calculation_error' | 'duplicate' | 'other';
  field: string;
  description: string;
  suggestion: string;
}

export function CSVReconciliation({ sessionId, onClose }: CSVReconciliationProps) {
  const [session, setSession] = useState<CSVProcessingSession | null>(null);
  const [records, setRecords] = useState<StagingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StagingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [showMassCorrection, setShowMassCorrection] = useState(false);
  const [massCorrection, setMassCorrection] = useState({
    type: 'vcpn_fix',
    applyTo: 'selected'
  });
  const [isProcessingMass, setIsProcessingMass] = useState(false);
  
  // Enhanced filtering and pagination state
  const [filters, setFilters] = useState({
    status: 'needs_action', // Default to items needing action
    needsReview: true, // Default to needs review only
    actionType: 'all',
    searchTerm: '',
    issueType: 'all'
  });
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  useEffect(() => {
    applyFiltersAndPagination();
  }, [records, filters, pagination.currentPage, pagination.pageSize]);

  // Enhanced normalization function for part numbers
  const normalizePartNumber = (partNumber: string): string => {
    if (!partNumber) return '';
    
    let cleaned = partNumber.trim();
    
    // Remove Excel formula formatting: ="10406" -> 10406, =10406 -> 10406
    if (cleaned.startsWith('=')) {
      cleaned = cleaned.substring(1); // Remove the = prefix
      
      // If it's wrapped in quotes after removing =, remove those too
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
          (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }
    }
    
    return cleaned;
  };

  const loadSessionData = async () => {
    try {
      setLoading(true);
      
      // Load session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Load staging records
      const { data: recordsData, error: recordsError } = await supabase
        .from('csv_staging_records')
        .select('*')
        .eq('upload_session_id', sessionId)
        .order('row_number');

      if (recordsError) throw recordsError;
      setRecords(recordsData || []);

    } catch (error) {
      console.error('Error loading session data:', error);
      toast({
        title: "Error Loading Data",
        description: "Could not load reconciliation data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Parse validation notes to extract specific issues
  const parseValidationIssues = (notes: string): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    
    if (!notes) return issues;
    
    const noteLines = notes.split(';').map(n => n.trim());
    
    noteLines.forEach(note => {
      if (note.includes('Missing vendor_code')) {
        issues.push({
          type: 'missing_field',
          field: 'vendor_code',
          description: 'Vendor code is required but missing',
          suggestion: 'Add a valid vendor code'
        });
      } else if (note.includes('Missing SKU')) {
        issues.push({
          type: 'missing_field',
          field: 'part_number',
          description: 'Part number/SKU is required but missing',
          suggestion: 'Add a valid part number'
        });
      } else if (note.includes('SKU normalized') || note.includes('Excel formatting') || note.includes('Excel formula prefix')) {
        const match = note.match(/(?:SKU normalized|Excel formula prefix removed): "([^"]*)" → "([^"]*)"/);
        if (match) {
          issues.push({
            type: 'invalid_format',
            field: 'part_number',
            description: `Excel formula prefix removed: "${match[1]}" → "${match[2]}"`,
            suggestion: 'Excel = prefix was automatically removed'
          });
        } else {
          issues.push({
            type: 'invalid_format',
            field: 'part_number',
            description: 'Part number contains Excel formula prefix (=)',
            suggestion: 'Remove = prefix from part number'
          });
        }
      } else if (note.includes('VCPN corrected') || note.includes('VCPN auto-generated')) {
        const match = note.match(/VCPN (?:corrected|auto-generated): "?([^"]*)"? → "?([^"]*)"?/);
        if (match) {
          issues.push({
            type: 'calculation_error',
            field: 'vcpn',
            description: `VCPN should be vendor_code + part_number`,
            suggestion: `Corrected to: ${match[2] || match[1]}`
          });
        }
      } else if (note.includes('TotalQty corrected')) {
        const match = note.match(/TotalQty corrected: (\d+) → (\d+)/);
        if (match) {
          issues.push({
            type: 'calculation_error',
            field: 'total_qty',
            description: `Total quantity should equal sum of warehouse quantities`,
            suggestion: `Corrected from ${match[1]} to ${match[2]}`
          });
        }
      } else if (note.length > 0) {
        issues.push({
          type: 'other',
          field: 'general',
          description: note,
          suggestion: 'Review and correct manually'
        });
      }
    });
    
    return issues;
  };

  const applyFiltersAndPagination = () => {
    let filtered = [...records];

    // Apply status filter
    if (filters.status === 'needs_action') {
      filtered = filtered.filter(record => 
        record.validation_status === 'invalid' || 
        record.needs_review || 
        record.validation_status === 'corrected'
      );
    } else if (filters.status !== 'all') {
      filtered = filtered.filter(record => record.validation_status === filters.status);
    }

    // Apply needs review filter
    if (filters.needsReview) {
      filtered = filtered.filter(record => record.needs_review);
    }

    // Apply action type filter
    if (filters.actionType !== 'all') {
      filtered = filtered.filter(record => record.action_type === filters.actionType);
    }

    // Apply issue type filter
    if (filters.issueType !== 'all') {
      filtered = filtered.filter(record => {
        const issues = parseValidationIssues(record.validation_notes);
        return issues.some(issue => issue.type === filters.issueType);
      });
    }

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.vcpn?.toLowerCase().includes(searchLower) ||
        record.vendor_code?.toLowerCase().includes(searchLower) ||
        record.part_number?.toLowerCase().includes(searchLower) ||
        record.long_description?.toLowerCase().includes(searchLower) ||
        record.validation_notes?.toLowerCase().includes(searchLower)
      );
    }

    // Update pagination info
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pagination.pageSize);
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: Math.min(prev.currentPage, totalPages || 1)
    }));

    // Apply pagination
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedRecords = filtered.slice(startIndex, endIndex);

    setFilteredRecords(paginatedRecords);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: newSize, 
      currentPage: 1 
    }));
  };

  const startEditing = (record: StagingRecord) => {
    setEditingRecord(record.id);
    setEditData({
      vendor_code: record.vendor_code || '',
      part_number: record.part_number || '',
      vcpn: record.vcpn || '',
      long_description: record.long_description || '',
      total_qty: record.total_qty || 0,
      east_qty: record.east_qty || 0,
      midwest_qty: record.midwest_qty || 0,
      california_qty: record.california_qty || 0,
      southeast_qty: record.southeast_qty || 0,
      pacific_nw_qty: record.pacific_nw_qty || 0,
      texas_qty: record.texas_qty || 0,
      great_lakes_qty: record.great_lakes_qty || 0,
      florida_qty: record.florida_qty || 0
    });
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditData({});
  };

  const saveRecord = async (recordId: string) => {
    try {
      setProcessing(prev => new Set([...prev, recordId]));

      // Normalize part number to remove Excel prefixes
      const normalizedPartNumber = normalizePartNumber(editData.part_number);

      // Recalculate total quantity
      const calculatedTotal = 
        (parseInt(editData.east_qty) || 0) +
        (parseInt(editData.midwest_qty) || 0) +
        (parseInt(editData.california_qty) || 0) +
        (parseInt(editData.southeast_qty) || 0) +
        (parseInt(editData.pacific_nw_qty) || 0) +
        (parseInt(editData.texas_qty) || 0) +
        (parseInt(editData.great_lakes_qty) || 0) +
        (parseInt(editData.florida_qty) || 0);

      // Auto-correct VCPN with normalized part number
      const correctedVCPN = editData.vendor_code + normalizedPartNumber;

      const updateData = {
        ...editData,
        part_number: normalizedPartNumber,
        vcpn: correctedVCPN,
        total_qty: calculatedTotal,
        calculated_total_qty: calculatedTotal,
        validation_status: 'corrected',
        needs_review: false,
        validation_notes: 'Manually corrected by user'
      };

      const { error } = await supabase
        .from('csv_staging_records')
        .update(updateData)
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Record Updated",
        description: "Record has been corrected and is ready for processing",
      });

      // Refresh data
      await loadSessionData();
      setEditingRecord(null);
      setEditData({});

    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the record changes",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  const processRecord = async (recordId: string) => {
    try {
      setProcessing(prev => new Set([...prev, recordId]));

      const record = records.find(r => r.id === recordId);
      if (!record) throw new Error('Record not found');

      // Check if record exists in inventory by VCPN
      const { data: existing, error: checkError } = await supabase
        .from('inventory')
        .select('id')
        .eq('vcpn', record.vcpn)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const inventoryData = {
        name: record.long_description || record.part_number || 'Unknown Item',
        description: record.long_description,
        sku: record.part_number,
        vcpn: record.vcpn,
        vendor_code: record.vendor_code,
        vendor_name: record.vendor_name,
        quantity: record.total_qty,
        east_qty: record.east_qty,
        midwest_qty: record.midwest_qty,
        california_qty: record.california_qty,
        southeast_qty: record.southeast_qty,
        pacific_nw_qty: record.pacific_nw_qty,
        texas_qty: record.texas_qty,
        great_lakes_qty: record.great_lakes_qty,
        florida_qty: record.florida_qty,
        total_qty: record.total_qty,
        ftp_upload_id: sessionId
      };

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('inventory')
          .update(inventoryData)
          .eq('id', existing.id);

        if (updateError) throw updateError;

        // Update staging record
        await supabase
          .from('csv_staging_records')
          .update({ 
            existing_inventory_id: existing.id,
            action_type: 'update',
            validation_status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', recordId);

        toast({
          title: "Record Updated",
          description: "Record has been updated in inventory",
        });
      } else {
        // Insert new record
        const { data: newRecord, error: insertError } = await supabase
          .from('inventory')
          .insert([inventoryData])
          .select()
          .single();

        if (insertError) throw insertError;

        // Update staging record
        await supabase
          .from('csv_staging_records')
          .update({ 
            existing_inventory_id: newRecord.id,
            action_type: 'insert',
            validation_status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('id', recordId);

        toast({
          title: "Record Added",
          description: "New record has been added to inventory",
        });
      }

      // Refresh data
      await loadSessionData();

    } catch (error) {
      console.error('Error processing record:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : 'Could not process record',
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      setProcessing(prev => new Set([...prev, recordId]));

      const { error } = await supabase
        .from('csv_staging_records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Record Deleted",
        description: "Record has been removed from staging",
      });

      // Refresh data
      await loadSessionData();

    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the record",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  const processSelectedRecords = async () => {
    if (selectedRecords.size === 0) {
      toast({
        title: "No Records Selected",
        description: "Please select records to process",
        variant: "destructive",
      });
      return;
    }

    const recordIds = Array.from(selectedRecords);
    for (const recordId of recordIds) {
      await processRecord(recordId);
    }
    setSelectedRecords(new Set());
  };

  // NEW: Mass cleanup function for Excel formula prefixes
  const massCleanupExcelPrefixes = async () => {
    if (!confirm('This will clean up Excel formula prefixes (=) from ALL part numbers in this session and recalculate VCPNs. Continue?')) {
      return;
    }

    try {
      setIsProcessingMass(true);
      
      // Get all records in the session that have = prefix in part numbers
      const recordsWithPrefixes = records.filter(record => 
        record.part_number && record.part_number.startsWith('=')
      );

      if (recordsWithPrefixes.length === 0) {
        toast({
          title: "No Issues Found",
          description: "No records found with Excel formula prefixes",
        });
        return;
      }

      let updatedCount = 0;

      for (const record of recordsWithPrefixes) {
        const normalizedPartNumber = normalizePartNumber(record.part_number);
        const correctedVCPN = record.vendor_code + normalizedPartNumber;

        const updateData = {
          part_number: normalizedPartNumber,
          vcpn: correctedVCPN,
          validation_status: 'corrected',
          needs_review: false,
          validation_notes: `Excel formula prefix removed: "${record.part_number}" → "${normalizedPartNumber}"; VCPN corrected to: "${correctedVCPN}"`
        };

        const { error } = await supabase
          .from('csv_staging_records')
          .update(updateData)
          .eq('id', record.id);

        if (error) {
          console.error('Error updating record:', error);
        } else {
          updatedCount++;
        }
      }

      toast({
        title: "Mass Cleanup Complete",
        description: `Cleaned up ${updatedCount} records with Excel formula prefixes`,
      });

      // Refresh data
      await loadSessionData();

    } catch (error) {
      console.error('Error in mass cleanup:', error);
      toast({
        title: "Mass Cleanup Failed",
        description: "Could not complete mass cleanup",
        variant: "destructive",
      });
    } finally {
      setIsProcessingMass(false);
    }
  };

  // Mass correction functions
  const applyMassCorrection = async () => {
    if (selectedRecords.size === 0) {
      toast({
        title: "No Records Selected",
        description: "Please select records to apply mass correction",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(new Set(selectedRecords));

      const recordsToUpdate = records.filter(r => selectedRecords.has(r.id));
      
      for (const record of recordsToUpdate) {
        let updateData: any = {};
        
        if (massCorrection.type === 'vcpn_fix') {
          // Normalize part number first, then auto-fix VCPN
          const normalizedPartNumber = normalizePartNumber(record.part_number);
          updateData.part_number = normalizedPartNumber;
          updateData.vcpn = record.vendor_code + normalizedPartNumber;
          updateData.validation_notes = 'VCPN auto-corrected via mass correction';
        } else if (massCorrection.type === 'total_qty_fix') {
          // Recalculate total quantity
          const calculatedTotal = 
            (record.east_qty || 0) +
            (record.midwest_qty || 0) +
            (record.california_qty || 0) +
            (record.southeast_qty || 0) +
            (record.pacific_nw_qty || 0) +
            (record.texas_qty || 0) +
            (record.great_lakes_qty || 0) +
            (record.florida_qty || 0);
          
          updateData.total_qty = calculatedTotal;
          updateData.calculated_total_qty = calculatedTotal;
          updateData.validation_notes = 'Total quantity recalculated via mass correction';
        } else if (massCorrection.type === 'excel_cleanup') {
          // Clean Excel prefixes and recalculate VCPN
          const normalizedPartNumber = normalizePartNumber(record.part_number);
          updateData.part_number = normalizedPartNumber;
          updateData.vcpn = record.vendor_code + normalizedPartNumber;
          updateData.validation_notes = `Excel prefix cleaned: "${record.part_number}" → "${normalizedPartNumber}"; VCPN corrected`;
        }
        
        updateData.validation_status = 'corrected';
        updateData.needs_review = false;

        const { error } = await supabase
          .from('csv_staging_records')
          .update(updateData)
          .eq('id', record.id);

        if (error) throw error;
      }

      toast({
        title: "Mass Correction Applied",
        description: `Updated ${recordsToUpdate.length} records`,
      });

      // Refresh data
      await loadSessionData();
      setSelectedRecords(new Set());
      setShowMassCorrection(false);

    } catch (error) {
      console.error('Error applying mass correction:', error);
      toast({
        title: "Mass Correction Failed",
        description: "Could not apply mass correction",
        variant: "destructive",
      });
    } finally {
      setProcessing(new Set());
    }
  };

  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleIds = filteredRecords.map(r => r.id);
    setSelectedRecords(new Set(visibleIds));
  };

  const clearSelection = () => {
    setSelectedRecords(new Set());
  };

  const getStatusBadge = (record: StagingRecord) => {
    if (record.validation_status === 'processed') {
      return <Badge variant="default">Processed</Badge>;
    } else if (record.validation_status === 'invalid') {
      return <Badge variant="destructive">Invalid</Badge>;
    } else if (record.validation_status === 'corrected') {
      return <Badge variant="secondary">Corrected</Badge>;
    } else if (record.needs_review) {
      return <Badge variant="outline">Needs Review</Badge>;
    } else {
      return <Badge variant="default">Valid</Badge>;
    }
  };

  const renderValidationIssues = (record: StagingRecord) => {
    const issues = parseValidationIssues(record.validation_notes);
    
    if (issues.length === 0) {
      return <span className="text-green-600 text-xs">No issues</span>;
    }

    return (
      <div className="space-y-1">
        {issues.map((issue, index) => (
          <div key={index} className="text-xs">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="font-medium">{issue.field}:</span>
            </div>
            <div className="text-gray-600 ml-4">{issue.description}</div>
            <div className="text-blue-600 ml-4 italic">{issue.suggestion}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={pagination.pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm px-2">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading reconciliation data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-[98vw] w-full mx-2 max-h-[98vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">CSV Reconciliation</h2>
              <p className="text-sm text-gray-600">
                {session?.original_filename} • {session?.total_records} total records
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search records..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="needs_action">Needs Action</SelectItem>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="invalid">Invalid</SelectItem>
                <SelectItem value="corrected">Corrected</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>

            {/* Issue Type Filter */}
            <Select value={filters.issueType} onValueChange={(value) => handleFilterChange('issueType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by issue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issues</SelectItem>
                <SelectItem value="missing_field">Missing Fields</SelectItem>
                <SelectItem value="invalid_format">Format Issues</SelectItem>
                <SelectItem value="calculation_error">Calculation Errors</SelectItem>
                <SelectItem value="duplicate">Duplicates</SelectItem>
                <SelectItem value="other">Other Issues</SelectItem>
              </SelectContent>
            </Select>

            {/* Action Type Filter */}
            <Select value={filters.actionType} onValueChange={(value) => handleFilterChange('actionType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="insert">Insert</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>

            {/* Needs Review Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsReview"
                checked={filters.needsReview}
                onCheckedChange={(checked) => handleFilterChange('needsReview', checked)}
              />
              <label htmlFor="needsReview" className="text-sm font-medium">
                Needs Review Only
              </label>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
                disabled={filteredRecords.length === 0}
              >
                Select All ({filteredRecords.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={selectedRecords.size === 0}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={processSelectedRecords}
                disabled={selectedRecords.size === 0}
              >
                <Upload className="h-4 w-4 mr-1" />
                Process Selected ({selectedRecords.size})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMassCorrection(true)}
                disabled={selectedRecords.size === 0}
              >
                <Wand2 className="h-4 w-4 mr-1" />
                Mass Correction ({selectedRecords.size})
              </Button>
              {/* NEW: Mass cleanup button */}
              <Button
                variant="outline"
                size="sm"
                onClick={massCleanupExcelPrefixes}
                disabled={isProcessingMass}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                {isProcessingMass ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-1" />
                )}
                Clean Excel Prefixes (All)
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              {pagination.totalItems} records found
            </div>
          </div>
        </div>

        {/* Records Table with Horizontal Scroll */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-[1400px]"> {/* Ensure minimum width for horizontal scroll */}
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllVisible();
                        } else {
                          clearSelection();
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-32">VCPN</TableHead>
                  <TableHead className="w-24">Vendor</TableHead>
                  <TableHead className="w-32">Part Number</TableHead>
                  <TableHead className="w-48">Description</TableHead>
                  <TableHead className="w-20">Total Qty</TableHead>
                  <TableHead className="w-80">Issues & Corrections Needed</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRecords.has(record.id)}
                        onCheckedChange={() => toggleRecordSelection(record.id)}
                      />
                    </TableCell>
                    <TableCell>{record.row_number}</TableCell>
                    <TableCell>{getStatusBadge(record)}</TableCell>
                    <TableCell>
                      {editingRecord === record.id ? (
                        <Input
                          value={editData.vcpn || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, vcpn: e.target.value }))}
                          className="w-28"
                        />
                      ) : (
                        <span className="font-mono text-xs">{record.vcpn}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRecord === record.id ? (
                        <Input
                          value={editData.vendor_code || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, vendor_code: e.target.value }))}
                          className="w-20"
                        />
                      ) : (
                        record.vendor_code
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRecord === record.id ? (
                        <Input
                          value={editData.part_number || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, part_number: e.target.value }))}
                          className="w-28"
                        />
                      ) : (
                        <span className={record.part_number?.startsWith('=') ? 'text-red-600 font-mono' : 'font-mono'}>
                          {record.part_number}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRecord === record.id ? (
                        <Input
                          value={editData.long_description || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, long_description: e.target.value }))}
                          className="w-44"
                        />
                      ) : (
                        <div className="max-w-44 truncate" title={record.long_description}>
                          {record.long_description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingRecord === record.id ? (
                        <Input
                          type="number"
                          value={editData.total_qty || 0}
                          onChange={(e) => setEditData(prev => ({ ...prev, total_qty: parseInt(e.target.value) || 0 }))}
                          className="w-16"
                        />
                      ) : (
                        record.total_qty
                      )}
                    </TableCell>
                    <TableCell className="w-80">
                      <div className="max-h-24 overflow-y-auto">
                        {renderValidationIssues(record)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {editingRecord === record.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => saveRecord(record.id)}
                              disabled={processing.has(record.id)}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {record.validation_status !== 'processed' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEditing(record)}
                                  title="Edit record"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => processRecord(record.id)}
                                  disabled={processing.has(record.id)}
                                  title="Process to inventory"
                                >
                                  <Upload className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteRecord(record.id)}
                              disabled={processing.has(record.id)}
                              title="Delete record"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No records match the current filters
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalItems > 0 && (
          <div className="p-4 border-t bg-gray-50 flex-shrink-0">
            {renderPagination()}
          </div>
        )}

        {/* Mass Correction Modal */}
        {showMassCorrection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Mass Correction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Correction Type</label>
                  <Select 
                    value={massCorrection.type} 
                    onValueChange={(value) => setMassCorrection(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel_cleanup">Clean Excel Prefixes & Fix VCPN</SelectItem>
                      <SelectItem value="vcpn_fix">Auto-fix VCPN (vendor_code + part_number)</SelectItem>
                      <SelectItem value="total_qty_fix">Recalculate Total Quantity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-sm text-gray-600">
                  This will apply the correction to {selectedRecords.size} selected records.
                  {massCorrection.type === 'excel_cleanup' && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                      <strong>Excel Cleanup:</strong> Removes = prefixes from part numbers and recalculates VCPNs
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowMassCorrection(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={applyMassCorrection}>
                    Apply Correction
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CSVReconciliation;

