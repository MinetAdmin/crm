"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { Notice } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type FormSheetState = {
  ok?: boolean;
  error?: string;
  duplicates?: ReadonlyArray<{ id: string; name: string }>;
} | null;

export type FormSheetAction = (
  state: FormSheetState,
  form: FormData,
) => Promise<FormSheetState>;

type StateRender<T> = T | ((state: FormSheetState) => T);

function resolve<T>(value: StateRender<T>, state: FormSheetState): T {
  return typeof value === "function" ? (value as (s: FormSheetState) => T)(state) : value;
}

/**
 * A form in a right-hand sheet. Clicking outside or pressing Escape does not
 * close it; the close button and a successful save do. Reset restores every
 * field to its initial value. Pass `open`/`onOpenChange` to control the sheet
 * externally instead of through a trigger.
 */
export function FormSheet({
  trigger,
  title,
  description,
  action,
  submitLabel,
  wide,
  defaultOpen,
  open: openProp,
  onOpenChange,
  children,
}: Readonly<{
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  action: FormSheetAction;
  submitLabel: StateRender<string>;
  wide?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: StateRender<React.ReactNode>;
}>) {
  const [openState, setOpenState] = React.useState(defaultOpen ?? false);
  const open = openProp ?? openState;

  const handleOpenChange = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        className={
          wide
            ? "w-full data-[side=right]:sm:max-w-xl"
            : "w-full data-[side=right]:sm:max-w-md"
        }
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <SheetForm
          title={title}
          description={description}
          action={action}
          submitLabel={submitLabel}
          onSaved={() => handleOpenChange(false)}
        >
          {children}
        </SheetForm>
      </SheetContent>
    </Sheet>
  );
}

function SheetForm({
  title,
  description,
  action,
  submitLabel,
  onSaved,
  children,
}: Readonly<{
  title: string;
  description?: string;
  action: FormSheetAction;
  submitLabel: StateRender<string>;
  onSaved: () => void;
  children: StateRender<React.ReactNode>;
}>) {
  const [state, formAction] = React.useActionState(action, null);
  const [fieldsKey, setFieldsKey] = React.useState(0);

  React.useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="pr-12">
        <SheetTitle>{title}</SheetTitle>
        {description && <SheetDescription>{description}</SheetDescription>}
      </SheetHeader>
      <div key={fieldsKey} className="grid flex-1 content-start gap-3 overflow-y-auto px-4 pb-4">
        {state?.error && <Notice>{state.error}</Notice>}
        {resolve(children, state)}
      </div>
      <SheetFooter className="flex-row border-t border-(--c-line-soft)">
        <SubmitButton>{resolve(submitLabel, state)}</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setFieldsKey((n) => n + 1)}>
          Reset
        </Button>
      </SheetFooter>
    </form>
  );
}

function SubmitButton({ children }: Readonly<{ children: React.ReactNode }>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : children}
    </Button>
  );
}
