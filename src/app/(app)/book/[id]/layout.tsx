
import { BookProvider } from '@/contexts/BookContext';
import React from 'react';

export default function BookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <BookProvider bookId={params.id}>
        {children}
    </BookProvider>
  );
}
