"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePlus, Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { serviceFormSchema, type ServiceFormType } from "@/type/schema";
import { useAddService } from "@/data/service/service";
import { ServiceFormFields } from "./service-form-fields";

const emptyValues: ServiceFormType = {
  name: "",
  description: "",
  hsnCode: "",
  originalPrice: 0,
  discountedPrice: 0,
};

export function AddServiceForm() {
  const [open, setOpen] = useState(false);
  const mutation = useAddService();

  const form = useForm<ServiceFormType>({
    resolver: zodResolver(serviceFormSchema),
    mode: "onChange",
    defaultValues: emptyValues,
  });

  function onSubmit(values: ServiceFormType) {
    mutation.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset(emptyValues);
      },
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) form.reset(emptyValues);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="flex justify-center items-center gap-1">
          <CirclePlus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Service
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-xl p-0 gap-0 flex flex-col">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <SheetHeader className="border-b pr-12">
              <SheetTitle>Add service</SheetTitle>
              <SheetDescription>
                The service number (SRV-####) is assigned automatically.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ServiceFormFields control={form.control} />
              </div>
            </div>

            <div className="border-t p-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={mutation.isPending}
                className="h-11 sm:h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="h-11 sm:h-10"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Adding…
                  </>
                ) : (
                  "Add Service"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
