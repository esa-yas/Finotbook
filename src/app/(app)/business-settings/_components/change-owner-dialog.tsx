
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const changeOwnerSchema = z.object({
  newOwnerId: z.string().uuid({ message: 'Please select a new owner.' }),
  password: z.string().min(6, { message: 'Password is required to confirm.' }),
});

type ChangeOwnerFormValues = z.infer<typeof changeOwnerSchema>;

interface ChangeOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeOwnerDialog({ open, onOpenChange }: ChangeOwnerDialogProps) {
  const { user } = useAuth();
  const { businessMembers, currentBusiness, transferOwnership, loading } = useBusiness();
  const { toast } = useToast();

  const otherMembers = businessMembers.filter(m => m.id !== user?.id);

  const form = useForm<ChangeOwnerFormValues>({
    resolver: zodResolver(changeOwnerSchema),
  });

  const onSubmit = async (values: ChangeOwnerFormValues) => {
    if (!currentBusiness) return;

    const success = await transferOwnership(currentBusiness.id, values.newOwnerId, values.password);

    if (success) {
      toast({
        title: 'Ownership Transfer Initiated',
        description: 'Ownership has been successfully transferred.',
      });
      onOpenChange(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Transfer Business Ownership</DialogTitle>
            <DialogDescription>
              Select a new owner and confirm with your password. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
                You will lose ownership privileges and become an Admin. The new owner will have full control.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newOwnerId">New Owner</Label>
               <Select
                  onValueChange={(value) => form.setValue('newOwnerId', value, { shouldValidate: true })}
                  defaultValue={form.getValues('newOwnerId')}
                  disabled={otherMembers.length === 0 || loading.members}
              >
                  <SelectTrigger id="newOwnerId">
                      <SelectValue placeholder="Select a team member..." />
                  </SelectTrigger>
                  <SelectContent>
                      {otherMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                             {member.full_name || member.email}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              {form.formState.errors.newOwnerId && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.newOwnerId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Confirm Your Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
                placeholder="Enter your current password"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
             <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer Ownership
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
