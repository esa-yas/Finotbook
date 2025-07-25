
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface ShortcutsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShortcutKey = ({ children }: { children: React.ReactNode }) => (
    <kbd className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-primary/10 border border-border rounded-md">
        {children}
    </kbd>
);

export function ShortcutsSheet({ open, onOpenChange }: ShortcutsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-xl">Keyboard Shortcuts</SheetTitle>
        </SheetHeader>
        <div className="space-y-8">
            <div>
                <h3 className="text-sm font-semibold text-red-500 mb-4">General Shortcuts</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm">Open keyboard shortcut help</p>
                        <ShortcutKey>?</ShortcutKey>
                    </div>
                     <div className="flex items-center justify-between">
                        <p className="text-sm">Move focus to the next input/button</p>
                        <ShortcutKey>tab</ShortcutKey>
                    </div>
                     <div className="flex items-center justify-between">
                        <p className="text-sm">Move focus to the previous input/button</p>
                        <ShortcutKey>shift + tab</ShortcutKey>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-red-500 mb-4">Entry-Form Shortcuts</h3>
                <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <p className="text-sm">Open 'Add Cash In' popup</p>
                        <ShortcutKey>C + I</ShortcutKey>
                    </div>
                     <div className="flex items-center justify-between">
                        <p className="text-sm">Open 'Add Cash Out' popup</p>
                        <ShortcutKey>C + O</ShortcutKey>
                    </div>
                     <div className="flex items-center justify-between">
                        <p className="text-sm">Save &amp; Move to next entry</p>
                        <ShortcutKey>Enter</ShortcutKey>
                    </div>
                </div>
            </div>
        </div>
        <Separator className="my-6" />
        <div className="text-xs text-muted-foreground space-y-2">
            <p>• When a shortcut includes "+" (plus), then the keys must be pressed simultaneously.</p>
            <p>• Some shortcuts might not be available on all screens e.g. c+i will not be available on your profile page.</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
