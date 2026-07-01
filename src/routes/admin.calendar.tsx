import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { holidays } from "@/data/holidays";
import { DataTableShell } from "@/components/app/DataTableShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <>
      <AppHeader title="School Calendar" subtitle="Academic year 2026–27" />
      <div className="p-4 sm:p-6">
        <DataTableShell minWidth={600}>
          <Table>
            <TableHeader>
              <TableRow className="bg-brand hover:bg-brand">
                {["Date","Day","Event","Type"].map((h) => (
                  <TableHead key={h} className="text-brand-foreground font-semibold uppercase text-[11px] tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h) => {
                const d = new Date(h.date);
                return (
                  <TableRow key={h.date}>
                    <TableCell className="font-medium whitespace-nowrap">{d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</TableCell>
                    <TableCell>{d.toLocaleDateString("en-IN", { weekday: "long" })}</TableCell>
                    <TableCell>{h.name}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        h.type === "national" ? "bg-crimson text-crimson-foreground" : h.type === "festival" ? "bg-amber-600 text-white" : "bg-brand text-brand-foreground"
                      }`}>{h.type}</span>
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTableShell>
      </div>
    </>
  );
}
