
'use client';

import { useState } from 'react';
import { useBook } from '@/contexts/BookContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface DeleteBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBookDialog({ open, onOpenChange }: DeleteBookDialogProps) {
  const { book, deleteBook } = useBook();
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  
  const isConfirmationMatch = confirmationText === book?.name;

  const handleDelete = async () => {
    setLoading(true);
    const success = await deleteBook();
    if (success) {
      onOpenChange(false);
    }
    setLoading(false);
  };

  if (!book) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is permanent. This will delete the book <strong>{book.name}</strong> and all of its transactions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="confirmation">Please type <span className="font-bold text-foreground">{book.name}</span> to confirm.</Label>
          <Input
            id="confirmation"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationMatch || loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I understand, delete this book
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
