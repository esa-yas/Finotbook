
'use client';

import { Card } from "@/components/ui/card";
import { useNotifications, BusinessInvitation } from "@/contexts/NotificationContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, X, Loader2 } from "lucide-react";

interface NotificationCardProps {
    invitation: BusinessInvitation;
}

export function NotificationCard({ invitation }: NotificationCardProps) {
    const { acceptInvitation, declineInvitation, loading } = useNotifications();
    const isProcessing = loading[invitation.id];

    // If the associated business has been deleted, don't render the card.
    if (!invitation.businesses) {
        return null;
    }

    const message = `You've been invited to join the business "${invitation.businesses.name}" as a ${invitation.role.replace('_', ' ')}.`;

    return (
        <Card className="p-4 flex items-start gap-4">
            <Avatar className="h-10 w-10 border">
                <AvatarFallback className="bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <p className="text-sm">{message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                </p>
                <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" onClick={() => acceptInvitation(invitation)} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Join
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => declineInvitation(invitation.id)} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                        Decline
                    </Button>
                </div>
            </div>
        </Card>
    )
}
