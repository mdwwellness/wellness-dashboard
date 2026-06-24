"use client";

import { useWatch, type Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_CATEGORIES } from "@/lib/constant";
import type { ServiceFormType } from "@/type/schema";

export function ServiceFormFields({
  control,
}: {
  control: Control<ServiceFormType>;
}) {
  const isPackage = useWatch({ control, name: "isPackage" });
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Service name</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Deep Tissue Massage (60 min)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || undefined}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SERVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price (₹)</FormLabel>
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

      <FormField
        control={control}
        name="recommendedPrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Recommended price (₹)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="Discounted (optional)"
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

      <FormField
        control={control}
        name="hsnCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>HSN / SAC code</FormLabel>
            <FormControl>
              <Input placeholder="e.g. 999319" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="md:col-span-2 space-y-3 rounded-md border p-3">
        <FormField
          control={control}
          name="isPackage"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value ?? false}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </FormControl>
              <FormLabel className="!mt-0">
                This is a package (bundled sessions / recurring plan)
              </FormLabel>
            </FormItem>
          )}
        />

        {isPackage ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="sessions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sessions included</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="e.g. 2"
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
                          e.target.value === ""
                            ? undefined
                            : e.target.valueAsNumber,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="billingCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing cycle</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}
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
