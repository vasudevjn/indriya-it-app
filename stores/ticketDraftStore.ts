import { create } from 'zustand';
import { TicketPriority } from '../types';
import { TicketCategory } from '../constants/categories';

export interface AttachmentItem {
  uri: string;
  name: string;
  type: 'image' | 'video' | 'document';
  mimeType?: string;
}

interface DraftMessage {
  id: string;
  text: string;
  sender: 'user' | 'system';
}

interface TicketDraftStore {
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  subcategory: string;
  attachments: AttachmentItem[];
  messages: DraftMessage[];
  step: 'description' | 'category' | 'attachments' | 'confirm';
  setDescription: (description: string) => void;
  setPriority: (priority: TicketPriority) => void;
  setCategory: (category: TicketCategory) => void;
  setSubcategory: (subcategory: string) => void;
  addAttachment: (item: AttachmentItem) => void;
  removeAttachment: (uri: string) => void;
  addMessage: (message: Omit<DraftMessage, 'id'>) => void;
  setStep: (step: TicketDraftStore['step']) => void;
  reset: () => void;
}

const initialState = {
  description: '',
  priority: 'medium' as TicketPriority,
  category: 'application_issues' as TicketCategory,
  subcategory: 'ERP - Finance',
  attachments: [] as AttachmentItem[],
  messages: [] as DraftMessage[],
  step: 'description' as const,
};

export const useTicketDraftStore = create<TicketDraftStore>((set) => ({
  ...initialState,
  setDescription: (description) => set({ description }),
  setPriority: (priority) => set({ priority }),
  setCategory: (category) => set({ category }),
  setSubcategory: (subcategory) => set({ subcategory }),
  addAttachment: (item) => set((s) => ({ attachments: [...s.attachments, item] })),
  removeAttachment: (uri) => set((s) => ({ attachments: s.attachments.filter((a) => a.uri !== uri) })),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, { ...message, id: Date.now().toString() }] })),
  setStep: (step) => set({ step }),
  reset: () => set(initialState),
}));
