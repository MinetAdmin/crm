"use client";

import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const NONE = "__none";

export function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  inputMode,
  required,
}: Readonly<{
  label: string;
  name: string;
  type?: "text" | "email" | "search" | "date" | "month";
  defaultValue?: string;
  placeholder?: string;
  inputMode?: "numeric";
  required?: boolean;
}>) {
  const id = React.useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        required={required}
      />
    </div>
  );
}

export function TextareaField({
  label,
  name,
  rows,
  placeholder,
  required,
}: Readonly<{
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}>) {
  const id = React.useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={name} rows={rows} placeholder={placeholder} required={required} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  defaultValue,
  options,
  emptyLabel = "Not set",
}: Readonly<{
  label: string;
  name: string;
  defaultValue?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  emptyLabel?: string;
}>) {
  const id = React.useId();
  const [value, setValue] = React.useState(defaultValue || NONE);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{emptyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name={name} value={value === NONE ? "" : value} />
    </div>
  );
}

export function CheckboxField({
  label,
  name,
  value,
}: Readonly<{ label: string; name: string; value?: string }>) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} name={name} value={value} />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}
