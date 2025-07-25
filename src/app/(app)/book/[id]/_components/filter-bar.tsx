
'use client';

import React from 'react';
import { useBook } from '@/contexts/BookContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, User, Tag, CreditCard, Contact } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/contexts/BusinessContext';

export function FilterBar() {
  const { filters, setFilters, bookMembers } = useBook();
  const { categories, paymentMethods, contacts } = useBusiness();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = React.useState(false);

  const handleDatePreset = (preset: 'all' | 'today' | 'yesterday' | 'this_month' | 'last_month') => {
    setFilters(prev => ({ ...prev, date: preset }));
    setDateRange(undefined);
    setIsDatePopoverOpen(false);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    // Only update filter and close if both from and to are selected
    if (range?.from && range.to) {
      setFilters(prev => ({ ...prev, date: { from: range.from!, to: range.to! } }));
      setIsDatePopoverOpen(false);
    } else if (range?.from && !range.to) {
      // If user clicks a date after selecting a range, start a new range
      setFilters(prev => ({ ...prev, date: 'all' }));
    }
  };

  const displayDateText = React.useMemo(() => {
    if (typeof filters.date === 'string') {
      return {
        all: 'All Time',
        today: 'Today',
        yesterday: 'Yesterday',
        this_month: 'This Month',
        last_month: 'Last Month',
      }[filters.date];
    }
    // Check if 'from' and 'to' exist before formatting
    if (filters.date.from && filters.date.to) {
        return `${format(filters.date.from, 'LLL d, y')} - ${format(filters.date.to, 'LLL d, y')}`;
    }
    return 'Select Date Range';
  }, [filters.date]);

  const datePresets: {label: string, value: 'all' | 'today' | 'yesterday' | 'this_month' | 'last_month'}[] = [
      { label: 'All Time', value: 'all' },
      { label: 'Today', value: 'today' },
      { label: 'Yesterday', value: 'yesterday' },
      { label: 'This Month', value: 'this_month' },
      { label: 'Last Month', value: 'last_month' },
  ];

  return (
    <div className="flex gap-2 items-center">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2">
          {/* Date Filter */}
          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal shrink-0">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="truncate">{displayDateText}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="p-2 border-r space-y-1 w-40">
                    <h4 className="text-sm font-medium text-muted-foreground px-2 py-1.5">Date Presets</h4>
                    {datePresets.map(preset => (
                        <Button
                            key={preset.value}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start font-normal",
                                filters.date === preset.value && "bg-accent font-semibold"
                            )}
                            onClick={() => handleDatePreset(preset.value)}
                        >
                            {preset.label}
                        </Button>
                    ))}
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Entry Type Filter */}
          <Select value={filters.type} onValueChange={value => setFilters(prev => ({ ...prev, type: value as 'all' | 'credit' | 'debit' }))}>
            <SelectTrigger className="w-[180px] shrink-0">
              <SelectValue placeholder="Entry Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entry Types</SelectItem>
              <SelectItem value="credit">Cash In</SelectItem>
              <SelectItem value="debit">Cash Out</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Category Filter */}
          <Select value={filters.category} onValueChange={value => setFilters(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="w-[180px] shrink-0">
              <Tag className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Payment Mode Filter */}
          <Select value={filters.paymentMode} onValueChange={value => setFilters(prev => ({ ...prev, paymentMode: value }))}>
            <SelectTrigger className="w-[180px] shrink-0">
              <CreditCard className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Payment Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Modes</SelectItem>
              {paymentMethods.map(method => (
                <SelectItem key={method.id} value={method.name}>{method.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Contact Filter */}
          <Select value={filters.contact} onValueChange={value => setFilters(prev => ({ ...prev, contact: value }))}>
            <SelectTrigger className="w-[180px] shrink-0">
              <Contact className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Contacts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contacts</SelectItem>
              {contacts.map(contact => (
                <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>


          {/* Member Filter */}
          <Select value={filters.member} onValueChange={value => setFilters(prev => ({ ...prev, member: value }))}>
            <SelectTrigger className="w-[180px] shrink-0">
              <User className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {bookMembers.map(member => (
                <SelectItem key={member.id} value={member.id}>{member.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ScrollBar orientation="horizontal" className="h-2"/>
      </ScrollArea>
    </div>
  );
}
