import { TicketCategory } from '../../constants/categories';

interface KeywordRule {
  category: TicketCategory;
  subcategory: string;
  keywords: string[];
}

const RULES: KeywordRule[] = [
  // Application Issues
  { category: 'application_issues', subcategory: 'ERP - Finance', keywords: ['erp finance', 'finance module', 'accounts', 'ledger', 'payment entry', 'financial report', 'tally', 'invoice'] },
  { category: 'application_issues', subcategory: 'ERP - ISCM', keywords: ['iscm', 'supply chain', 'procurement', 'purchase order', 'vendor', 'inventory management'] },
  { category: 'application_issues', subcategory: 'ERP - Merch', keywords: ['merch', 'merchandise', 'erp merch', 'product catalog', 'assortment', 'buying'] },
  { category: 'application_issues', subcategory: 'Marketing', keywords: ['marketing', 'campaign', 'promotion', 'crm', 'customer data', 'loyalty', 'sms', 'email campaign'] },
  { category: 'application_issues', subcategory: 'POS', keywords: ['pos', 'billing software', 'billing system', 'point of sale', 'retail software', 'billing error', 'receipt', 'invoice issue'] },
  { category: 'application_issues', subcategory: 'Power BI', keywords: ['power bi', 'powerbi', 'dashboard', 'report not loading', 'bi report', 'analytics dashboard'] },
  { category: 'application_issues', subcategory: 'Other', keywords: ['application error', 'app not working', 'software crash', 'not responding', 'application issue'] },

  // Data and Reporting
  { category: 'data_and_reporting', subcategory: 'Data and Reporting - Issues', keywords: ['data report', 'report issue', 'wrong data', 'incorrect report', 'missing data', 'data mismatch', 'report error', 'data discrepancy'] },

  // Data Sync Issue
  { category: 'data_sync_issue', subcategory: 'ERP-DW Data Issues', keywords: ['data sync', 'sync issue', 'data not syncing', 'erp dw', 'data warehouse', 'replication', 'data not updated', 'sync failed'] },

  // Digital Issues
  { category: 'digital_issues', subcategory: 'Indriya Website', keywords: ['indriya website', 'website issue', 'website not working', 'website down', 'web page', 'site error'] },
  { category: 'digital_issues', subcategory: 'Saksham', keywords: ['saksham'] },
  { category: 'digital_issues', subcategory: 'Solitaire', keywords: ['solitaire'] },
  { category: 'digital_issues', subcategory: 'Sparkle', keywords: ['sparkle'] },

  // Facility / Maintenance Issues
  { category: 'facility_maintenance', subcategory: 'Facility Equipment Incident', keywords: ['facility', 'maintenance', 'air conditioner', 'ac not working', 'light not working', 'electrical', 'plumbing', 'building issue', 'furniture', 'generator', 'ups', 'power failure'] },

  // Franchisee Service
  { category: 'franchisee_service', subcategory: 'Franchisee Incident', keywords: ['franchisee', 'franchise', 'franchisee issue', 'store issue', 'outlet problem'] },

  // Infrastructure Issues
  { category: 'infrastructure_issues', subcategory: 'Email', keywords: ['email not sending', 'mail not sending', 'email not receiving', 'inbox empty', 'email setup', 'outlook', 'email password', 'cannot send mail', 'email issue'] },
  { category: 'infrastructure_issues', subcategory: 'Hardware', keywords: ['computer', 'laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'hard drive', 'storage', 'printer', 'scanner', 'barcode', 'hardware issue', 'device not working'] },
  { category: 'infrastructure_issues', subcategory: 'Infosecurity', keywords: ['virus', 'malware', 'ransomware', 'hacked', 'security breach', 'phishing', 'firewall', 'antivirus', 'unauthorized access', 'data breach', 'infosecurity'] },
  { category: 'infrastructure_issues', subcategory: 'Network', keywords: ['no internet', 'internet not working', 'wifi', 'wi-fi', 'network issue', 'slow internet', 'vpn', 'lan', 'no connection', 'disconnected', 'network cable'] },
  { category: 'infrastructure_issues', subcategory: 'Software', keywords: ['windows', 'operating system', 'install', 'update', 'upgrade', 'license', 'activation', 'driver', 'software not opening', 'slow performance'] },
];

export function classifyTicket(description: string): { category: TicketCategory; subcategory: string } {
  const lower = description.toLowerCase();

  const scoreMap = new Map<string, { category: TicketCategory; subcategory: string; score: number }>();

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    }
    if (score === 0) continue;

    const key = `${rule.category}|${rule.subcategory}`;
    const existing = scoreMap.get(key);
    if (!existing || score > existing.score) {
      scoreMap.set(key, { category: rule.category, subcategory: rule.subcategory, score });
    }
  }

  if (!scoreMap.size) {
    return { category: 'application_issues', subcategory: 'Other' };
  }

  let best = { category: 'application_issues' as TicketCategory, subcategory: 'Other', score: 0 };
  for (const entry of scoreMap.values()) {
    if (entry.score > best.score) {
      best = entry;
    }
  }

  return { category: best.category, subcategory: best.subcategory };
}
