
import { ReactNode, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { InventoryItem } from '@/pages/shop/inventory/types';

interface InventorySearchPopoverProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  results: InventoryItem[];
  onSelect: (item: InventoryItem) => void;
  searchTerm: string;
  onSearchChange?: (value: string) => void;
}

export const InventorySearchPopover = ({
  children,
  isOpen,
  onClose,
  results,
  onSelect,
  searchTerm,
  onSearchChange
}: InventorySearchPopoverProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // When popover opens, focus the input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle item selection
  const handleSelectItem = (item: InventoryItem) => {
    console.log("InventorySearchPopover: Item selected:", item);
    
    // Pass the complete item object to the parent component
    onSelect(item);
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[400px]" align="start">
        <Command>
          <CommandInput 
            ref={inputRef}
            placeholder="Search inventory..." 
            value={searchTerm}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
            <CommandGroup>
              {results.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.sku || ''}-${item.name}`}
                  onSelect={() => handleSelectItem(item)}
                >
                  <div className="w-full flex flex-col">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">${item.price?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between w-full text-xs text-muted-foreground">
                      {item.sku && <span>SKU: {item.sku}</span>}
                      {item.supplier && <span>Vendor: {item.supplier}</span>}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
