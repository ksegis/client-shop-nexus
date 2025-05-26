
import type { InvitationRequest, InvitationResponse } from './types.ts';
import { sendInvitationEmail } from './email-service.ts';

export const generateInvitationUrl = (token: string): string => {
  return `https://id-preview--6dd8b04d-be77-46f2-b1a0-1037f4165d18.lovable.app/auth/invite-accept?token=${token}`;
};

export const processInvitation = async (request: InvitationRequest): Promise<InvitationResponse> => {
  console.log('Processing invitation for:', request.email, 'Role:', request.role, 'Token:', request.token);

  const inviteUrl = generateInvitationUrl(request.token);
  console.log('Invitation URL generated:', inviteUrl);

  // Send email using Resend
  const emailResult = await sendInvitationEmail({
    to: request.email,
    firstName: request.firstName,
    lastName: request.lastName,
    role: request.role,
    inviteUrl
  });

  if (emailResult.success) {
    console.log('Invitation email sent successfully:', emailResult.messageId);
    return {
      success: true,
      message: `Invitation email sent successfully to ${request.email}`,
      inviteUrl,
      note: `Email delivered with ID: ${emailResult.messageId}`
    };
  } else {
    console.error('Failed to send invitation email:', emailResult.error);
    return {
      success: false,
      message: `Failed to send invitation email: ${emailResult.error}. Please use the manual link below.`,
      inviteUrl,
      note: 'Email delivery failed. Please share the invitation URL manually with the user.'
    };
  }
};
