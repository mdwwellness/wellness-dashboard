"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  serviceFormSchema,
  type ServiceFormType,
  type ServiceType,
} from "@/type/schema";
import { useDeleteService, useUpdateService } from "@/data/service/service";
import { ServiceFormFields } from "./service-form-fields";

const emptyValues: ServiceFormType = {
  name: "",
  description: "",
  hsnCode: "",
  originalPrice: 0,
  discountedPrice: 0,
};

interface ServiceDetailDrawerProps {
  service: ServiceType | null;
  onClose: () => void;
}

export function ServiceDetailDrawer({
  service,
  onClose,
}: ServiceDetailDrawerProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [blockedBy, setBlockedBy] = useState<{
    appointments: string[];
    invoices: string[];
  } | null>(null);
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateService();
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteService();

  const form = useForm<ServiceFormType>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    setBlockedBy(null);
    if (service) {
      form.reset({
        name: service.name,
        description: service.description ?? "",
        hsnCode: service.hsnCode ?? "",
        // Old services fall back to the deprecated price / recommendedPrice.
        originalPrice: service.originalPrice ?? service.price ?? 0,
        discountedPrice:
          service.discountedPrice ?? service.recommendedPrice ?? 0,
      });
    }
  }, [service, form]);

  const open = service !== null;

  function onSubmit(values: ServiceFormType) {
    if (!service) return;
    updateMutate(
      { ...values, _id: service._id, serviceId: service.serviceId },
      { onSuccess: () => onClose() },
    );
  }

  function handleDelete() {
    if (!service) return;
    setBlockedBy(null);
    deleteMutate(service.serviceId, {
      onSuccess: () => {
        setConfirmDelete(false);
        onClose();
      },
      onError: (error) => {
        setBlockedBy(
          (
            error as {
              blockedBy?: { appointments: string[]; invoices: string[] };
            }
          ).blockedBy ?? null,
        );
      },
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
        <SheetContent className="w-full sm:max-w-xl p-0 gap-0 flex flex-col">
          {service && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col h-full"
              >
                <SheetHeader className="border-b pr-12">
                  <SheetTitle className="flex items-center gap-2">
                    Edit service
                    <span className="font-mono text-xs font-normal text-muted-foreground">
                      {service.serviceId}
                    </span>
                  </SheetTitle>
                  <SheetDescription>
                    Update the details and save your changes.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4">
                  {blockedBy &&
                    (blockedBy.appointments.length > 0 ||
                      blockedBy.invoices.length > 0) && (
                      <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                        <p className="text-sm font-medium text-destructive">
                          Can’t delete — remove or reassign these first:
                        </p>
                        {blockedBy.appointments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              Bookings ({blockedBy.appointments.length})
                            </p>
                            <p className="font-mono text-xs break-all">
                              {blockedBy.appointments.join(", ")}
                            </p>
                          </div>
                        )}
                        {blockedBy.invoices.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              Invoices ({blockedBy.invoices.length})
                            </p>
                            <p className="font-mono text-xs break-all">
                              {blockedBy.invoices.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ServiceFormFields control={form.control} />
                  </div>
                </div>

                <div className="border-t p-4 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-11 sm:h-10"
                    disabled={isUpdating || isDeleting}
                    onClick={() => setConfirmDelete(true)}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Deleting…
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isUpdating || isDeleting}
                      className="h-11 sm:h-10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdating || isDeleting}
                      className="h-11 sm:h-10"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </SheetContent>
      </Sheet>

      {/* AlertDialog kept OUTSIDE the Sheet to avoid nested-overlay double-tap bug */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{service?.name}” ({service?.serviceId}) from the
              catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
