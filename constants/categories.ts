export type TicketCategory =
  | 'hardware'
  | 'software'
  | 'network'
  | 'printer'
  | 'pos'
  | 'cctv'
  | 'email'
  | 'access'
  | 'phone'
  | 'other';

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  hardware: 'Hardware',
  software: 'Software',
  network: 'Network / Internet',
  printer: 'Printer / Scanner',
  pos: 'POS / Billing',
  cctv: 'CCTV / Security',
  email: 'Email / Communication',
  access: 'Access / Permissions',
  phone: 'Phone / Mobile',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<TicketCategory, string> = {
  hardware: 'desktop-outline',
  software: 'code-slash-outline',
  network: 'wifi-outline',
  printer: 'print-outline',
  pos: 'card-outline',
  cctv: 'videocam-outline',
  email: 'mail-outline',
  access: 'key-outline',
  phone: 'phone-portrait-outline',
  other: 'help-circle-outline',
};

export const ALL_CATEGORIES: TicketCategory[] = [
  'hardware', 'software', 'network', 'printer', 'pos',
  'cctv', 'email', 'access', 'phone', 'other',
];

export const SUBCATEGORIES: Record<TicketCategory, string[]> = {
  hardware: [
    'Desktop / Laptop',
    'Monitor / Display',
    'Keyboard / Mouse',
    'UPS / Power',
    'Hard Drive / Storage',
  ],
  software: [
    'Application Crash',
    'Installation / Upgrade',
    'License Issue',
    'Slow Performance',
    'Operating System',
  ],
  network: [
    'No Internet',
    'Slow Connection',
    'Wi-Fi Issue',
    'VPN',
    'Network Cable',
  ],
  printer: [
    'Not Printing',
    'Paper Jam',
    'Driver Issue',
    'Scanner Problem',
    'Ink / Toner',
  ],
  pos: [
    'Billing Error',
    'POS Crash',
    'Card Machine',
    'Barcode Scanner',
    'POS Printer',
  ],
  cctv: [
    'Camera Offline',
    'Recording Issue',
    'DVR / NVR Problem',
    'Camera Angle',
    'Live View Issue',
  ],
  email: [
    'Cannot Send',
    'Cannot Receive',
    'Account Setup',
    'Password Reset',
    'Spam Issue',
  ],
  access: [
    'Account Locked',
    'Permission Denied',
    'New User Setup',
    'Password Change',
    'Software Access',
  ],
  phone: [
    'No Signal',
    'Call Quality',
    'Mobile Data',
    'App Issue',
    'Device Repair',
  ],
  other: [
    'General Query',
    'Maintenance Request',
    'Replacement Request',
    'Training Request',
    'Other',
  ],
};
