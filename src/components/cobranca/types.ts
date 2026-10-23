// src/components/cobranca/types.ts
// Tipos para a Central Inteligente de Cobranças V4.0 - Kombat Moto Peças

export interface CreditNote {
  id: number;
  sale_id?: string;
  identifier: string;
  original_value: number;
  paid_value: number;
  balance: number;
  due_date: string;
  sale_date?: string;
  status: 'Pendente' | 'Aberto' | 'Atrasado' | 'Pago' | 'Negociado';
  collection_status?: 'PENDENTE' | 'PREPARADA' | 'ABERTA_WHATSAPP' | 'ENVIADA' | 'QUITADA' | 'PARCIALMENTE_PAGA' | 'RENEGOCIADO' | 'FALHOU';
  last_collection_at?: string;
  next_collection_at?: string;
  promise_date?: string;
  promise_amount?: number;
  parcel_number: number;
  total_parcels: number;
  moto_details?: string;
  days_overdue: number;
  is_overdue: boolean;
  is_due_today: boolean;
}

export interface CustomerDebtGroup {
  customer_id: number;
  customer_name: string;
  nickname?: string;
  whatsapp: string;
  phone: string;
  cpf: string;
  address: string;
  neighborhood: string;
  city: string;
  credit_status: string;
  credit_limit: number;
  credit_block_reason?: string;
  notes: CreditNote[];
  total_original: number;
  total_paid: number;
  total_balance: number;
  total_overdue: number;
  total_upcoming: number;
  max_overdue_days: number;
  has_overdue: boolean;
  open_notes_count: number;
}

export interface CobrancaDashboardStats {
  totalReceivable: number;
  totalOverdue: number;
  totalUpcoming: number;
  totalMonthReceived: number;
  overdueCustomersCount: number;
  collectionsSentCount: number;
  recoveredAmount: number;
  blockedCustomersCount: number;
  recoveryRate: number;
  aging: {
    d1_15: number;
    d16_30: number;
    d31_60: number;
    d60_plus: number;
  };
}

export interface WhatsAppTemplate {
  id: string;
  code: 'A' | 'B' | 'C' | 'D' | 'E';
  title: string;
  description: string;
  body: string;
  is_active: boolean;
}

export interface CollectionScheduleStage {
  id: string;
  days: number;
  timing: 'before' | 'on' | 'after';
  name: string;
  description: string;
  action_label: string;
  is_active: boolean;
  suggested_template: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface CreditAgreement {
  id: number;
  customer_id: number;
  original_total: number;
  discount_authorized: number;
  down_payment: number;
  negotiated_total: number;
  installments_count: number;
  first_due_date: string;
  status: string;
  observation?: string;
  created_at: string;
}

export interface CollectionHistoryItem {
  id: number;
  user_id: number;
  customer_id: number;
  credit_id?: number;
  action_type: string;
  message?: string;
  channel?: string;
  status?: string;
  created_at: string;
  metadata?: any;
}

export interface CollectionSettingsV4 {
  reminder_days: number;
  first_collection_days: number;
  second_collection_days: number;
  strong_collection_days: number;
  block_days: number;
  admin_days: number;
  default_fine: number;
  default_interest: number;
  pix_key: string;
  pix_type: string;
  stages_config?: string | Record<string, boolean>;
  whatsapp_templates?: string | Record<string, WhatsAppTemplate>;
}
