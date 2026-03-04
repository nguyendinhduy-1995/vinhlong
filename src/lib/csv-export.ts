/* ═══════════════════════════════════════════════════════════════
   CSV Export Utility
   ═══════════════════════════════════════════════════════════════ */

type CsvColumn<T> = {
    header: string;
    accessor: (row: T) => string | number | null | undefined;
};

/**
 * Convert an array of objects to CSV string and trigger download.
 * Handles Vietnamese text, commas, quotes, and newlines properly.
 */
export function exportCsv<T>(
    filename: string,
    columns: CsvColumn<T>[],
    data: T[]
) {
    const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility

    const escape = (val: unknown): string => {
        const str = val == null ? "" : String(val);
        // Wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const header = columns.map((col) => escape(col.header)).join(",");
    const rows = data.map((row) =>
        columns.map((col) => escape(col.accessor(row))).join(",")
    );

    const csv = BOM + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
