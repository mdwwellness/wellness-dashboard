import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { base_url } from "@/constant";
import { BRAND, UPI, upiLink } from "@/lib/brand";

export const dynamic = "force-dynamic";

type PaySummary = {
  enquiryId?: string;
  name?: string;
  typeOfappointment?: "consultation" | "appointment";
  amount?: number;
  paymentReceived?: boolean;
};

const ITEM_LABELS: Record<string, string> = {
  consultation: "Online Consultation",
  appointment: "Home Visit Consultation",
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Plain fetch, not fetchWithAuth — the customer has no dashboard session. The
 * unguessable token in the URL is what authorises this read; the backend
 * returns only the handful of fields rendered below.
 */
async function getSummary(token: string): Promise<PaySummary | null> {
  try {
    const res = await fetch(`${base_url}/api/appointments/pay/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const summary = await getSummary(token);
  if (!summary) notFound();

  const item =
    ITEM_LABELS[summary.typeOfappointment ?? ""] ?? "Consultation";
  const amount = summary.amount ?? 0;
  const reference = summary.enquiryId ?? "";
  const link = amount > 0 ? upiLink(amount, reference) : null;

  // Rendered server-side so the page needs no client JS to show the QR.
  const qr = link
    ? await QRCode.toString(link, {
        type: "svg",
        margin: 1,
        color: { dark: "#0f3057", light: "#ffffff" },
      })
    : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-md space-y-4">
        {/* Who this is from — named up front, before any mention of money. */}
        <header className="text-center">
          <h1
            className="text-2xl font-semibold"
            style={{ color: BRAND.primary }}
          >
            {BRAND.name}
          </h1>
          <p className="text-sm text-slate-500">{BRAND.tagline}</p>
        </header>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          {summary.paymentReceived ? (
            <div className="space-y-2 text-center">
              <p className="text-lg font-medium text-emerald-700">
                Payment received — thank you{summary.name ? `, ${summary.name}` : ""}.
              </p>
              <p className="text-sm text-slate-600">
                Nothing more to pay. We&apos;ll confirm your therapist and visit
                time shortly.
              </p>
              {reference && (
                <p className="text-xs text-slate-400">Booking {reference}</p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-slate-600">
                  {summary.name ? `Hi ${summary.name}, this` : "This"} is the
                  payment for the booking you discussed with our team.
                </p>
                {reference && (
                  <p className="mt-1 text-xs text-slate-400">
                    Booking {reference}
                  </p>
                )}
              </div>

              {/* Itemised — the customer sees exactly what the money is for. */}
              <dl className="space-y-2 border-y py-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-600">{item}</dt>
                  <dd className="tabular-nums">{inr(amount)}</dd>
                </div>
              </dl>
              <div className="flex items-baseline justify-between gap-4 py-3 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{inr(amount)}</span>
              </div>

              {link ? (
                <div className="space-y-4">
                  {/* Where the money goes, stated before we ask for it. A
                      customer can paste this into their own UPI app and check
                      the name resolves before committing a rupee — that check
                      is the whole point, so don't hide the ID behind a button. */}
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <p className="text-xs text-slate-500">Paying to</p>
                    <p className="font-medium">{UPI.payeeName}</p>
                    <p className="font-mono text-xs text-slate-600 break-all">
                      {UPI.vpa}
                    </p>
                  </div>

                  <a
                    href={link}
                    className="block w-full rounded-lg px-4 py-3 text-center font-medium text-white"
                    style={{ backgroundColor: BRAND.primary }}
                  >
                    Pay {inr(amount)} with UPI
                  </a>
                  <p className="text-center text-xs text-slate-500">
                    Opens your own UPI app (GPay, PhonePe, Paytm…). Check the
                    payee name shown there matches the one above before you
                    confirm.
                  </p>

                  {qr && (
                    <div className="space-y-2 border-t pt-4 text-center">
                      <p className="text-xs text-slate-500">
                        On a computer? Scan with any UPI app — the amount and
                        booking reference are already in the code:
                      </p>
                      {/* qr is an SVG string we generated ourselves from our
                          own UPI link — no user input reaches it. */}
                      <div
                        className="mx-auto h-44 w-44 [&>svg]:h-full [&>svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: qr }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Please call us on {BRAND.phone} to complete this payment.
                </p>
              )}
            </>
          )}
        </section>

        {/* Verifiable identity + a human to call. A real business says who it
            is and how to reach it; that's the difference from a scam text. */}
        <footer className="space-y-1 text-center text-xs text-slate-500">
          <p>
            Questions about this payment? Call{" "}
            <a href={`tel:${BRAND.phone.replace(/\s/g, "")}`} className="underline">
              {BRAND.phone}
            </a>
          </p>
          <p>
            {BRAND.legalName} · {BRAND.website}
          </p>
          <p className="text-slate-400">
            We will never ask you for an OTP, PIN, or card number.
          </p>
        </footer>
      </div>
    </main>
  );
}
