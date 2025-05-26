
export interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
}

export interface InvitationResponse {
  success: boolean;
  message: string;
  inviteUrl?: string;
  note?: string;
}
