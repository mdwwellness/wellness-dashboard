"use client"
import { useState } from "react";
import { TherapistformType } from "@/type/schema";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import { useUpdateTherapist } from "@/data/therapist/therapist";
import { Loader2, User } from "lucide-react";

function TherapistAvatar({ url, name }: { url?: string; name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div className="h-8 w-8 rounded-full border bg-muted overflow-hidden flex items-center justify-center shrink-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : initials ? (
        <span className="text-[10px] font-semibold text-muted-foreground">
          {initials}
        </span>
      ) : (
        <User className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

function ActiveToggle({ therapist }: { therapist: TherapistformType }) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const { mutate: updateTherapist, isPending } = useUpdateTherapist();

  const active = optimistic ?? therapist.isActive;

  function toggle() {
    if (isPending) return;
    const next = !active;
    setOptimistic(next);
    updateTherapist(
      { ...therapist, isActive: next },
      {
        onError: () => setOptimistic(null), // rollback on failure
        onSettled: () => setOptimistic(null), // re-sync with server
      },
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
        active
          ? "bg-emerald-600 text-white hover:bg-emerald-700"
          : "bg-red-600 text-white hover:bg-red-700"
      }`}
    >
      {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
      {active ? "Active" : "Not Active"}
    </button>
  );
}

export const DoctorsListColumn: ColumnDef<TherapistformType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const profileImage = (row.original as TherapistformType).profileImage;
      return (
        <div className="flex items-center gap-2">
          <TherapistAvatar url={profileImage} name={name ?? ""} />
          <span>{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Email" />
    },
    cell: ({ row }) => row.getValue("email"),
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => {
      const gender = row.getValue("gender")
      return gender !== undefined ? gender : "--"
    },
  },
  {
    accessorKey: "phonenumber",
    header:"Phone Number",
    cell: ({ row }) => row.getValue("phonenumber"),
  },
  {
    accessorKey: "specialization",
    header: "Specialization",
    filterFn: (row, columnId, filterValue) => {
      const cellValue = row.getValue(columnId);
      const specs = Array.isArray(cellValue) ? cellValue.map(String) : [];
      const filters = Array.isArray(filterValue) ? filterValue : [filterValue];
      return filters.some((f) => specs.some((s) => s.toLowerCase() === String(f).toLowerCase()));
    },
    cell: ({ row }) => {
      const list = row.getValue("specialization") as string[];
      return (
        <>
          {list?.map((val, index) => (
            <div key={index}>
              <span>{val}</span>
            </div>
          ))}
        </>
      );
    },
  },
  {
    accessorKey: "bio",
    header:"Bio",
    cell: ({ row }) => row.getValue("bio"),
  },
  {
    accessorKey: "isActive",
    header:"Status",
    cell: ({ row }) => {
      return <ActiveToggle therapist={row.original} />;
    },
  },
];
