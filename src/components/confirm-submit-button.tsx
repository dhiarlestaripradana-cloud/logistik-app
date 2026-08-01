"use client";

import { Button } from "@/components/ui/button";

// Tombol submit dengan konfirmasi native — untuk aksi soft-delete/toggle.
export function ConfirmSubmitButton({
  message,
  children,
  variant = "outline",
}: {
  message: string;
  children: React.ReactNode;
  variant?: "outline" | "destructive" | "ghost";
}) {
  return (
    <Button
      type="submit"
      size="sm"
      variant={variant}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
