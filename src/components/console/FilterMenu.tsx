import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type FilterMenuItem = { label: string; href: string; active: boolean };

export function FilterMenu({
  label,
  value,
  items,
}: Readonly<{ label: string; value: string; items: ReadonlyArray<FilterMenuItem> }>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group inline-flex h-[30px] shrink-0 cursor-pointer items-center overflow-hidden rounded-full bg-secondary text-xs text-secondary-foreground shadow-(--pill-shadow) transition-[background-color,box-shadow] duration-150 ease-(--ease-out-strong) outline-none select-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60 data-[state=open]:bg-muted"
        >
          <span className="px-[9px] font-normal text-(--subtle)">{label}</span>
          <span aria-hidden className="h-full w-px bg-foreground/8" />
          <span className="flex items-center gap-1.5 px-[9px] font-medium">
            {value}
            <ChevronDown
              aria-hidden
              className="size-3 text-(--subtle) transition-transform duration-200 ease-(--ease-out-strong) group-data-[state=open]:rotate-180"
            />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex items-center justify-between gap-3">
              {item.label}
              {item.active && <Check className="size-3.5" aria-hidden />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
