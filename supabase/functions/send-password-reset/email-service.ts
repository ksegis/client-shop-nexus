
import { Resend } from "npm:resend@3.2.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

export interface PasswordResetEmailData {
  to: string;
  resetUrl: string;
}

export const sendPasswordResetEmail = async (emailData: PasswordResetEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log('Sending password reset email to:', emailData.to);
    
    const { data, error } = await resend.emails.send({
      from: 'Shop Management <noreply@yourdomain.com>', // Replace with your verified domain
      to: [emailData.to],
      subject: 'Reset Your Password',
      html: generatePasswordResetEmailHTML(emailData),
      text: generatePasswordResetEmailText(emailData)
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Password reset email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Password reset email service error:', error);
    return { success: false, error: error.message };
  }
};

const generatePasswordResetEmailHTML = (emailData: PasswordResetEmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Shop Management System</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        
        <p>We received a request to reset your password for your Shop Management System account.</p>
        
        <p>To reset your password, please click the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${emailData.resetUrl}" 
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </p>
        <p style="word-break: break-all; color: #667eea; font-size: 14px;">
          ${emailData.resetUrl}
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px;">
          <strong>Security Notice:</strong> This password reset link will expire in 1 hour for security reasons.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-bottom: 0;">
          If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    </body>
    </html>
  `;
};

const generatePasswordResetEmailText = (emailData: PasswordResetEmailData): string => {
  return `
Password Reset Request

We received a request to reset your password for your Shop Management System account.

To reset your password, please visit the following link:
${emailData.resetUrl}

This password reset link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

Thank you!
Shop Management Team
  `.trim();
};
