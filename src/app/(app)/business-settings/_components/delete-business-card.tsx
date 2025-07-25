
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';

interface DeleteBusinessCardProps {
    business: {
        id: string;
        name: string;
    }
}

export function DeleteBusinessCard({ business }: DeleteBusinessCardProps) {
    const [loading, setLoading] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');
    const { deleteBusiness } = useBusiness();
    const isConfirmationMatch = confirmationText === business.name;

    const handleDelete = async () => {
        setLoading(true);
        await deleteBusiness(business.id);
        // The context handles navigation, so we don't need to do it here.
        // The component will unmount on success.
    };

    return (
        <Card className="border-red-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Danger Zone
                </CardTitle>
                <CardDescription>These actions are irreversible. Please be certain.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <h4 className="font-semibold">Delete this Business</h4>
                    <p className="text-sm text-muted-foreground">
                        Once you delete this business, there is no going back. All associated data, including cashbooks and transactions, will be permanently deleted.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Business</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action is permanent and cannot be undone. This will delete the business <strong>{business.name}</strong> and all of its associated data.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                         <div className="space-y-2 py-2">
                            <Label htmlFor="confirmation">Please type <span className="font-bold text-foreground">{business.name}</span> to confirm.</Label>
                            <Input
                                id="confirmation"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={!isConfirmationMatch || loading}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                I understand, delete this business
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}
