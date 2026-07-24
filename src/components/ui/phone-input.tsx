"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { toPhoneDigits } from "@/lib/phone";

type PhoneInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: string | number | null | undefined;
  /**
   * Emits the cleaned value. Number mode (default) emits `number | undefined`;
   * string mode (`asString`) emits the raw digit string. Match the form field's
   * schema type.
   */
  onChange: (value: string | number | undefined) => void;
  asString?: boolean;
};

/**
 * A phone-number `<Input>` that strips non-digits and hard-caps at 10 — so no
 * field anywhere can accept an 11th digit. Spread an RHF field straight in:
 * `<PhoneInput {...field} />` (number) or `<PhoneInput {...field} asString />`.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    { value, onChange, asString = false, placeholder = "10-digit phone", ...rest },
    ref,
  ) {
    return (
      <Input
        {...rest}
        ref={ref}
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => {
          const digits = toPhoneDigits(e.target.value);
          onChange(asString ? digits : digits === "" ? undefined : Number(digits));
        }}
      />
    );
  },
);
