
import { ReactNode } from 'react';
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
}

export const InventorySearchPopover = ({
  children,
  isOpen,
  onClose,
  results,
  onSelect,
  searchTerm
}: InventorySearchPopoverProps) => {
  return (
    <Popover open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[400px]" align="start">
        <Command>
          <CommandInput 
            placeholder="Search inventory..." 
            value={searchTerm}
            readOnly
          />
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
            <CommandGroup>
              {results.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.sku || ''}-${item.name}`}
                  onSelect={() => onSelect(item)}
                >
                  <div className="w-full flex flex-col">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">${item.price.toFixed(2)}</span>
                    </div>
                    {item.sku && (
                      <span className="text-xs text-muted-foreground">
                        SKU: {item.sku}
                      </span>
                    )}
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
