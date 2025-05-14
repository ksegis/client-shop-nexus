
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TestResult, TestStatus, TestPriority } from '@/types/testing';
import { useTesting } from '@/contexts/testing';
import { useAuth } from '@/contexts/auth';
import { Loader2 } from 'lucide-react';

interface TestResultFormProps {
  initialData?: TestResult;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Create a schema for form validation
const testResultSchema = z.object({
  test_name: z.string().min(3, { message: 'Test name must be at least 3 characters' }),
  description: z.string().min(3, { message: 'Description must be at least 3 characters' }),
  feature_area: z.string().min(1, { message: 'Feature area is required' }),
  status: z.enum(['passed', 'failed', 'in_progress', 'blocked']),
  environment: z.string().min(1, { message: 'Environment is required' }),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  steps_to_reproduce: z.string().optional(),
});

type TestResultFormValues = z.infer<typeof testResultSchema>;

export const TestResultForm: React.FC<TestResultFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { addTestResult, updateTestResult } = useTesting();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TestResultFormValues>({
    resolver: zodResolver(testResultSchema),
    defaultValues: initialData
      ? {
          test_name: initialData.test_name,
          description: initialData.description,
          feature_area: initialData.feature_area,
          status: initialData.status,
          environment: initialData.environment,
          priority: initialData.priority,
          steps_to_reproduce: initialData.steps_to_reproduce || '',
        }
      : {
          test_name: '',
          description: '',
          feature_area: '',
          status: 'in_progress',
          environment: '',
          priority: 'medium',
          steps_to_reproduce: '',
        },
  });

  const onSubmit = async (data: TestResultFormValues) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        // Update existing test
        await updateTestResult(initialData.id, {
          ...data,
        });
      } else {
        // Create new test
        await addTestResult({
          ...data,
          tester_id: user?.id || '',
        });
      }
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="test_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test Name</FormLabel>
              <FormControl>
                <Input placeholder="Login functionality" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="feature_area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feature Area</FormLabel>
                <FormControl>
                  <Input placeholder="Authentication" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="environment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Environment</FormLabel>
                <FormControl>
                  <Input placeholder="Production / Staging / Dev" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the test case"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="steps_to_reproduce"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Steps to Reproduce</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Step-by-step instructions to reproduce the test case"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{initialData ? 'Updating' : 'Creating'}</span>
              </>
            ) : (
              <span>{initialData ? 'Update Test Result' : 'Create Test Result'}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
