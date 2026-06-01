import { supabase } from '../supabase';
import { DbProfile, UserRole, ApprovalStatus } from '../../types';

export async function getProfile(id: string): Promise<DbProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as DbProfile;
}

export async function updateProfile(id: string, updates: Partial<DbProfile>): Promise<DbProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DbProfile;
}

export async function updatePushToken(id: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', id);
  if (error) throw error;
}

export async function getPendingTechnicians(): Promise<DbProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'technician' satisfies UserRole)
    .eq('approval_status', 'pending' satisfies ApprovalStatus)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbProfile[];
}

export async function getTechnicians(): Promise<DbProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'technician' satisfies UserRole)
    .eq('approval_status', 'approved' satisfies ApprovalStatus);
  if (error) throw error;
  return (data ?? []) as DbProfile[];
}

export async function updateApprovalStatus(
  id: string,
  status: ApprovalStatus,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ approval_status: status })
    .eq('id', id);
  if (error) throw error;
}
