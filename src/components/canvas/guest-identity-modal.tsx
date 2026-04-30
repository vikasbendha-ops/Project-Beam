"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { GuestIdentity } from "@/hooks/use-guest-identity";

interface GuestIdentityModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (id: GuestIdentity) => void;
}

export function GuestIdentityModal({
  open,
  onOpenChange,
  onSave,
}: GuestIdentityModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
    }
  }, [open]);

  function handleSave() {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Add your name to continue");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Enter a valid email or leave blank");
      return;
    }
    onSave({ name: cleanName, email: email.trim() || undefined });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add your details to comment</DialogTitle>
          <DialogDescription>
            Drop your name so reviewers know who said what. Email is optional —
            we&rsquo;ll only use it to ping you on replies.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="guest-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="guest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              autoFocus
              maxLength={80}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="guest-email"
              className="flex items-center justify-between"
            >
              <span>Email</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Optional
              </span>
            </Label>
            <Input
              id="guest-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              maxLength={120}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
