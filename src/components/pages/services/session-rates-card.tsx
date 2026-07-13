"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetSessionRates,
  useUpdateSessionRates,
} from "@/data/session-rate/session-rate";
import type { SessionRateTier } from "@/type/schema";

// String-backed rows so the number inputs stay controlled while editing.
type Row = { from: string; to: string; rate: string };

const toRows = (tiers: SessionRateTier[]): Row[] =>
  tiers.map((t) => ({
    from: String(t.from ?? ""),
    to: t.to == null ? "" : String(t.to),
    rate: String(t.rate ?? ""),
  }));

export function SessionRatesCard() {
  const { data: card, isLoading } = useGetSessionRates();
  const { mutate: save, isPending } = useUpdateSessionRates();
  const [rows, setRows] = useState<Row[]>([]);

  // Seed local rows from the server (on load and after a save re-fetches).
  useEffect(() => {
    if (card) setRows(toRows(card.tiers));
  }, [card]);

  const setCell = (i: number, key: keyof Row, value: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const addRow = () =>
    setRows((rs) => [...rs, { from: "", to: "", rate: "" }]);
  const removeRow = (i: number) =>
    setRows((rs) => rs.filter((_, idx) => idx !== i));

  function handleSave() {
    const tiers: SessionRateTier[] = rows.map((r) => ({
      from: Number(r.from),
      to: r.to.trim() === "" ? null : Number(r.to),
      rate: Number(r.rate),
    }));
    save(tiers);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Session rates</CardTitle>
          <CardDescription>
            Global per-session pricing by tier — a booking of N sessions is
            charged the matching tier&apos;s rate × N. Leave <b>To</b> blank for
            an open-ended top tier.
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isPending || isLoading}
          className="shrink-0"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Save rates"
          )}
        </Button>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1 text-xs text-muted-foreground">
          <span>From (sessions)</span>
          <span>To (blank = &amp; up)</span>
          <span>₹ / session</span>
          <span className="w-9" aria-hidden="true"></span>
        </div>

        {rows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2"
          >
            <Input
              type="number"
              min={0}
              value={r.from}
              onChange={(e) => setCell(i, "from", e.target.value)}
              placeholder="1"
            />
            <Input
              type="number"
              min={0}
              value={r.to}
              onChange={(e) => setCell(i, "to", e.target.value)}
              placeholder="5"
            />
            <Input
              type="number"
              min={0}
              value={r.rate}
              onChange={(e) => setCell(i, "rate", e.target.value)}
              placeholder="600"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(i)}
              aria-label={`Remove tier ${i + 1}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        {rows.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            No tiers yet — add one to start.
          </p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add tier
        </Button>
      </CardContent>
    </Card>
  );
}
