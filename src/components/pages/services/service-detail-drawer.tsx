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
  price: 0,
  category: "",
  hsnCode: "",
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
  const { mutate: updateMutate, isPending: isUpdating } = useUpdateService();
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteService();

  const form = useForm<ServiceFormType>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        description: service.description ?? "",
        price: service.price,
        recommendedPrice: service.recommendedPrice,
        category: service.category,
        hsnCode: service.hsnCode,
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
    deleteMutate(service.serviceId, {
      onSuccess: () => {
        setConfirmDelete(false);
        onClose();
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
