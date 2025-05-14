
import React, { useState } from 'react';
import { useTesting } from '@/contexts/testing';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Bug } from 'lucide-react';
import { TestResultsList } from '@/components/testing/TestResultsList';
import { BugsList } from '@/components/testing/BugsList';
import { TestResultForm } from '@/components/testing/TestResultForm';
import { BugForm } from '@/components/testing/BugForm';
import { TestResultDetail } from '@/components/testing/TestResultDetail';
import { BugDetail } from '@/components/testing/BugDetail';
import { TestResult, Bug } from '@/types/testing';
import { useToast } from '@/hooks/use-toast';

const TestingDashboard: React.FC = () => {
  const { 
    isTestingEnabled, 
    enableTesting, 
    disableTesting,
    refreshTestResults, 
    refreshBugs,
    deleteTestResult,
    deleteBug
  } = useTesting();
  
  const [activeTab, setActiveTab] = useState<string>('test-results');
  
  // Dialog states
  const [isAddTestDialogOpen, setIsAddTestDialogOpen] = useState(false);
  const [isAddBugDialogOpen, setIsAddBugDialogOpen] = useState(false);
  const [isEditTestDialogOpen, setIsEditTestDialogOpen] = useState(false);
  const [isEditBugDialogOpen, setIsEditBugDialogOpen] = useState(false);
  
  // Details view states
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  
  // Delete confirmation states
  const [isDeleteTestDialogOpen, setIsDeleteTestDialogOpen] = useState(false);
  const [isDeleteBugDialogOpen, setIsDeleteBugDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Edit states
  const [testToEdit, setTestToEdit] = useState<TestResult | null>(null);
  const [bugToEdit, setBugToEdit] = useState<Bug | null>(null);

  // Report bug from test
  const [testIdForBug, setTestIdForBug] = useState<string | null>(null);

  const { toast } = useToast();

  const handleTestSelect = (testId: string) => {
    setSelectedTestId(testId);
    setSelectedBugId(null);
  };

  const handleBugSelect = (bugId: string) => {
    setSelectedBugId(bugId);
    setSelectedTestId(null);
  };

  const handleAddTest = () => {
    setIsAddTestDialogOpen(true);
  };

  const handleAddBug = () => {
    setIsAddBugDialogOpen(true);
    setTestIdForBug(null);
  };

  const handleAddBugFromTest = (testId: string) => {
    setTestIdForBug(testId);
    setIsAddBugDialogOpen(true);
  };

  const handleEditTest = (testResult: TestResult) => {
    setTestToEdit(testResult);
    setIsEditTestDialogOpen(true);
  };

  const handleEditBug = (bug: Bug) => {
    setBugToEdit(bug);
    setIsEditBugDialogOpen(true);
  };

  const handleDeleteTest = (testId: string) => {
    setItemToDelete(testId);
    setIsDeleteTestDialogOpen(true);
  };

  const handleDeleteBug = (bugId: string) => {
    setItemToDelete(bugId);
    setIsDeleteBugDialogOpen(true);
  };

  const confirmDeleteTest = async () => {
    if (itemToDelete) {
      const success = await deleteTestResult(itemToDelete);
      if (success) {
        setSelectedTestId(null);
        toast({
          title: "Test Result Deleted",
          description: "The test result has been successfully deleted",
        });
      }
    }
    setIsDeleteTestDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmDeleteBug = async () => {
    if (itemToDelete) {
      const success = await deleteBug(itemToDelete);
      if (success) {
        setSelectedBugId(null);
        toast({
          title: "Bug Deleted",
          description: "The bug has been successfully deleted",
        });
      }
    }
    setIsDeleteBugDialogOpen(false);
    setItemToDelete(null);
  };

  const handleBack = () => {
    setSelectedTestId(null);
    setSelectedBugId(null);
  };

  // If testing is not enabled, show a message
  if (!isTestingEnabled) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="flex flex-col items-center justify-center p-8 border rounded-md">
            <h1 className="text-2xl font-bold mb-4">Testing Dashboard</h1>
            <p className="text-center text-muted-foreground mb-4">
              The testing dashboard is currently disabled. Enable it to track test results and bugs.
            </p>
            <Button onClick={enableTesting}>
              Enable Testing Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Testing Dashboard</h1>
          <div className="flex items-center space-x-2">
            {!selectedTestId && !selectedBugId && activeTab === 'test-results' && (
              <Button onClick={handleAddTest}>
                <Plus className="mr-2 h-4 w-4" /> Add Test Result
              </Button>
            )}
            {!selectedTestId && !selectedBugId && activeTab === 'bugs' && (
              <Button onClick={handleAddBug}>
                <Bug className="mr-2 h-4 w-4" /> Report Bug
              </Button>
            )}
            <Button variant="outline" onClick={disableTesting}>
              Disable Testing Dashboard
            </Button>
          </div>
        </div>

        {!selectedTestId && !selectedBugId && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="test-results">Test Results</TabsTrigger>
              <TabsTrigger value="bugs">Bugs</TabsTrigger>
            </TabsList>
            <TabsContent value="test-results">
              <TestResultsList onSelectTestResult={handleTestSelect} />
            </TabsContent>
            <TabsContent value="bugs">
              <BugsList onSelectBug={handleBugSelect} />
            </TabsContent>
          </Tabs>
        )}

        {selectedTestId && (
          <TestResultDetail
            testId={selectedTestId}
            onBack={handleBack}
            onEdit={handleEditTest}
            onDelete={handleDeleteTest}
            onAddBug={handleAddBugFromTest}
          />
        )}

        {selectedBugId && (
          <BugDetail
            bugId={selectedBugId}
            onBack={handleBack}
            onEdit={handleEditBug}
            onDelete={handleDeleteBug}
          />
        )}

        {/* Add Test Dialog */}
        <Dialog open={isAddTestDialogOpen} onOpenChange={setIsAddTestDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Test Result</DialogTitle>
            </DialogHeader>
            <TestResultForm
              onCancel={() => setIsAddTestDialogOpen(false)}
              onSuccess={() => {
                setIsAddTestDialogOpen(false);
                refreshTestResults();
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Test Dialog */}
        <Dialog open={isEditTestDialogOpen} onOpenChange={setIsEditTestDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Test Result</DialogTitle>
            </DialogHeader>
            {testToEdit && (
              <TestResultForm
                initialData={testToEdit}
                onCancel={() => {
                  setIsEditTestDialogOpen(false);
                  setTestToEdit(null);
                }}
                onSuccess={() => {
                  setIsEditTestDialogOpen(false);
                  setTestToEdit(null);
                  refreshTestResults();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Add Bug Dialog */}
        <Dialog open={isAddBugDialogOpen} onOpenChange={setIsAddBugDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Report Bug</DialogTitle>
            </DialogHeader>
            <BugForm
              testResultId={testIdForBug || undefined}
              onCancel={() => {
                setIsAddBugDialogOpen(false);
                setTestIdForBug(null);
              }}
              onSuccess={() => {
                setIsAddBugDialogOpen(false);
                refreshBugs();
                setTestIdForBug(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Bug Dialog */}
        <Dialog open={isEditBugDialogOpen} onOpenChange={setIsEditBugDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Bug</DialogTitle>
            </DialogHeader>
            {bugToEdit && (
              <BugForm
                initialData={bugToEdit}
                onCancel={() => {
                  setIsEditBugDialogOpen(false);
                  setBugToEdit(null);
                }}
                onSuccess={() => {
                  setIsEditBugDialogOpen(false);
                  setBugToEdit(null);
                  refreshBugs();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Test Confirmation */}
        <AlertDialog open={isDeleteTestDialogOpen} onOpenChange={setIsDeleteTestDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Test Result</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the test result and
                any related data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteTestDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteTest}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Bug Confirmation */}
        <AlertDialog open={isDeleteBugDialogOpen} onOpenChange={setIsDeleteBugDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Bug</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the bug and any
                related data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteBugDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteBug}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default TestingDashboard;
