"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppearanceControls } from "./appearance-controls";

export function AppearanceSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l bg-popover sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Appearance</SheetTitle>
          <SheetDescription>
            Themes, timer digits and motion. Saved on this device.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8">
          <AppearanceControls />
        </div>
      </SheetContent>
    </Sheet>
  );
}
