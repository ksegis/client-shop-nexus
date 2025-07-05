import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
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
  Download,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  getStagingRecords, 
  updateStagingRecord, 
  processStagingRecord,
  getUploadSession,
  CSVProcessingSession 
} from '@/utils/csvProcessor';

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

interface CSVReconciliationProps {
  sessionId: string;
  onClose?: () => void;
}

export function CSVReconciliation({ sessionId, onClose }: CSVReconciliationProps) {
  const [session, setSession] = useState<CSVProcessingSession | null>(null);
  const [records, setRecords] = useState<StagingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StagingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    needsReview: false,
    actionType: 'all'
  });
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  useEffect(() => {
    applyFilters();
  }, [records, filters]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      
      // Load session details
      const sessionData = await getUploadSession(sessionId);
      setSession(sessionData);
      
      // Load staging records
      const stagingRecords = await getStagingRecords(sessionId);
      setRecords(stagingRecords);
      
    } catch (error) {
      console.error('Error loading session data:', error);
      toast({
        title: "Error",
        description: "Failed to load session data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.validation_status === filters.status);
    }
    
    if (filters.needsReview) {
      filtered = filtered.filter(r => r.needs_review);
    }
    
    if (filters.actionType !== 'all') {
      filtered = filtered.filter(r => r.action_type === filters.actionType);
    }
    
    setFilteredRecords(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Valid</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Invalid</Badge>;
      case 'corrected':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Corrected</Badge>;
      case 'processed':
        return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" />Processed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'insert':
        return <Badge variant="default">New</Badge>;
      case 'update':
        return <Badge variant="secondary">Update</Badge>;
      case 'delete':
        return <Badge variant="destructive">Delete</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const startEditing = (record: StagingRecord) => {
    setEditingRecord(record.id);
    setEditData({
      vendor_code: record.vendor_code || '',
      part_number: record.part_number || '',
      vcpn: record.vcpn || '',
      vendor_name: record.vendor_name || '',
      long_description: record.long_description || '',
      east_qty: record.east_qty || 0,
      midwest_qty: record.midwest_qty || 0,
      california_qty: record.california_qty || 0,
      southeast_qty: record.southeast_qty || 0,
      pacific_nw_qty: record.pacific_nw_qty || 0,
      texas_qty: record.texas_qty || 0,
      great_lakes_qty: record.great_lakes_qty || 0,
      florida_qty: record.florida_qty || 0,
    });
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditData({});
  };

  const saveRecord = async (recordId: string) => {
    try {
      // Recalculate VCPN and total quantity
      const calculatedVCPN = editData.vendor_code && editData.part_number 
        ? `${editData.vendor_code}${editData.part_number}` 
        : editData.vcpn;
      
      const calculatedTotal = [
        editData.east_qty, editData.midwest_qty, editData.california_qty,
        editData.southeast_qty, editData.pacific_nw_qty, editData.texas_qty,
        editData.great_lakes_qty, editData.florida_qty
      ].reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);

      const updateData = {
        ...editData,
        vcpn: calculatedVCPN,
        total_qty: calculatedTotal,
        calculated_total_qty: calculatedTotal,
        validation_status: 'corrected',
        validation_notes: `Manual correction applied: VCPN=${calculatedVCPN}, TotalQty=${calculatedTotal}`
      };

      await updateStagingRecord(recordId, updateData);
      
      // Reload records
      await loadSessionData();
      
      setEditingRecord(null);
      setEditData({});
      
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
      
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: "Error",
        description: "Failed to save record",
        variant: "destructive",
      });
    }
  };

  const processRecord = async (recordId: string) => {
    try {
      setProcessing(prev => new Set(prev).add(recordId));
      
      await processStagingRecord(recordId);
      
      // Reload records
      await loadSessionData();
      
      toast({
        title: "Success",
        description: "Record processed successfully",
      });
      
    } catch (error) {
      console.error('Error processing record:', error);
      toast({
        title: "Error",
        description: "Failed to process record",
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
        title: "No Selection",
        description: "Please select records to process",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(new Set(selectedRecords));
      
      for (const recordId of selectedRecords) {
        await processStagingRecord(recordId);
      }
      
      // Reload records
      await loadSessionData();
      setSelectedRecords(new Set());
      
      toast({
        title: "Success",
        description: `Processed ${selectedRecords.size} records successfully`,
      });
      
    } catch (error) {
      console.error('Error processing records:', error);
      toast({
        title: "Error",
        description: "Failed to process some records",
        variant: "destructive",
      });
    } finally {
      setProcessing(new Set());
    }
  };

  const toggleRecordSelection = (recordId: string) => {
    const newSelection = new Set(selectedRecords);
    if (newSelection.has(recordId)) {
      newSelection.delete(recordId);
    } else {
      newSelection.add(recordId);
    }
    setSelectedRecords(newSelection);
  };

  const selectAllFiltered = () => {
    const validRecords = filteredRecords.filter(r => 
      r.validation_status === 'valid' || r.validation_status === 'corrected'
    );
    setSelectedRecords(new Set(validRecords.map(r => r.id)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Session not found or failed to load.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>CSV Reconciliation - {session.originalFilename}</CardTitle>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Total Records</div>
              <div className="text-2xl font-bold">{session.totalRecords}</div>
            </div>
            <div>
              <div className="font-medium">Valid</div>
              <div className="text-2xl font-bold text-green-600">{session.validRecords}</div>
            </div>
            <div>
              <div className="font-medium">Invalid</div>
              <div className="text-2xl font-bold text-red-600">{session.invalidRecords}</div>
            </div>
            <div>
              <div className="font-medium">Corrected</div>
              <div className="text-2xl font-bold text-yellow-600">{session.correctedRecords}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <select 
                value={filters.status} 
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="valid">Valid</option>
                <option value="invalid">Invalid</option>
                <option value="corrected">Corrected</option>
                <option value="processed">Processed</option>
              </select>
              
              <select 
                value={filters.actionType} 
                onChange={(e) => setFilters(prev => ({ ...prev, actionType: e.target.value }))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Actions</option>
                <option value="insert">New Records</option>
                <option value="update">Updates</option>
                <option value="delete">Deletions</option>
              </select>
              
              <label className="flex items-center space-x-2 text-sm">
                <Checkbox 
                  checked={filters.needsReview}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, needsReview: !!checked }))}
                />
                <span>Needs Review Only</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={selectAllFiltered}
              >
                Select All Valid
              </Button>
              <Button 
                size="sm"
                onClick={processSelectedRecords}
                disabled={selectedRecords.size === 0 || processing.size > 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                Process Selected ({selectedRecords.size})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedRecords.size === filteredRecords.filter(r => 
                        r.validation_status === 'valid' || r.validation_status === 'corrected'
                      ).length && filteredRecords.length > 0}
                      onCheckedChange={selectAllFiltered}
                    />
                  </TableHead>
                  <TableHead>Row</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Vendor Code</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>VCPN</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Total Qty</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} className={record.needs_review ? 'bg-yellow-50' : ''}>
                    <TableCell>
                      {(record.validation_status === 'valid' || record.validation_status === 'corrected') && (
                        <Checkbox 
                          checked={selectedRecords.has(record.id)}
                          onCheckedChange={() => toggleRecordSelection(record.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>{record.row_number}</TableCell>
                    <TableCell>{getStatusBadge(record.validation_status)}</TableCell>
                    <TableCell>{getActionBadge(record.action_type)}</TableCell>
                    
                    {/* Editable fields */}
                    {editingRecord === record.id ? (
                      <>
                        <TableCell>
                          <Input 
                            value={editData.vendor_code || ''} 
                            onChange={(e) => setEditData(prev => ({ ...prev, vendor_code: e.target.value }))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editData.part_number || ''} 
                            onChange={(e) => setEditData(prev => ({ ...prev, part_number: e.target.value }))}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editData.vcpn || ''} 
                            onChange={(e) => setEditData(prev => ({ ...prev, vcpn: e.target.value }))}
                            className="w-28"
                            disabled
                            placeholder="Auto-generated"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editData.long_description || ''} 
                            onChange={(e) => setEditData(prev => ({ ...prev, long_description: e.target.value }))}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {[
                              editData.east_qty, editData.midwest_qty, editData.california_qty,
                              editData.southeast_qty, editData.pacific_nw_qty, editData.texas_qty,
                              editData.great_lakes_qty, editData.florida_qty
                            ].reduce((sum, qty) => sum + (parseInt(qty) || 0), 0)}
                          </span>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{record.vendor_code}</TableCell>
                        <TableCell>{record.part_number}</TableCell>
                        <TableCell>{record.vcpn}</TableCell>
                        <TableCell className="max-w-40 truncate">{record.long_description}</TableCell>
                        <TableCell>
                          {record.total_qty}
                          {record.calculated_total_qty !== record.total_qty && (
                            <span className="text-red-500 text-xs ml-1">
                              (calc: {record.calculated_total_qty})
                            </span>
                          )}
                        </TableCell>
                      </>
                    )}
                    
                    <TableCell className="max-w-48">
                      <div className="text-xs text-gray-600 truncate">
                        {record.validation_notes}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-1">
                        {editingRecord === record.id ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => saveRecord(record.id)}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {record.validation_status === 'invalid' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => startEditing(record)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {(record.validation_status === 'valid' || record.validation_status === 'corrected') && (
                              <Button 
                                size="sm"
                                onClick={() => processRecord(record.id)}
                                disabled={processing.has(record.id)}
                              >
                                {processing.has(record.id) ? '...' : <Upload className="w-3 h-3" />}
                              </Button>
                            )}
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
        </CardContent>
      </Card>
    </div>
  );
}

export default CSVReconciliation;

