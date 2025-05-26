
import { Resend } from "npm:resend@3.2.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export interface NotificationEmailData {
  to: string;
  subject: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export const sendNotificationEmail = async (emailData: NotificationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log('Sending notification email to:', emailData.to);
    
    const { data, error } = await resend.emails.send({
      from: 'Shop Management <noreply@yourdomain.com>', // Replace with your verified domain
      to: [emailData.to],
      subject: emailData.subject,
      html: generateNotificationEmailHTML(emailData),
      text: generateNotificationEmailText(emailData)
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Notification email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Notification email service error:', error);
    return { success: false, error: error.message };
  }
};

const getColorForType = (type: string): { primary: string; light: string } => {
  switch (type) {
    case 'success':
      return { primary: '#10b981', light: '#d1fae5' };
    case 'warning':
      return { primary: '#f59e0b', light: '#fef3c7' };
    case 'error':
      return { primary: '#ef4444', light: '#fee2e2' };
    default:
      return { primary: '#667eea', light: '#e0e7ff' };
  }
};

const generateNotificationEmailHTML = (emailData: NotificationEmailData): string => {
  const colors = getColorForType(emailData.type);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailData.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${colors.primary}; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${emailData.title}</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Shop Management System</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <div style="background: ${colors.light}; padding: 20px; border-radius: 8px; border-left: 4px solid ${colors.primary}; margin-bottom: 20px;">
          <p style="margin: 0; color: #374151;">${emailData.message}</p>
        </div>
        
        ${emailData.actionUrl && emailData.actionText ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${emailData.actionUrl}" 
               style="background: ${colors.primary}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              ${emailData.actionText}
            </a>
          </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px; margin-bottom: 0;">
          This is an automated notification from the Shop Management System. If you have any questions, please contact your administrator.
        </p>
      </div>
    </body>
    </html>
  `;
};

const generateNotificationEmailText = (emailData: NotificationEmailData): string => {
  return `
${emailData.title}

${emailData.message}

${emailData.actionUrl && emailData.actionText ? `
${emailData.actionText}: ${emailData.actionUrl}
` : ''}

This is an automated notification from the Shop Management System. If you have any questions, please contact your administrator.

Thank you!
Shop Management Team
  `.trim();
};
