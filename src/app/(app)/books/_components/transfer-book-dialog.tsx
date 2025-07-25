
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBusiness, type Book } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

const transferBookSchema = z.object({
  destinationBusinessId: z.string().min(1, { message: 'Please select a destination business.' }),
});

type TransferBookFormValues = z.infer<typeof transferBookSchema>;

interface TransferBookDialogProps {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferBookDialog({ book, open, onOpenChange }: TransferBookDialogProps) {
  const { userBusinesses, currentBusiness, transferBook } = useBusiness();
  const [loading, setLoading] = useState(false);

  const otherBusinesses = userBusinesses.filter(b => b.id !== currentBusiness?.id);

  const form = useForm<TransferBookFormValues>({
    resolver: zodResolver(transferBookSchema),
  });

  const onSubmit = async (values: TransferBookFormValues) => {
    setLoading(true);
    const success = await transferBook(book.id, values.destinationBusinessId);
    if (success) {
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Transfer Book</DialogTitle>
            <DialogDescription>
              Transfer &quot;{book.name}&quot; to another business you own. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Destination Business</Label>
               <Select
                  onValueChange={(value) => form.setValue('destinationBusinessId', value, { shouldValidate: true })}
                  defaultValue={form.getValues('destinationBusinessId')}
                  disabled={otherBusinesses.length === 0}
              >
                  <SelectTrigger>
                      <SelectValue placeholder="Select a business..." />
                  </SelectTrigger>
                  <SelectContent>
                      {otherBusinesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                              {business.name}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              {form.formState.errors.destinationBusinessId && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.destinationBusinessId.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
             <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer Book
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
