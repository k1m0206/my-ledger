export type LedgerType = 'income' | 'expense';

export interface LedgerItem {
  id: number;
  amount: number;
  type: LedgerType;
  category: string;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerSummary {
  total_income: number;
  total_expense: number;
  net_income: number;
  count: number;
}

export interface Categories {
  income: string[];
  expense: string[];
}

export interface CategoryItem {
  name: string;
  icon: string;
}

export interface CategoryConfig {
  income: CategoryItem[];
  expense: CategoryItem[];
}
