-- 1. Businesses Table
-- Stores information about each business entity in the application.
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Books Table
-- Stores accounting books, linked to a specific business.
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transactions Table
-- Stores individual financial transactions, linked to a specific book.
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) for all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;


-- 5. RLS Policies for Businesses
-- Users can only see and manage businesses they own.
CREATE POLICY "Enable read access for own businesses" ON businesses
FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Enable insert access for own businesses" ON businesses
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Enable update access for own businesses" ON businesses
FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Enable delete access for own businesses" ON businesses
FOR DELETE USING (auth.uid() = owner_id);


-- 6. RLS Policies for Books
-- Users can manage books that belong to a business they own.
CREATE POLICY "Enable read access for books in own businesses" ON books
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = books.business_id AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Enable insert access for books in own businesses" ON books
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = books.business_id AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Enable update access for books in own businesses" ON books
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = books.business_id AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Enable delete access for books in own businesses" ON books
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = books.business_id AND businesses.owner_id = auth.uid()
  )
);


-- 7. RLS Policies for Transactions
-- Users can manage transactions that belong to books within their own businesses.
CREATE POLICY "Enable read access for transactions in own books" ON transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM books
    JOIN businesses ON books.business_id = businesses.id
    WHERE books.id = transactions.book_id AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Enable insert access for transactions in own books" ON transactions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM books
    JOIN businesses ON books.business_id = businesses.id
    WHERE books.id = transactions.book_id AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Enable update access for transactions in own books" ON transactions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM books
    JOIN businesses ON books.business_id = businesses.id
    WHERE books.id = transactions.book_id AND businesses.owner_id = auth.uid()
  )
);

CREATE POLICY "Enable delete access for transactions in own books" ON transactions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM books
    JOIN businesses ON books.business_id = businesses.id
    WHERE books.id = transactions.book_id AND businesses.owner_id = auth.uid()
  )
);
