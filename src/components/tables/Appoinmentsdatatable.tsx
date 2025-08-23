"use client"
import * as React from 'react'
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from './data-table-view-options';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface AppointmentDataType<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function AppointmentDataTable<TData, TValue>(
    { columns, data }: AppointmentDataType<TData, TValue>
) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    // reset filters
    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <>
            <div className="flex flex-col gap-6 p-3">
                <div>
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="Filter names..."
                            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />
                        {table.getColumn("category") && (
                            <DataTableFacetedFilter
                                column={table.getColumn("category")}
                                title="Category"
                                options={CATEGORYES}
                            />
                        )}
                        {isFiltered && (
                            <Button
                                variant="ghost"
                                onClick={() => table.resetColumnFilters()}
                                className="h-8 px-2 lg:px-3 flex justify-center items-center gap-2"
                            >
                                Reset
                                <X width={16} />
                            </Button>
                        )}
                        <DataTableViewOptions table={table} />
                    </div>
                    <div className="rounded-md border p-3">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DataTablePagination table={table} />
            </div>
        </>
    )
}




const CATEGORYES = [
    {
        value: "Dentist",
        label: "Dentist",
    },
    {
        value: "Dermatologist",
        label: "Dermatologist",
    },
    {
        value: "Cardiologist",
        label: "Cardiologist",
    },
    {
        value: "Pediatrician",
        label: "Pediatrician",
    },
    {
        value: "Orthopedic",
        label: "Orthopedic",
    },
    {
        value: "General Physician",
        label: "General Physician",
    },
    {
        value: "Neurologist",
        label: "Neurologist",
    },
    {
        value: "Psychiatrist",
        label: "Psychiatrist",
    },
]