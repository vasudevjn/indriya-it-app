export type UserRole = 'requester' | 'technician' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationType =
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_assigned'
  | 'ticket_resolved'
  | 'ticket_comment'
  | 'broadcast';

export interface DbStore {
  id: string;
  code: string;
  name: string;
  city: string | null;
  region: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbProfile {
  id: string;
  store_id: string | null;
  full_name: string;
  phone: string | null;
  designation: string | null;
  role: UserRole;
  approval_status: ApprovalStatus;
  expo_push_token: string | null;
  created_at: string;
}

export interface DbTicket {
  id: string;
  ticket_number: string;
  requester_id: string;
  assignee_id: string | null;
  store_id: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  subcategory: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTicketAttachment {
  id: string;
  ticket_id: string;
  storage_path: string;
  file_name: string | null;
  file_type: 'image' | 'video' | 'document' | null;
  created_at: string;
}

export interface DbTicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface DbNotification {
  id: string;
  recipient_id: string;
  ticket_id: string | null;
  title: string;
  body: string | null;
  type: NotificationType | null;
  is_read: boolean;
  created_at: string;
}

export interface DbBroadcast {
  id: string;
  sender_id: string;
  target_store_id: string | null;   // legacy single-store (kept for compat)
  target_store_ids: string[] | null; // multi-store selection (requires SQL migration)
  title: string;
  body: string;
  created_at: string;
}
