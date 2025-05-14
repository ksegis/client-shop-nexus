
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Image, X } from 'lucide-react';

interface ServiceUpdateFormProps {
  onSubmit: (data: {
    content: string;
    milestone?: string;
    milestone_completed?: boolean;
    images?: File[];
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const ServiceUpdateForm: React.FC<ServiceUpdateFormProps> = ({
  onSubmit,
  isSubmitting
}) => {
  const [content, setContent] = useState('');
  const [milestone, setMilestone] = useState('');
  const [milestoneCompleted, setMilestoneCompleted] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    await onSubmit({
      content,
      milestone: showMilestone ? milestone : undefined,
      milestone_completed: showMilestone ? milestoneCompleted : undefined,
      images: images.length > 0 ? images : undefined
    });
    
    // Reset form
    setContent('');
    setMilestone('');
    setMilestoneCompleted(false);
    setShowMilestone(false);
    setImages([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImages([...images, ...Array.from(e.target.files)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Service Update</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label>Update Details</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share details about the service progress..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="milestone"
              checked={showMilestone}
              onCheckedChange={(checked) => setShowMilestone(checked as boolean)}
            />
            <Label htmlFor="milestone" className="cursor-pointer">
              Add milestone
            </Label>
          </div>
          
          {showMilestone && (
            <div className="pl-6 space-y-2 border-l-2 border-muted">
              <div>
                <Label>Milestone Name</Label>
                <Input
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value)}
                  placeholder="e.g., Parts ordered, Inspection completed"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed"
                  checked={milestoneCompleted}
                  onCheckedChange={(checked) => setMilestoneCompleted(checked as boolean)}
                />
                <Label htmlFor="completed" className="cursor-pointer">
                  Mark as completed
                </Label>
              </div>
            </div>
          )}
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Add Photos (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-4 w-4 mr-2" />
                Add Photo
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="h-24 w-full object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="ml-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Post Update
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
