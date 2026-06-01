import * as FileSystem from 'expo-file-system';
import { supabase } from '../supabase';
import { DbTicket, TicketStatus, TicketPriority, DbTicketAttachment } from '../../types';
import { TicketWithRelations } from '../../types/ticket';

interface TicketFilters {
  status?: TicketStatus;
  store_id?: string;
  requester_id?: string;
  assignee_id?: string;
}

const TICKET_SELECT = `
  *,
  requester:profiles!tickets_requester_id_fkey(id, full_name, designation),
  assignee:profiles!tickets_assignee_id_fkey(id, full_name, designation),
  store:stores(id, name, code, city),
  attachments:ticket_attachments(*)
`;

export async function getTickets(filters: TicketFilters = {}): Promise<TicketWithRelations[]> {
  let query = supabase.from('tickets').select(TICKET_SELECT).order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.store_id) query = query.eq('store_id', filters.store_id);
  if (filters.requester_id) query = query.eq('requester_id', filters.requester_id);
  if (filters.assignee_id) query = query.eq('assignee_id', filters.assignee_id);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as TicketWithRelations[];
}

export async function getOpenTickets(): Promise<TicketWithRelations[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .in('status', ['open', 'in_progress'] satisfies TicketStatus[])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as TicketWithRelations[];
}

export async function getTicketById(id: string): Promise<TicketWithRelations> {
  const { data, error } = await supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as unknown as TicketWithRelations;
}

export async function createTicket(payload: {
  requester_id: string;
  store_id: string;
  description: string;
  priority: TicketPriority;
  category?: string | null;
  subcategory?: string | null;
}): Promise<DbTicket> {
  const { data, error } = await supabase
    .from('tickets')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as DbTicket;
}

export async function updateTicket(
  id: string,
  updates: Partial<Pick<DbTicket, 'status' | 'priority' | 'assignee_id' | 'resolution' | 'resolved_at' | 'category' | 'subcategory'>>,
): Promise<DbTicket> {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DbTicket;
}

function getMimeType(fileName: string, fileType: 'image' | 'video' | 'document'): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (fileType === 'image') {
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
    };
    return map[ext] ?? 'image/jpeg';
  }
  if (fileType === 'video') {
    const map: Record<string, string> = {
      mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
      mkv: 'video/x-matroska', webm: 'video/webm',
    };
    return map[ext] ?? 'video/mp4';
  }
  // document
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
  };
  return map[ext] ?? 'application/octet-stream';
}

/**
 * Read a local file URI as a Uint8Array via expo-file-system base64.
 * This is the most reliable approach in React Native -- avoids the RN Blob
 * incompatibility with Supabase JS storage upload.
 */
async function readFileAsBytes(uri: string): Promise<Uint8Array> {
  // expo-image-picker may return content:// or ph:// URIs on some platforms.
  // Copy to the cache dir first so we always have a file:// URI.
  let fileUri = uri;
  if (!uri.startsWith('file://')) {
    const dest = FileSystem.cacheDirectory + `upload_${Date.now()}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    fileUri = dest;
  }

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // atob is available via Hermes (RN 0.64+)
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function uploadAttachment(
  ticketId: string,
  uri: string,
  fileName: string,
  fileType: 'image' | 'video' | 'document' = 'image',
  mimeType?: string,
): Promise<DbTicketAttachment> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `tickets/${ticketId}/${Date.now()}_${safeName}`;
  const contentType = mimeType ?? getMimeType(fileName, fileType);

  // Read file as Uint8Array -- compatible with Supabase JS v2 in React Native
  const bytes = await readFileAsBytes(uri);

  const { error: uploadError } = await supabase.storage
    .from('ticket-attachments')
    .upload(path, bytes, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('ticket_attachments')
    .insert({ ticket_id: ticketId, storage_path: path, file_name: fileName, file_type: fileType })
    .select()
    .single();
  if (error) throw error;
  return data as DbTicketAttachment;
}

export function getAttachmentUrl(path: string): string {
  const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path);
  return data.publicUrl;
}
