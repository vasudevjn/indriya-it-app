import { TicketStatus, TicketPriority } from '../types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: '#3B82F6',
  in_progress: '#F59E0B',
  pending: '#8B5CF6',
  resolved: '#10B981',
  closed: '#6B7280',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#7C2D12',
};

export const ALL_STATUSES: TicketStatus[] = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
export const ALL_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];
