
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useBusiness } from '@/contexts/BusinessContext';
import { X, ShieldCheck, Edit, Database, Eye, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';


const rolePermissions = {
  owner: {
    title: "Owner",
    icon: ShieldCheck,
    color: "text-blue-600",
    permissions: [
      "Has all permissions of an Admin.",
      "Can manage business settings and subscription (coming soon).",
      "Is the ultimate authority and cannot be removed by other members."
    ]
  },
  admin: {
    title: "Admin",
    icon: Edit,
    color: "text-green-600",
    permissions: [
      "Can create, view, and manage all cashbooks.",
      "Can add or remove any member (except the owner) from the business or specific books.",
      "Can manage business-wide categories and payment methods."
    ]
  },
  data_operator: {
    title: "Data Operator",
    icon: Database,
    color: "text-amber-600",
    permissions: [
      "Can only view and manage transactions for books they are explicitly added to.",
      "Cannot create new cashbooks.",
      "Cannot invite or remove other members.",
      "Cannot edit business-wide settings like categories or payment methods."
    ]
  }
}

export function RoleInfoBanner() {
  const { currentUserRole } = useBusiness();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!currentUserRole) {
    return null;
  }
  
  const roleDetails = rolePermissions[currentUserRole];

  return (
    <>
      <Alert className="p-3 mb-6 bg-green-50 border-green-200 shadow-sm">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-green-700" />
                <AlertDescription className="font-medium text-green-800">
                    Your Role: <span className="capitalize font-semibold">{currentUserRole.replace('_', ' ')}</span>
                    <Button variant="link" className="p-0 h-auto ml-2 text-green-800 font-semibold" onClick={() => setIsSheetOpen(true)}>
                        View
                    </Button>
                </AlertDescription>
            </div>
        </div>
      </Alert>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader className="text-left">
            <SheetTitle className="text-2xl">Role Permissions</SheetTitle>
            <SheetDescription>Your role determines what you can see and do within the business.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow pr-6 -mr-6">
            <div className="space-y-8 pt-6">
              {Object.entries(rolePermissions).map(([key, role]) => {
                const Icon = role.icon;
                return (
                  <div key={key} className={cn("p-4 rounded-lg border-2", currentUserRole === key ? 'border-primary bg-primary/5' : 'border-border')}>
                    <div className="flex items-center gap-3 mb-3">
                          <Icon className={cn("h-6 w-6", role.color)} />
                          <h3 className="text-lg font-semibold">{role.title}</h3>
                          {currentUserRole === key && <span className="text-xs font-semibold text-white bg-primary px-2 py-0.5 rounded-full">Your Role</span>}
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                        {role.permissions.map((permission, index) => (
                            <li key={index}>{permission}</li>
                        ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
