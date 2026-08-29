export interface Config {
  footerName: string;
  footerAvatar: string;
  modmailName: string;
  modmailAvatar: string;
  madiumWebsite?: string;
  madiumInvite: string;
  madiumSupportInvite: string;
}

export interface QR {
  id: string;
  title: string;
  text: string;
  attachments?: string[];
  enabled?: boolean;
}

export interface MadiumStatus {
  status: 'working' | 'downgrade' | 'updating';
  version?: string;
  workingMsg?: string;
}

export interface SupportStatus {
  status: 'working' | 'unavailable';
}

export interface StatusData {
  madium: MadiumStatus;
  support: SupportStatus;
}

export interface ChangelogEntry {
  date: string;
  items: string[];
}

export interface ChangelogData {
  title?: string;
  footerNote?: string;
  entries?: ChangelogEntry[];
  // Legacy single-entry fields
  timestamp?: string;
  message?: string;
}

export interface EasterEggData {
  message: string;
  timestamp: string;
}
