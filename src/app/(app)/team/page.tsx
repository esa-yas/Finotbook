

'use client';

import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddMemberDialog } from './_components/add-member-dialog';
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

const getInitials = (name?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'U';
};

export default function TeamPage() {
  const { business, businessMembers, loading, removeMember } = useBusiness();
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);


  if (loading.members) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">Invite and manage members of your business.</p>
          </div>
          <Button onClick={() => setIsAddMemberDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Members</CardTitle>
            <CardDescription>
              These users have been invited to your business and can be added to individual cashbooks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {businessMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.full_name || member.email}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  {member.id !== business?.owner_id ? (
                     <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                 <DropdownMenuItem onClick={() => setMemberToRemove(member)}>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Remove Member
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove {member.full_name || member.email} from your business and all associated cashbooks. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setMemberToRemove(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        removeMember(member.id);
                                        setMemberToRemove(null);
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Yes, remove member
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="text-sm text-muted-foreground font-medium">Owner</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <AddMemberDialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen} />
    </>
  );
}
