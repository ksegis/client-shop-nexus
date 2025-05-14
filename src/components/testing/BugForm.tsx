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
import { Bug, BugStatus, TestSeverity } from '@/types/testing';
import { useTesting } from '@/contexts/testing';
import { useAuth } from '@/contexts/auth';
import { Loader2 } from 'lucide-react';

interface BugFormProps {
  initialData?: Bug;
  onSuccess?: () => void;
  onCancel?: () => void;
  testResultId?: string;
}

// Create a schema for form validation
const bugSchema = z.object({
  title: z.string().min(3, { message: 'Bug title must be at least 3 characters' }),
  description: z.string().min(3, { message: 'Description must be at least 3 characters' }),
  feature_area: z.string().min(1, { message: 'Feature area is required' }),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'wont_fix']),
  severity: z.enum(['trivial', 'minor', 'major', 'critical', 'blocker']),
  steps_to_reproduce: z.string().optional(),
  expected_result: z.string().optional(),
  actual_result: z.string().optional(),
  assigned_to: z.string().optional(),
});

type BugFormValues = z.infer<typeof bugSchema>;

export const BugForm: React.FC<BugFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  testResultId,
}) => {
  const { addBug, updateBug } = useTesting();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<BugFormValues>({
    resolver: zodResolver(bugSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          feature_area: initialData.feature_area,
          status: initialData.status,
          severity: initialData.severity,
          steps_to_reproduce: initialData.steps_to_reproduce || '',
          expected_result: initialData.expected_result || '',
          actual_result: initialData.actual_result || '',
          assigned_to: initialData.assigned_to || '',
        }
      : {
          title: '',
          description: '',
          feature_area: '',
          status: 'open',
          severity: 'minor',
          steps_to_reproduce: '',
          expected_result: '',
          actual_result: '',
          assigned_to: '',
        },
  });

  const onSubmit = async (data: BugFormValues) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        // Update existing bug
        await updateBug(initialData.id, {
          ...data,
        });
      } else {
        // Create new bug - ensure all required fields are present
        await addBug({
          ...data,
          title: data.title,           // Explicitly include required fields
          description: data.description,
          feature_area: data.feature_area,
          status: data.status,
          severity: data.severity,
          reported_by: user?.id || '',
          test_result_id: testResultId,
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bug Title</FormLabel>
              <FormControl>
                <Input placeholder="Login button not working" {...field} />
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
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To (ID)</FormLabel>
                <FormControl>
                  <Input placeholder="Developer ID" {...field} />
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
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="wont_fix">Won't Fix</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="trivial">Trivial</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="blocker">Blocker</SelectItem>
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
                  placeholder="Detailed description of the bug"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="steps_to_reproduce"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Steps to Reproduce</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Step-by-step instructions to reproduce the bug"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="expected_result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Result</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What should happen"
                      className="min-h-[45px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actual_result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Result</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What actually happens"
                      className="min-h-[45px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
              <span>{initialData ? 'Update Bug' : 'Create Bug'}</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
