export type Holiday = { date: string; name: string; type: "national" | "festival" | "school" };

export const holidays: Holiday[] = [
  { date: "2026-07-08", name: "Muharram", type: "festival" },
  { date: "2026-08-15", name: "Independence Day", type: "national" },
  { date: "2026-08-26", name: "Janmashtami", type: "festival" },
  { date: "2026-10-02", name: "Gandhi Jayanti", type: "national" },
  { date: "2026-10-20", name: "Dussehra", type: "festival" },
  { date: "2026-11-08", name: "Diwali Break Begins", type: "festival" },
  { date: "2026-11-14", name: "Children's Day", type: "school" },
  { date: "2026-12-25", name: "Christmas", type: "festival" },
  { date: "2027-01-26", name: "Republic Day", type: "national" },
  { date: "2027-03-04", name: "Holi", type: "festival" },
];
