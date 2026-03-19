"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NoPermission = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95">
      
      <div className="p-4 rounded-full bg-muted">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-semibold">
        Access Denied
      </h2>

      <p className="text-sm text-muted-foreground max-w-sm">
        You don’t have the required permission to view this section.
        If you think this is a mistake, contact your administrator.
      </p>

      <Button variant="outline" onClick={() => window.history.back()}>
        Go Back
      </Button>
    </div>
  );
};
