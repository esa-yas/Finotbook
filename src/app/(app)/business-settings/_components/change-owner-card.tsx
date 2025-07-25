
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCog } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChangeOwnerDialog } from './change-owner-dialog';

export function ChangeOwnerCard() {
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Change Business Owner</CardTitle>
                    <CardDescription>Transfer ownership of this business to another member. This action is permanent.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">Current owner: <span className="font-semibold">{user?.email}</span></p>
                </CardContent>
                <CardFooter className="border-t px-6 py-4 flex justify-end">
                    <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Transfer Ownership
                    </Button>
                </CardFooter>
            </Card>
            <ChangeOwnerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </>
    );
}
