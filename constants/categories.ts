export type TicketCategory =
  | 'application_issues'
  | 'data_and_reporting'
  | 'data_sync_issue'
  | 'digital_issues'
  | 'facility_maintenance'
  | 'franchisee_service'
  | 'infrastructure_issues';

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  application_issues: 'Application Issues',
  data_and_reporting: 'Data and Reporting',
  data_sync_issue: 'Data Sync Issue',
  digital_issues: 'Digital Issues',
  facility_maintenance: 'Facility / Maintenance Issues',
  franchisee_service: 'Franchisee Service',
  infrastructure_issues: 'Infrastructure Issues',
};

export const CATEGORY_ICONS: Record<TicketCategory, string> = {
  application_issues: 'apps-outline',
  data_and_reporting: 'bar-chart-outline',
  data_sync_issue: 'sync-outline',
  digital_issues: 'globe-outline',
  facility_maintenance: 'construct-outline',
  franchisee_service: 'business-outline',
  infrastructure_issues: 'server-outline',
};

export const ALL_CATEGORIES: TicketCategory[] = [
  'application_issues',
  'data_and_reporting',
  'data_sync_issue',
  'digital_issues',
  'facility_maintenance',
  'franchisee_service',
  'infrastructure_issues',
];

export const SUBCATEGORIES: Record<TicketCategory, string[]> = {
  application_issues: [
    'ERP - Finance',
    'ERP - ISCM',
    'ERP - Merch',
    'Marketing',
    'POS',
    'Power BI',
    'Other',
  ],
  data_and_reporting: [
    'Data and Reporting - Issues',
  ],
  data_sync_issue: [
    'ERP-DW Data Issues',
  ],
  digital_issues: [
    'Indriya Website',
    'Saksham',
    'Solitaire',
    'Sparkle',
  ],
  facility_maintenance: [
    'Facility Equipment Incident',
  ],
  franchisee_service: [
    'Franchisee Incident',
  ],
  infrastructure_issues: [
    'Email',
    'Hardware',
    'Infosecurity',
    'Network',
    'Software',
  ],
};
