
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useBusiness, type Book } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Briefcase, MessageSquare, PlusCircle, Search, Users, Pencil, Copy, UserPlus, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateFirstBook } from './_components/create-first-book';
import { cn } from '@/lib/utils';
import { RoleInfoBanner } from './_components/role-info-banner';
import { useIsClient } from '@/hooks/use-is-client';
import { format } from 'date-fns';

const AddBookDialog = dynamic(() => import('./_components/add-book-dialog').then(mod => mod.AddBookDialog), { ssr: false });
const ShortcutsSheet = dynamic(() => import('./_components/shortcuts-sheet').then(mod => mod.ShortcutsSheet), { ssr: false });
const DuplicateBookDialog = dynamic(() => import('./_components/duplicate-book-dialog').then(mod => mod.DuplicateBookDialog), { ssr: false });
const TransferBookDialog = dynamic(() => import('./_components/transfer-book-dialog').then(mod => mod.TransferBookDialog), { ssr: false });

export default function BooksPage() {
  const { user, loading: authLoading } = useAuth();
  const { books, loading: businessLoading, userBusinesses, currentBusiness, currentUserRole, getCurrencySymbol } = useBusiness();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('created_at_desc');
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false);
  const [isShortcutsSheetOpen, setIsShortcutsSheetOpen] = useState(false);
  const [bookToDuplicate, setBookToDuplicate] = useState<Book | null>(null);
  const [bookToTransfer, setBookToTransfer] = useState<Book | null>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  const filteredAndSortedBooks = useMemo(() => {
    const filtered = books.filter(book =>
      book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      switch (sortOrder) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_at_asc':
          return dateA - dateB;
        case 'created_at_desc':
        default:
          return dateB - dateA;
      }
    });
  }, [books, searchQuery, sortOrder]);

  const isLoading = !isClient || authLoading || businessLoading.sync;
  const isOwner = currentUserRole === 'owner';
  const canTransfer = isOwner && userBusinesses.length > 1;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <header>
                    <Skeleton className="h-8 w-1/2" />
                </header>
                
                <Skeleton className="h-12 w-full" />

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Skeleton className="h-11 flex-1 w-full" />
                    <Skeleton className="h-11 w-full sm:w-[180px]" />
                </div>

                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <div className="hidden lg:flex items-center justify-end gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-36" />
                </div>
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  if (userBusinesses.length === 0) {
    return <CreateFirstBook />;
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <header>
            <h1 className="text-2xl font-bold">{currentBusiness?.name}</h1>
          </header>

          <RoleInfoBanner />
          
           {/* Mobile-only Shortcut Bar */}
          <div className="flex items-center gap-2 lg:hidden">
            <Button variant="outline" className="flex-1" onClick={() => setIsShortcutsSheetOpen(true)}>Shortcuts</Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/team">
                <Users className="mr-2 h-4 w-4" />
                Business Team
              </Link>
            </Button>
          </div>


          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by book name..."
                className="pl-10 h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full sm:w-[180px] h-11">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at_desc">Sort By: Last Updated</SelectItem>
                  <SelectItem value="created_at_asc">Sort By: First Created</SelectItem>
                  <SelectItem value="name_asc">Sort By: Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Sort By: Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredAndSortedBooks.map((book) => (
              <Card key={book.id} className="group hover:shadow-md transition-shadow duration-200 flex flex-col">
                <CardContent className="p-4 flex-grow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-grow truncate">
                      <div className="p-3 bg-blue-100/60 rounded-lg">
                        <Briefcase className="h-6 w-6 text-blue-700" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-base truncate">{book.name}</p>
                        <p className="text-sm text-muted-foreground">
                           Updated {format(new Date(book.created_at), "dd MMM, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                        "font-semibold text-lg text-right",
                        book.balance >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                       <span className="block">{getCurrencySymbol(book.currency)}{new Intl.NumberFormat('en-US').format(book.balance)}</span>
                       <span className="text-xs font-normal text-muted-foreground">Net Balance</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-2 flex items-center justify-between">
                    <div className="flex items-center">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                        <Link href={`/book/${book.id}/settings`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setBookToDuplicate(book)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" asChild>
                          <Link href={`/book/${book.id}/settings`}>
                          <UserPlus className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canTransfer && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setBookToTransfer(book)}>
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                     <Button variant="ghost" className="text-sm font-semibold" asChild>
                        <Link href={`/book/${book.id}`}>
                           View Book <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="hidden lg:flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsShortcutsSheetOpen(true)}>Shortcuts</Button>
            <Button variant="outline" asChild>
              <Link href="/team">
                <Users className="mr-2 h-4 w-4" />
                Business Team
              </Link>
            </Button>
          </div>

          <Button
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base"
            onClick={() => setIsAddBookDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Book
          </Button>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <p className="font-semibold">Need help in business setup?</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Our support team will help you</p>
            <Button variant="link" className="text-primary p-0 h-auto">
              Contact Us
            </Button>
          </Card>
        </div>
      </div>
      {isAddBookDialogOpen && <AddBookDialog open={isAddBookDialogOpen} onOpenChange={setIsAddBookDialogOpen} />}
      {isShortcutsSheetOpen && <ShortcutsSheet open={isShortcutsSheetOpen} onOpenChange={setIsShortcutsSheetOpen} />}
      {bookToDuplicate && (
        <DuplicateBookDialog
          open={!!bookToDuplicate}
          onOpenChange={(isOpen) => { if (!isOpen) setBookToDuplicate(null); }}
          bookToDuplicate={bookToDuplicate}
        />
      )}
      {bookToTransfer && (
        <TransferBookDialog
          book={bookToTransfer}
          open={!!bookToTransfer}
          onOpenChange={(isOpen) => { if (!isOpen) setBookToTransfer(null); }}
        />
      )}
    </>
  );
}
