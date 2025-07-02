
import { Mail, Phone } from 'lucide-react';

interface ContactInfoProps {
  contactEmail?: string;
  contactPhone?: string | null;
}

export const ContactInfo = ({ contactEmail, contactPhone }: ContactInfoProps) => {
  if (!contactEmail && !contactPhone) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {contactEmail && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Contact Email:</span>
          </div>
          <p className="text-sm text-muted-foreground">{contactEmail}</p>
        </div>
      )}
      
      {contactPhone && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Contact Phone:</span>
          </div>
          <p className="text-sm text-muted-foreground">{contactPhone}</p>
        </div>
      )}
    </div>
  );
};
