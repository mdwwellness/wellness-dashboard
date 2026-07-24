"use client";

import { type Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceFormType } from "@/type/schema";

type PriceFieldName = "originalPrice" | "discountedPrice";

// A ₹ number input wired to a react-hook-form numeric field. Empty → undefined.
function PriceField({
  control,
  name,
  label,
}: {
  control: Control<ServiceFormType>;
  name: PriceFieldName;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              step={1}
              placeholder="0"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={
                field.value === undefined || Number.isNaN(field.value)
                  ? ""
                  : field.value
              }
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? undefined : e.target.valueAsNumber,
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ServiceFormFields({
  control,
}: {
  control: Control<ServiceFormType>;
}) {
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Service name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Dry Needling" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="hsnCode"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>HSN / SAC code</FormLabel>
            <FormControl>
              <Input placeholder="e.g. 999319" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* The service's two prices — used when it's added to a visit */}
      <div className="md:col-span-2 rounded-md border p-3 space-y-3">
        <p className="text-sm font-medium">Pricing</p>
        <p className="text-xs text-muted-foreground">
          Charged when this service is added during a visit — the add-on price
          when a therapist recommends it on the spot, otherwise the original.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PriceField control={control} name="originalPrice" label="Original price (₹)" />
          <PriceField control={control} name="discountedPrice" label="Add-on price (₹)" />
        </div>
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What's included in this service…"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
