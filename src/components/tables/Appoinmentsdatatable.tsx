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
                    <div className="flex items-center py-4 flex-wrap">
                        <Input
                            placeholder="Filter names..."
                            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("name")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm mb-2 md:mb-0"
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
    { value: "Active Release Therapy", label: "Active Release Therapy" },
    { value: "Acupuncture", label: "Acupuncture" },
    { value: "Athlete Performance Diet", label: "Athlete Performance Diet" },
    { value: "Bodybuilding Nutrition", label: "Bodybuilding / Muscle Gain Nutrition" },
    { value: "Balanced Diet", label: "Balanced Diet Planning" },
    { value: "Cardiac Diet", label: "Cardiac Diet Planning (Heart Health)" },
    { value: "Cancer Nutrition", label: "Cancer Nutrition" },
    { value: "Child Nutrition", label: "Child Nutrition" },
    { value: "Diabetic Diet", label: "Diabetic Diet Planning" },
    { value: "Dry Cupping", label: "Dry Cupping (Spot, Movement, Fire)" },
    { value: "Dry Needling", label: "Dry Needling/Trigger Point Therapy" },
    { value: "Electrotherapy", label: "Electrotherapy (TENS, Ultrasound)" },
    { value: "Endurance Diet", label: "Endurance & Recovery Diet" },
    { value: "Elderly Care", label: "Elderly Care/Geriatric Therapy" },
    { value: "Foot & Reflexology Massage", label: "Foot & Reflexology Massage" },
    { value: "Gastrointestinal Diet", label: "Gastrointestinal Diet (IBS, Acidity, Digestion)" },
    { value: "Geriatric Nutrition", label: "Geriatric Nutrition (Elderly)" },
    { value: "Head/Neck/Shoulder Massage", label: "Head/Neck/Shoulder Massage" },
    { value: "Hot Stone Massage", label: "Hot Stone Massage" },
    { value: "Immunity Diet", label: "Immunity-Boosting Diets" },
    { value: "IASTM", label: "IASTM (Instrument Assisted Soft Tissue Mobilization)" },
    { value: "Meditation Therapy", label: "Meditation & Mindfulness Therapy" },
    { value: "Myofascial Release", label: "Myofascial Release" },
    { value: "Neurological Therapy", label: "Neurological Therapy (Stroke, Paralysis, Parkinson's)" },
    { value: "Orthopedic Therapy", label: "Orthopedic Therapy (Fracture, Joint Issues)" },
    { value: "PCOS Diet", label: "PCOS/PCOD Diet Plans" },
    { value: "Pediatric Nutrition", label: "Pediatric Nutrition (child-specific)" },
    { value: "Post-Surgery Rehabilitation", label: "Post-Surgery Rehabilitation" },
    { value: "Posture Correction", label: "Posture Correction" },
    { value: "Pregnancy Nutrition", label: "Pregnancy & Lactation Nutrition" },
    { value: "Renal Diet", label: "Renal Diet (Kidney Patients)" },
    { value: "Skin Hair Diet", label: "Skin & Hair Nutrition" },
    { value: "Sleep Therapy", label: "Sleep Therapy" },
    { value: "Sports Therapy", label: "Sports Therapy (Injury Recovery, Muscle Strain)" },
    { value: "Stress Diet", label: "Stress & Anxiety Food Plans" },
    { value: "Stress Management Therapy", label: "Stress Management Therapy" },
    { value: "Swedish Massage", label: "Swedish Massage (Relaxation)" },
    { value: "Thai Massage", label: "Thai Massage (Stretch-based)" },
    { value: "Weight Loss", label: "Weight Loss/Gain Diets" },
    { value: "Weight Management Therapy", label: "Weight Management Therapy" },
    { value: "Wet Cupping", label: "Wet Cupping (Hijama, Detoxification)" },
    { value: "Women's Health", label: "Women's Health (Pre/Postnatal Therapy, PCOS Care)" },
    { value: "Yoga Therapy", label: "Yoga Therapy" }
];

