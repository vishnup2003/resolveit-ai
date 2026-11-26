export type Role = 'EMPLOYEE' | 'ENGINEER' | 'ADMIN';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  role: Role;
}

export interface AiInsight {
  suggestedCategory: string;
  suggestedPriority: string;
  rootCauseSummary: string;
  recommendedSteps: string;
  generatedAt: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  errorLog?: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  slaDeadline: string;
  resolutionNote?: string;
  resolvedAt?: string;
  reopenReason?: string;
  createdByName: string;
  createdByEmail: string;
  assignedToName: string;
  assignedToEmail?: string;
  aiInsight?: AiInsight;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: number;
  authorName: string;
  authorRole: Role;
  message: string;
  createdAt: string;
}

export interface EngineerSummary {
  id: number;
  name: string;
  email: string;
  department: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  ticketId?: number;
  ticketNumber?: string;
  isRead: boolean;
  createdAt: string;
}