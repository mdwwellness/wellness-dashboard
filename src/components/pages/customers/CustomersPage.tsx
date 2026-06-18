"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  CalendarDays,
  RefreshCw,
  UserCheck,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/tables/data-table-pagination";
import { DataTableViewOptions } from "@/components/tables/data-table-view-options";
import { QueryWrapper } from "@/components/query-wrapper";

import { useAuthStore } from "@/providers/permission-provider";
import {
  computeCustomerStats,
  useGetCustomers,
  type Customer,
} from "@/data/customer/customer";

import { makeCustomerColumns } from "./customers-columns";
import { CustomerDetailDrawer } from "./customer-detail-drawer";

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="border rounded-xl p-5 h-28 bg-muted/30 animate-pulse"
        />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function CustomerStatCards({
  totalCustomers,
  totalBookings,
  bookingsThisMonth,
  returningCustomers,
}: ReturnType<typeof computeCustomerStats>) {
  const cards = [
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: <Users className="h-5 w-5 text-primary" />,
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: <CalendarDays className="h-5 w-5 text-primary" />,
    },
    {
      title: "Bookings This Month",
      value: bookingsThisMonth,
      icon: <CalendarDays className="h-5 w-5 text-primary" />,
    },
    {
      title: "Returning Customers",
      value: returningCustomers,
      icon: <UserCheck className="h-5 w-5 text-primary" />,
      hint: "2+ bookings",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between bg-card"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {card.title}
            </h3>
            {card.icon}
          </div>
          <div className="text-3xl font-bold text-emerald-600 tabular-nums">
            {card.value}
          </div>
          {card.hint && (
            <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CustomersPage() {
  const { user } = useAuthStore();
  const { id, role, userEmail } = user || {};
  const {
    data: customers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCustomers({ id, role, userEmail });

  const [openCustomer, setOpenCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    {},
  );

  const stats = useMemo(
    () => computeCustomerStats(customers),
    [customers],
  );

  const columns = useMemo(
    () =>
      makeCustomerColumns({
        onOpenDetail: (c) => setOpenCustomer(c),
      }),
    [],
  );

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
      globalFilter: search,
    },
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value).toLowerCase().trim();
      if (!q) return true;
      const c = row.original;
      return (
        (c.name ?? "").toLowerCase().includes(q) ||
        String(c.phonenumber ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.location ?? "").toLowerCase().includes(q)
      );
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <>
      <div className="space-y-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Everyone who has booked with you — grouped by phone number.
          </p>
        </div>

        <QueryWrapper
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={refetch}
          skeleton={<StatCardsSkeleton />}
        >
          <CustomerStatCards {...stats} />
        </QueryWrapper>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>All customers</CardTitle>
              <CardDescription>
                Click a name or the menu to see full booking history.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </CardHeader>

          <CardContent>
            <QueryWrapper
              isLoading={isLoading}
              isError={isError}
              error={error}
              onRetry={refetch}
              skeleton={<TableSkeleton />}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <Input
                  placeholder="Search name, phone, email, city…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />
                {search && (
                  <Button variant="ghost" onClick={() => setSearch("")}>
                    Clear
                  </Button>
                )}
                <div className="sm:ml-auto">
                  <DataTableViewOptions table={table} />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer"
                          onClick={() => setOpenCustomer(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              onClick={(e) => {
                                if (cell.column.id === "action") {
                                  e.stopPropagation();
                                }
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          {customers.length === 0
                            ? "No customers yet — they appear here once someone books."
                            : "No customers match your search."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">
                <DataTablePagination table={table} />
              </div>
            </QueryWrapper>
          </CardContent>
        </Card>
      </div>

      <CustomerDetailDrawer
        customer={openCustomer}
        onClose={() => setOpenCustomer(null)}
        allRecords={customers.flatMap((c) => c.bookings)}
        onDuplicateFound={(record) => {
          const match = customers.find(
            (c) => c.phonenumber === record.phonenumber,
          );
          if (match) setOpenCustomer(match);
        }}
      />
    </>
  );
}
