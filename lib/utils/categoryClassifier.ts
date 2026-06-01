import { TicketCategory } from '../../constants/categories';

interface KeywordRule {
  category: TicketCategory;
  subcategory: string;
  keywords: string[];
}

const RULES: KeywordRule[] = [
  // Hardware
  { category: 'hardware', subcategory: 'Desktop / Laptop', keywords: ['computer', 'laptop', 'desktop', 'pc', 'cpu', 'system not starting', 'not booting', 'black screen', 'freeze', 'hangs', 'restarting', 'overheating'] },
  { category: 'hardware', subcategory: 'Monitor / Display', keywords: ['monitor', 'display', 'screen flicker', 'flickering', 'no display', 'blank screen', 'resolution'] },
  { category: 'hardware', subcategory: 'Keyboard / Mouse', keywords: ['keyboard', 'mouse', 'cursor', 'keys not working', 'touchpad', 'scroll'] },
  { category: 'hardware', subcategory: 'UPS / Power', keywords: ['ups', 'power failure', 'battery backup', 'power cut', 'power issue', 'not charging'] },
  { category: 'hardware', subcategory: 'Hard Drive / Storage', keywords: ['hard drive', 'storage', 'disk full', 'hdd', 'ssd', 'pendrive', 'usb drive', 'data loss', 'no space'] },

  // Software
  { category: 'software', subcategory: 'Application Crash', keywords: ['crash', 'not responding', 'application error', 'software not opening', 'app not working', 'error message', 'force close', 'not launching'] },
  { category: 'software', subcategory: 'Installation / Upgrade', keywords: ['install', 'update', 'upgrade', 'setup', 'download software', 'uninstall'] },
  { category: 'software', subcategory: 'License Issue', keywords: ['license', 'activation', 'trial expired', 'not activated', 'serial key', 'product key'] },
  { category: 'software', subcategory: 'Slow Performance', keywords: ['slow', 'lagging', 'sluggish', 'takes long', 'not fast', 'performance', 'hanging'] },
  { category: 'software', subcategory: 'Operating System', keywords: ['windows', 'os', 'operating system', 'blue screen', 'bsod', 'format', 'reinstall', 'startup', 'boot'] },

  // Network
  { category: 'network', subcategory: 'No Internet', keywords: ['no internet', 'internet not working', 'not connected', 'no connection', 'disconnected', 'offline', 'cannot browse', 'no network'] },
  { category: 'network', subcategory: 'Slow Connection', keywords: ['slow internet', 'internet slow', 'buffering', 'low speed', 'bandwidth', 'speed issue'] },
  { category: 'network', subcategory: 'Wi-Fi Issue', keywords: ['wifi', 'wi-fi', 'wireless', 'router', 'hotspot', 'signal weak', 'wifi not connecting'] },
  { category: 'network', subcategory: 'VPN', keywords: ['vpn', 'remote access', 'tunnel', 'vpn not connecting'] },
  { category: 'network', subcategory: 'Network Cable', keywords: ['ethernet', 'lan cable', 'network cable', 'rj45', 'switch', 'patch cable'] },

  // Printer
  { category: 'printer', subcategory: 'Not Printing', keywords: ['printer not working', 'not printing', 'print error', 'print job stuck', 'print queue'] },
  { category: 'printer', subcategory: 'Paper Jam', keywords: ['paper jam', 'paper stuck', 'jam', 'paper feed'] },
  { category: 'printer', subcategory: 'Driver Issue', keywords: ['printer driver', 'driver not found', 'driver error', 'printer not detected'] },
  { category: 'printer', subcategory: 'Scanner Problem', keywords: ['scanner', 'scanning', 'scan not working', 'document scanner', 'scanned document'] },
  { category: 'printer', subcategory: 'Ink / Toner', keywords: ['ink', 'toner', 'cartridge', 'print quality', 'faded print', 'streaks', 'color issue'] },

  // POS
  { category: 'pos', subcategory: 'POS Crash', keywords: ['pos', 'billing software', 'billing system', 'sales software', 'point of sale', 'retail software'] },
  { category: 'pos', subcategory: 'Billing Error', keywords: ['billing error', 'wrong invoice', 'receipt issue', 'billing issue', 'wrong price'] },
  { category: 'pos', subcategory: 'Card Machine', keywords: ['card machine', 'swipe machine', 'payment terminal', 'card reader', 'card not reading', 'edc', 'tap to pay', 'contactless'] },
  { category: 'pos', subcategory: 'Barcode Scanner', keywords: ['barcode', 'barcode scanner', 'scanner not reading', 'qr code', 'item not scanning'] },
  { category: 'pos', subcategory: 'POS Printer', keywords: ['receipt printer', 'thermal printer', 'billing printer', 'pos printer'] },

  // CCTV
  { category: 'cctv', subcategory: 'Camera Offline', keywords: ['cctv', 'camera not working', 'camera offline', 'camera feed', 'camera dead'] },
  { category: 'cctv', subcategory: 'Recording Issue', keywords: ['recording', 'not recording', 'dvr', 'nvr', 'footage', 'playback', 'video lost'] },
  { category: 'cctv', subcategory: 'DVR / NVR Problem', keywords: ['dvr', 'nvr', 'hard disk recorder', 'network recorder'] },
  { category: 'cctv', subcategory: 'Live View Issue', keywords: ['live view', 'live feed', 'monitor not showing', 'screen blank cctv'] },

  // Email
  { category: 'email', subcategory: 'Cannot Send', keywords: ['email not sending', 'mail not sending', 'outbox stuck', 'email stuck', 'cannot send mail'] },
  { category: 'email', subcategory: 'Cannot Receive', keywords: ['email not receiving', 'no emails', 'mail not receiving', 'inbox empty', 'missing emails'] },
  { category: 'email', subcategory: 'Account Setup', keywords: ['email setup', 'configure email', 'outlook setup', 'gmail setup', 'new email'] },
  { category: 'email', subcategory: 'Password Reset', keywords: ['email password', 'forgot email password', 'email password reset', 'locked out email'] },
  { category: 'email', subcategory: 'Cannot Send', keywords: ['email', 'mail'] },

  // Access
  { category: 'access', subcategory: 'Account Locked', keywords: ['account locked', 'account blocked', 'cannot login to system', 'login failed', 'access denied', 'account disabled'] },
  { category: 'access', subcategory: 'Permission Denied', keywords: ['permission denied', 'not authorized', 'restricted access', 'cannot access folder', 'unauthorized'] },
  { category: 'access', subcategory: 'New User Setup', keywords: ['new user', 'create account', 'new account', 'user setup', 'onboard'] },
  { category: 'access', subcategory: 'Password Change', keywords: ['change password', 'reset password', 'forgot password', 'password expired'] },
  { category: 'access', subcategory: 'Software Access', keywords: ['software access', 'need access', 'no access to', 'grant access', 'role change'] },

  // Phone
  { category: 'phone', subcategory: 'No Signal', keywords: ['no signal', 'no network on phone', 'sim issue', 'call not connecting'] },
  { category: 'phone', subcategory: 'Mobile Data', keywords: ['mobile data', '4g', '5g', 'data not working', 'mobile internet', 'mobile hotspot'] },
  { category: 'phone', subcategory: 'App Issue', keywords: ['mobile app', 'phone app', 'android', 'ios issue', 'app crashing'] },
  { category: 'phone', subcategory: 'Call Quality', keywords: ['call quality', 'voice not clear', 'call dropping', 'echo', 'distorted voice'] },
];

export function classifyTicket(description: string): { category: TicketCategory; subcategory: string } {
  const lower = description.toLowerCase();

  const scoreMap = new Map<string, { category: TicketCategory; subcategory: string; score: number }>();

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        // Longer keyword matches score higher (more specific)
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
    return { category: 'other', subcategory: 'General Query' };
  }

  let best = { category: 'other' as TicketCategory, subcategory: 'General Query', score: 0 };
  for (const entry of scoreMap.values()) {
    if (entry.score > best.score) {
      best = entry;
    }
  }

  return { category: best.category, subcategory: best.subcategory };
}
