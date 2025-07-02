
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string, attachments: File[]) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() && attachments.length === 0) return;
    
    onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t p-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center bg-muted rounded-md px-3 py-1">
              <span className="text-sm truncate max-w-[150px]">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          className="min-h-[60px] flex-1"
          disabled={disabled}
        />
        
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            size="icon"
            onClick={handleSendMessage}
            disabled={disabled || (message.trim() === '' && attachments.length === 0)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
