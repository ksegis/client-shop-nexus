
import type { InvitationRequest, InvitationResponse } from './types.ts';

export const generateInvitationUrl = (token: string): string => {
  return `https://id-preview--6dd8b04d-be77-46f2-b1a0-1037f4165d18.lovable.app/auth/invite-accept?token=${token}`;
};

export const processInvitation = (request: InvitationRequest): InvitationResponse => {
  console.log('Processing invitation for:', request.email, 'Role:', request.role, 'Token:', request.token);

  const inviteUrl = generateInvitationUrl(request.token);
  console.log('Invitation URL generated:', inviteUrl);

  console.log('Invitation created successfully - email service disabled');

  return {
    success: true,
    message: `Invitation created successfully for ${request.email}. Please share the invitation URL manually.`,
    inviteUrl,
    note: 'Email service is disabled. Please share the invitation URL manually with the user.'
  };
};
