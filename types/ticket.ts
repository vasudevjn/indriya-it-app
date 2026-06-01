import { DbTicket, DbTicketAttachment, DbTicketComment, DbProfile, DbStore } from './database';

export interface TicketWithRelations extends DbTicket {
  requester: Pick<DbProfile, 'id' | 'full_name' | 'designation'> | null;
  assignee: Pick<DbProfile, 'id' | 'full_name' | 'designation'> | null;
  store: Pick<DbStore, 'id' | 'name' | 'code' | 'city'> | null;
  attachments: DbTicketAttachment[];
}

export interface CommentWithAuthor extends DbTicketComment {
  author: Pick<DbProfile, 'id' | 'full_name' | 'role'> | null;
}

export interface CreateTicketPayload {
  description: string;
  priority: DbTicket['priority'];
  store_id: string;
  images: { uri: string; name: string }[];
}
