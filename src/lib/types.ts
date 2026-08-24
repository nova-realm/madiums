export interface Config {
  footerName: string;
  footerAvatar: string;
  modmailName: string;
  modmailAvatar: string;
  madiumInvite: string;
  madiumSupportInvite: string;
}

export interface QR {
  id: string;
  title: string;
  text: string;
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

export interface ChangelogData {
  timestamp: string;
  message: string;
  footerNote?: string;
}

export interface EasterEggData {
  message: string;
  timestamp: string;
}
