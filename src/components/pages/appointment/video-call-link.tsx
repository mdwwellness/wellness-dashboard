"use client";

import { Copy, ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * An online consultation's Google Meet link. The server makes it once the
 * consultation's time is confirmed (backend lib/bookingMeet.ts). The customer
 * asks to join and waits until someone in the call lets them in.
 */
export function VideoCallLink({ link }: { link?: string }) {
  // Only ever a Meet link from our server; anything else isn't rendered as a link.
  if (!link?.startsWith("https://meet.google.com/")) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link!);
      toast.success("Video call link copied");
    } catch {
      toast.error("Couldn't copy - select it and copy by hand");
    }
  }

  return (
    <div className="space-y-1.5 rounded-md border bg-muted/30 px-2.5 py-2">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Video className="h-3.5 w-3.5" /> Video call link
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 break-all font-mono text-sm">{link}</span>
        <Button type="button" size="sm" variant="outline" className="h-7" onClick={copy}>
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7">
          <a href={link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The customer taps &quot;Ask to join&quot; and waits until someone in the call lets them in.
      </p>
    </div>
  );
}
