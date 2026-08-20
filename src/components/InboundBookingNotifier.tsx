"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";

import { useGetAllEnquiries } from "@/data/enquiry/enquiry";
import { useAuthStore } from "@/providers/permission-provider";
import type { EnquiryType } from "@/type/schema";

/**
 * Synthesize a soft, professional dual-note chime (D5 -> A5) using Web Audio API.
 * Completely standalone - zero external asset dependencies.
 */
function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Note 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Note 2: A5 (880 Hz) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn("Audio notification failed:", err);
  }
}

export default function InboundBookingNotifier() {
  const { user } = useAuthStore();
  const { data: enquiries } = useGetAllEnquiries(
    { id: user?.id, role: user?.role, userEmail: user?.userEmail },
  );

  const initialLoadedRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enquiries || enquiries.length === 0) return;

    // On first load, seed the known IDs set without triggering alerts
    if (!initialLoadedRef.current) {
      initialLoadedRef.current = true;
      const ids = new Set<string>();
      for (const e of enquiries) {
        const key = e._id || e.enquiryId || `${e.phonenumber}-${e.name}`;
        ids.add(key);
      }
      knownIdsRef.current = ids;
      return;
    }

    // On subsequent query refetches/updates, check for any brand-new records
    const newRecords: EnquiryType[] = [];
    for (const e of enquiries) {
      const key = e._id || e.enquiryId || `${e.phonenumber}-${e.name}`;
      if (!knownIdsRef.current.has(key)) {
        knownIdsRef.current.add(key);
        newRecords.push(e);
      }
    }

    if (newRecords.length > 0) {
      // Play soft chime sound
      playNotificationSound();

      // Show toast alert for each new record
      for (const rec of newRecords) {
        const name = rec.name || "Customer";
        const service = rec.service || rec.typeOfappointment || "New Booking";
        const phone = rec.phonenumber ? String(rec.phonenumber) : "";

        toast("🔔 New Inbound Booking Received!", {
          description: `${name} · ${service}${phone ? ` (${phone})` : ""}`,
          duration: 8000,
          action: {
            label: "View Enquiries",
            onClick: () => {
              window.location.href = "/dashboard/enquiries";
            },
          },
        });
      }
    }
  }, [enquiries]);

  return null;
}
