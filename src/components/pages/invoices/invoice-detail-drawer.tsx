"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Phone, Mail, BadgeCheck, FileText, ReceiptText, Pencil, Loader2 } from "lucide-react";

import type { PersistedInvoice, UpdateInvoiceInput, InvoicePaymentStatus, InvoiceLineItem } from "@/type/invoice";
import { useUpdateInvoice, useGenerateInvoicePdf } from "@/data/invoice/invoice";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function safeText(s: unknown): string {
  return typeof s === "string" ? s : "";
}

export function InvoiceDetailDrawer({
  invoice,
  onClose,
}: {
  invoice: PersistedInvoice | null;
  onClose: () => void;
}) {
  const open = invoice !== null;

  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateInvoice();
  const { mutate: generatePdf, isPending: isGeneratingPdf } = useGenerateInvoicePdf();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<PersistedInvoice | null>(invoice);

  useEffect(() => {
    setDraft(invoice);
    setIsEditing(false);
  }, [invoice?.invoice_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const createdAtText = useMemo(() => {
    if (!invoice?.createdAt) return "—";
    const d = new Date(invoice.createdAt);
    if (Number.isNaN(d.getTime())) return "—";
    return format(d, "yyyy-MM-dd HH:mm");
  }, [invoice?.createdAt]);

  function setLineItem(i: number, patch: Partial<InvoiceLineItem>) {
    if (!draft) return;
    const next = [...(draft.line_items ?? [])];
    next[i] = { ...next[i], ...patch };
    const advancePaid = Number(draft.advance_paid ?? 0) || 0;
    const subtotal = next.reduce((sum, li) => sum + (Number(li.price) || 0), 0);
    const total = subtotal;
    const balanceDue = total - advancePaid;
    setDraft({
      ...draft,
      line_items: next,
      items_subtotal: subtotal,
      total,
      balance_due: balanceDue,
    });
  }

  function addLineItem() {
    if (!draft) return;
    const next = [
      ...(draft.line_items ?? []),
      { description: "", price: 0 },
    ];
    const advancePaid = Number(draft.advance_paid ?? 0) || 0;
    const subtotal = next.reduce((sum, li) => sum + (Number(li.price) || 0), 0);
    const total = subtotal;
    const balanceDue = total - advancePaid;
    setDraft({
      ...draft,
      line_items: next,
      items_subtotal: subtotal,
      total,
      balance_due: balanceDue,
    });
  }

  function removeLineItem(i: number) {
    if (!draft) return;
    const next = [...(draft.line_items ?? [])];
    next.splice(i, 1);
    const advancePaid = Number(draft.advance_paid ?? 0) || 0;
    const subtotal = next.reduce((sum, li) => sum + (Number(li.price) || 0), 0);
    const total = subtotal;
    const balanceDue = total - advancePaid;
    setDraft({ ...draft, line_items: next, items_subtotal: subtotal, total, balance_due: balanceDue });
  }

  function computeTotals(items: InvoiceLineItem[]) {
    const subtotal = items.reduce((sum, li) => sum + (Number(li.price) || 0), 0);
    return { itemsSubtotal: subtotal, total: subtotal };
  }

  function handleSave() {
    if (!draft || !invoice) return;

    const items = (draft.line_items ?? []).map((li) => ({
      description: safeText(li.description).trim() || "Item",
      price: Number(li.price) || 0,
    }));

    const { itemsSubtotal, total } = computeTotals(items);

    const values: UpdateInvoiceInput = {
      therapist_name: safeText(draft.therapist_name).trim(),
      session_number: draft.session_number ?? null,
      package_type: draft.package_type ?? null,
      package_ref: draft.package_ref ?? null,
      package_name: safeText(draft.package_name),
      payment_status: draft.payment_status,
      line_items: items,
    };

    updateInvoice(
      { invoiceId: invoice.invoice_id, values },
      {
        onSuccess: () => {
          setIsEditing(false);
          // The invoices query will be invalidated in data hook on success.
        },
      },
    );
  }

  function handleWhatsAppSend() {
    if (!invoice?.pdf_url) return;
    const msg = `Hi ${invoice.customer_name},\n\nPlease find your invoice ${invoice.invoice_id}.\nTotal: ${formatINR(invoice.total)}.\nDownload: ${invoice.pdf_url}\n\nThank you.`;
    const phone = String(invoice.customer_phone ?? "").replace(/[^\d]/g, "");
    if (!phone) return;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!invoice) {
    return (
      <Sheet open={false} onOpenChange={() => onClose()}>
        <SheetContent />
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-muted-foreground" />
              {invoice.invoice_id}
            </span>
            <Badge variant={invoice.payment_status === "paid" ? "default" : "secondary"}>
              {invoice.payment_status === "paid" ? "Paid" : "Pending"}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Invoice for {invoice.customer_name} • {createdAtText}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-6">
          {/* Customer */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{invoice.customer_phone}</span>
            </div>
            {invoice.customer_name && (
              <div className="text-sm text-muted-foreground">
                {invoice.customer_name}
              </div>
            )}
            {invoice.customer_id && (
              <div className="text-xs text-muted-foreground pt-1">
                Customer ID: <span className="font-mono">{invoice.customer_id}</span>
              </div>
            )}
          </section>

          <Separator />

          {/* Summary */}
          <section className="grid grid-cols-2 gap-3">
            <div className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">Type</div>
              <div className="text-sm font-medium">{invoice.invoice_type}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-sm font-medium tabular-nums">
                {formatINR(invoice.total)}
              </div>
            </div>
          </section>

          {/* Edit form */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Invoice details
              </h3>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isUpdating}
                    onClick={handleSave}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => {
                      setDraft(invoice);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {draft && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Therapist</div>
                    <Input
                      value={safeText(draft.therapist_name)}
                      onChange={(e) => setDraft({ ...draft, therapist_name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Payment status</div>
                    <Select
                      value={draft.payment_status}
                      onValueChange={(v) =>
                        setDraft({ ...draft, payment_status: v as InvoicePaymentStatus })
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Line items</div>
                  <div className="space-y-2">
                    {(draft.line_items ?? []).map((li, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <div className="text-xs text-muted-foreground">Description</div>
                          <Input
                            value={li.description}
                            onChange={(e) =>
                              setLineItem(idx, { description: e.target.value })
                            }
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="w-28 space-y-1">
                          <div className="text-xs text-muted-foreground">Price</div>
                          <Input
                            type="number"
                            min={0}
                            value={Number(li.price) || 0}
                            onChange={(e) =>
                              setLineItem(idx, { price: Number(e.target.value) || 0 })
                            }
                            disabled={!isEditing}
                          />
                        </div>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 px-2"
                            onClick={() => removeLineItem(idx)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditing && (
                    <Button type="button" variant="outline" onClick={addLineItem}>
                      Add line item
                    </Button>
                  )}
                </div>

                <div className="border rounded-md p-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(
                        (draft.line_items ?? []).reduce(
                          (s, x) => s + (Number(x.price) || 0),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Advance paid</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(draft.advance_paid ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Balance due</span>
                    <span className="font-mono tabular-nums">
                      {formatINR(draft.balance_due ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* PDF / WhatsApp */}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" />
                PDF and WhatsApp
              </div>
            </div>

            {invoice.pdf_url ? (
              <div className="text-xs text-muted-foreground break-all">
                PDF:{" "}
                <a
                  href={invoice.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {invoice.pdf_url}
                </a>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No PDF yet. Generate to enable WhatsApp sending.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isGeneratingPdf}
                onClick={() =>
                  generatePdf({
                    invoiceId: invoice.invoice_id,
                    regenerate: !!invoice.pdf_url,
                  })
                }
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : invoice.pdf_url ? (
                  "Regenerate PDF"
                ) : (
                  "Generate PDF"
                )}
              </Button>
              <Button
                type="button"
                disabled={!invoice.pdf_url}
                onClick={handleWhatsAppSend}
              >
                Send via WhatsApp
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

