"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { AUTH_REFRESH_FAILED_CODE } from "@/lib/auth-errors";

/**
 * Global session-expired dialog. Listens for custom "session-expired" events
 * fired by the query/mutation error handlers and shows a modal asking the
 * user to refresh.
 */
export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleSessionExpired() {
      setOpen(true);
    }
    window.addEventListener("session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("session-expired", handleSessionExpired);
  }, []);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Session Expired</DialogTitle>
          <DialogDescription>
            Your session has expired. Please refresh the page to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button onClick={() => window.location.reload()} className="w-full">
            Refresh Page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Fire the session-expired event so the dialog opens. */
export function signalSessionExpired() {
  window.dispatchEvent(new Event("session-expired"));
}
