
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
      from: 'Acme <onboarding@resend.dev>', // Using Resend's verified domain for testing
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

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'success': return '#28a745';
    case 'warning': return '#ffc107';
    case 'error': return '#dc3545';
    case 'info':
    default: return '#667eea';
  }
};

const generateNotificationEmailHTML = (emailData: NotificationEmailData): string => {
  const typeColor = getTypeColor(emailData.type);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${emailData.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${typeColor} 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${emailData.title}</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Shop Management System</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="margin-top: 0; font-size: 16px;">${emailData.message}</p>
        
        ${emailData.actionUrl && emailData.actionText ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${emailData.actionUrl}" 
             style="background: ${typeColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
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
Action: ${emailData.actionText}
Link: ${emailData.actionUrl}
` : ''}

This is an automated notification from the Shop Management System. If you have any questions, please contact your administrator.

Thank you!
Shop Management Team
  `.trim();
};
