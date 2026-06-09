import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { createTicket, updateTicket, uploadAttachment, getTicketById } from '../lib/api/tickets';
import { addComment } from '../lib/api/comments';
import { notifyTechnicians, createNotification } from '../lib/api/notifications';
import { TicketStatus, TicketPriority } from '../types';
import { TicketWithRelations } from '../types/ticket';
import { useUiStore } from '../stores/uiStore';
import { useTicketDraftStore, AttachmentItem } from '../stores/ticketDraftStore';
import { router } from 'expo-router';
import { useCurrentUser } from './useCurrentUser';

export function useCreateTicket() {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const reset = useTicketDraftStore((s) => s.reset);
  const { profile } = useCurrentUser();

  return useMutation({
    mutationFn: async (payload: {
      description: string;
      priority: TicketPriority;
      store_id: string;
      category?: string;
      subcategory?: string;
      attachments: AttachmentItem[];
    }) => {
      if (!profile) throw new Error('Not authenticated');
      const ticket = await createTicket({
        requester_id: profile.id,
        store_id: payload.store_id,
        description: payload.description,
        priority: payload.priority,
        category: payload.category ?? null,
        subcategory: payload.subcategory ?? null,
      });

      // Upload attachments -- errors are per-file and never block ticket navigation
      for (const att of payload.attachments) {
        try {
          await uploadAttachment(ticket.id, att.uri, att.name, att.type, att.mimeType);
        } catch (err) {
          console.error('[uploadAttachment] failed for', att.name, err);
        }
      }

      // Notify technicians -- best-effort, never blocks
      notifyTechnicians(
        ticket.id,
        'New IT Ticket',
        payload.description.slice(0, 80),
        'ticket_created',
      ).catch((err) => console.error('[notifyTechnicians] failed', err));

      return ticket;
    },
    onSuccess: (ticket) => {
      reset();
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tickets() });
      showToast('Ticket created successfully', 'success');
      router.replace(`/tickets/${ticket.id}`);
    },
    onError: () => showToast('Failed to create ticket', 'error'),
  });
}

export function useUpdateTicket(ticketId: string) {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (updates: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assignee_id?: string;
      resolution?: string;
      resolved_at?: string;
      description?: string;
    }) => updateTicket(ticketId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticket(ticketId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tickets() });
      showToast('Ticket updated', 'success');
    },
    onError: () => showToast('Failed to update ticket', 'error'),
  });
}

export function useAddComment(ticketId: string) {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const { profile } = useCurrentUser();

  return useMutation({
    mutationFn: async (payload: { body: string; is_internal?: boolean }) => {
      if (!profile) throw new Error('Not authenticated');
      const comment = await addComment({
        ticket_id: ticketId,
        author_id: profile.id,
        ...payload,
      });

      // Send notification to the other party (skip internal-only comments)
      if (!payload.is_internal) {
        // Prefer cached ticket; fall back to a fresh fetch so this always works
        let ticket = qc.getQueryData<TicketWithRelations>(QUERY_KEYS.ticket(ticketId));
        if (!ticket) {
          try { ticket = await getTicketById(ticketId); } catch { ticket = undefined; }
        }

        if (ticket) {
          // Requester -> notify their assigned technician
          // Technician / Admin -> notify the requester
          const recipientId =
            profile.role === 'requester'
              ? ticket.assignee_id
              : ticket.requester_id;

          if (recipientId) {
            createNotification({
              recipient_id: recipientId,
              ticket_id: ticketId,
              title: `New comment on ${ticket.ticket_number}`,
              body: `${profile.full_name}: ${payload.body.slice(0, 80)}`,
              type: 'ticket_comment',
            }).catch((err) =>
              console.error('[useAddComment] notification failed:', err),
            );
          }
        }
      }

      return comment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketComments(ticketId) });
    },
    onError: () => showToast('Failed to add comment', 'error'),
  });
}

export function useAssignTicket(ticketId: string, requesterId: string) {
  const qc = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);
  const { profile } = useCurrentUser();

  return useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Not authenticated');
      const ticket = await updateTicket(ticketId, {
        assignee_id: profile.id,
        status: 'in_progress',
      });
      await createNotification({
        recipient_id: requesterId,
        ticket_id: ticketId,
        title: `Ticket Assigned`,
        body: `Your ticket ${ticket.ticket_number} has been assigned to ${profile.full_name}`,
        type: 'ticket_assigned',
      });
      return ticket;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticket(ticketId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tickets() });
      showToast('Ticket assigned to you', 'success');
    },
    onError: () => showToast('Failed to assign ticket', 'error'),
  });
}
