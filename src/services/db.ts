
import Dexie, { type Table } from 'dexie';

// --- From Auth Context ---
export interface Profile {
  id: string; // The user_id
  email: string;
  full_name: string | null;
  last_selected_business_id?: string | null;
}

// --- From Business Context ---
export interface Business {
  id: string;
  name: string;
  owner_id: string;
  currency: string;
  address?: string;
  staff_size?: string;
  category?: string;
  subcategory?: string;
  business_type?: string;
  registration_type?: string;
  phone_number?: string;
  contact_email?: string;
  is_verified?: boolean;
}

export interface Book {
  id:string;
  name: string;
  business_id: string;
  created_at: string;
  currency: string;
  owner_id: string;
  balance: number; // This will be calculated and stored locally
}

export interface Category {
    id: string;
    name: string;
    business_id: string;
}

export interface PaymentMethod {
    id: string;
    name: string;
    business_id: string;
}

export type MemberRole = 'owner' | 'admin' | 'data_operator';

export interface BusinessMember {
    id: string; // This is the user_id
    email: string;
    full_name: string | null;
    role: MemberRole;
    business_id: string; // For querying
}

export interface BookMember {
    id?: number; // Auto-incrementing primary key for Dexie
    book_id: string;
    user_id: string;
}

export interface Contact {
  id: string;
  business_id: string;
  name: string;
  phone_number?: string;
  created_at: string;
}

// --- From Book Context ---
export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id: string;
  book_id: string;
  date: string; // ISO 8601 string
  description: string;
  amount: number;
  type: TransactionType;
  created_at: string; // Ensure this is part of the type
  user_id: string; // ID of the user who made the entry
  user_email: string; // Email of the user for display
  user_full_name: string | null;
  category?: string;
  payment_mode?: string;
  contact_id?: string;
  custom_fields?: Record<string, any>;
  attachment_url_1?: string;
  attachment_url_2?: string;
  attachment_url_3?: string;
  attachment_url_4?: string;
}

export interface BookCustomField {
    id: string;
    book_id: string;
    field_name: string;
    field_type: string;
    is_enabled: boolean;
    is_required: boolean;
    created_at: string;
}

// --- From Notification Context ---
export interface BusinessInvitation {
  id: string;
  business_id: string;
  email: string;
  role: MemberRole;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  businesses: {
      name: string;
  }
}

// --- Global Data ---
export interface Currency {
    code: string;
    name: string;
    symbol: string;
}


export class AppDatabase extends Dexie {
  businesses!: Table<Business>;
  books!: Table<Book>;
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  paymentMethods!: Table<PaymentMethod>;
  businessMembers!: Table<BusinessMember>;
  bookMembers!: Table<BookMember>;
  bookCustomFields!: Table<BookCustomField>;
  contacts!: Table<Contact>;
  invitations!: Table<BusinessInvitation>;
  currencies!: Table<Currency>;
  profiles!: Table<Profile>;

  constructor() {
    super('finotbookDB');
    this.version(8).stores({
      businesses: '&id, name, currency, phone_number, contact_email',
      books: '&id, business_id, name, created_at, currency',
      transactions: '&id, book_id, date, type, category, created_at, user_id, contact_id, description',
      categories: '&id, business_id, name',
      paymentMethods: '&id, business_id, name',
      businessMembers: '&id, business_id, email, full_name, role',
      bookMembers: '++id, &[book_id+user_id], user_id',
      bookCustomFields: '&id, book_id, field_name',
      contacts: '&id, business_id, name',
      invitations: '&id, email, status',
      currencies: '&code, name',
      profiles: '&id, email, last_selected_business_id',
    });
  }
}

export const db = new AppDatabase();
