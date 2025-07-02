
import { Resend } from "npm:resend@3.2.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export interface EmailData {
  to: string;
  firstName: string;
  lastName: string;
  role: string;
  inviteUrl: string;
}

export const sendInvitationEmail = async (emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log('Sending invitation email to:', emailData.to);
    
    const { data, error } = await resend.emails.send({
      from: 'CTC <CTC@noreply.modworx.online>',
      to: [emailData.to],
      subject: `You're invited to join as ${emailData.role}`,
      html: generateInvitationEmailHTML(emailData),
      text: generateInvitationEmailText(emailData)
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

const generateInvitationEmailHTML = (emailData: EmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to Join Shop Management System</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Join the Shop Management System</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${emailData.firstName} ${emailData.lastName}!</h2>
        
        <p>You've been invited to join our Shop Management System as a <strong>${emailData.role}</strong>.</p>
        
        <p>To get started, please click the button below to set up your account:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${emailData.inviteUrl}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; color: #667eea; font-size: 14px;">
          ${emailData.inviteUrl}
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px; margin-bottom: 0;">
          This invitation will expire in 36 hours. If you didn't expect this invitation or have any questions, please contact your administrator.
        </p>
      </div>
    </body>
    </html>
  `;
};

const generateInvitationEmailText = (emailData: EmailData): string => {
  return `
Hello ${emailData.firstName} ${emailData.lastName}!

You've been invited to join our Shop Management System as a ${emailData.role}.

To get started, please visit the following link to set up your account:
${emailData.inviteUrl}

This invitation will expire in 36 hours. If you didn't expect this invitation or have any questions, please contact your administrator.

Thank you!
Shop Management Team
  `.trim();
};
