
'use client';

import { useState } from 'react';
import { useBook } from '@/contexts/BookContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, UserPlus, X, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';


const getInitials = (name?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'U';
};

export function BookMembersSettings() {
    const { user } = useAuth();
    const { book, bookMembers, addBookMember, removeBookMember, loading: bookLoading } = useBook();
    const { currentBusiness, businessMembers, loading: businessLoading } = useBusiness();
    const { toast } = useToast();
    const [selectedMemberId, setSelectedMemberId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loading = bookLoading || businessLoading.members;

    // Filter out users who are already members of this book
    const availableBusinessMembers = businessMembers.filter(
        (bm) => !bookMembers.some((member) => member.id === bm.id)
    );

    const handleAddMember = async () => {
        if (!selectedMemberId) {
            toast({ variant: 'destructive', description: 'Please select a member to add.' });
            return;
        }
        if (!book) return;

        setIsSubmitting(true);
        const success = await addBookMember(selectedMemberId);
        if (success) {
            toast({ title: 'Success', description: 'Member added to the book.' });
            setSelectedMemberId('');
        }
        setIsSubmitting(false);
    };

    const handleRemoveMember = async (userId: string) => {
        if (!book) return;
        
        if (userId === currentBusiness?.owner_id) {
            toast({ variant: 'destructive', title: 'Action not allowed', description: 'The business owner cannot be removed from a book.' });
            return;
        }

        await removeBookMember(userId);
        toast({ title: 'Success', description: 'Member removed from the book.' });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Add Members</CardTitle>
                    <CardDescription>Manage your cashflow together with your business partners, family or friends by adding them as members</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                     <div className="flex-grow">
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId} disabled={loading || isSubmitting}>
                            <SelectTrigger className="max-w-xs">
                                <SelectValue placeholder="Select a team member to add" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableBusinessMembers.length > 0 ? availableBusinessMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                       {member.full_name || member.email}
                                    </SelectItem>
                                )) : <div className="p-4 text-center text-sm text-muted-foreground">No other members to add.</div>}
                            </SelectContent>
                        </Select>
                     </div>
                    <Button onClick={handleAddMember} disabled={loading || isSubmitting || !selectedMemberId}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        Add Member
                    </Button>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Total Members ({bookMembers.length})</h3>
                    <Button asChild variant="link" className="text-primary">
                        <Link href="/team">View roles & permissions <ChevronRight className="h-4 w-4" /></Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                         <div className="space-y-2">
                            {bookMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 [&:not(:last-child)]:border-b">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{member.id === user?.id ? "You" : (member.full_name || member.email)}</p>
                                            <span className="text-sm text-muted-foreground">{member.email}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {member.role === 'owner' ? (
                                            <div className="text-sm text-muted-foreground font-medium">Owner</div>
                                        ) : (
                                           <div className="text-sm text-muted-foreground font-medium capitalize">{member.role.replace('_', ' ')}</div>
                                        )}
                                        {member.id !== currentBusiness?.owner_id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={loading || isSubmitting}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
