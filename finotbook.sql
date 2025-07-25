-- This script creates ONLY the transactions table and its related policies.
-- It is safe to run even if other tables already exist.

-- Create the "transactions" table to store financial entries.
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    book_id uuid NOT NULL,
    date timestamp with time zone NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    type character varying NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_book_id_fkey FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);

-- Secure the "transactions" table with Row Level Security.
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view transactions for books they own.
CREATE POLICY "Allow users to view their own book transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
  book_id IN (
    SELECT id FROM public.books WHERE business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
);

-- Policy: Allow users to insert transactions for books they own.
CREATE POLICY "Allow users to insert transactions for their own books"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  book_id IN (
    SELECT id FROM public.books WHERE business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
);
