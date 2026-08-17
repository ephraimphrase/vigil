"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { DayPicker, UI, SelectionState, DayFlag, type DateRange as RdpDateRange } from "react-day-picker";
import { PiCalendarBlankLight, PiCaretLeftLight, PiCaretRightLight } from "react-icons/pi";
import { CornerFrame } from "@/components/ui/CornerFrame";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// ─── FORMAT / CONVERT ───
function toIsoDate(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIsoDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatTriggerLabel(range: DateRange, placeholder: string): string {
  if (range.start && range.end) return `${formatShort(range.start)} – ${formatShort(range.end)}`;
  if (range.start) return formatShort(range.start);
  return placeholder;
}

function toRdpRange(range: DateRange): RdpDateRange | undefined {
  if (!range.start) return undefined;
  return { from: range.start, to: range.end ?? undefined };
}

const classNames = {
  [UI.Root]: "font-sans",
  [UI.Months]: "flex gap-6",
  [UI.Month]: "flex-1",
  [UI.MonthCaption]: "flex items-center justify-center",
  [UI.CaptionLabel]: "font-display text-sm leading-none text-body",
  [UI.Nav]: "",
  [UI.PreviousMonthButton]:
    "flex h-6 w-6 items-center justify-center border border-hairline text-muted transition-colors hover:border-violet hover:text-violet-bright disabled:pointer-events-none disabled:opacity-30",
  [UI.NextMonthButton]:
    "flex h-6 w-6 items-center justify-center border border-hairline text-muted transition-colors hover:border-violet hover:text-violet-bright disabled:pointer-events-none disabled:opacity-30",
  [UI.MonthGrid]: "mt-3 w-full border-collapse",
  [UI.Weekdays]: "",
  [UI.Weekday]: "pb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted",
  [UI.Weeks]: "",
  [UI.Week]: "",
  [UI.Day]: "p-0 text-center",
  [UI.DayButton]:
    "mx-auto flex h-7 w-7 items-center justify-center font-mono text-xs tabular-nums text-body transition-colors hover:border hover:border-hairline",
  [DayFlag.outside]: "invisible pointer-events-none",
  [DayFlag.disabled]: "pointer-events-none opacity-30",
  [DayFlag.today]: "text-violet-bright",
  [SelectionState.range_start]: "!bg-violet !text-white",
  [SelectionState.range_end]: "!bg-violet !text-white",
  [SelectionState.range_middle]: "!bg-violet/15 !text-body",
  [SelectionState.selected]: "!bg-violet !text-white",
};

function Chevron({ orientation }: { orientation?: "left" | "right" | "up" | "down" }) {
  return orientation === "right" ? (
    <PiCaretRightLight className="h-3.5 w-3.5" />
  ) : (
    <PiCaretLeftLight className="h-3.5 w-3.5" />
  );
}

// ─── MAIN ───
export function DateRangePicker({ value, onChange, className = "", placeholder = "Date range" }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const [month, setMonth] = useState(() => value.start ?? new Date());

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setMonth(value.start ?? new Date());
  }, [open, value]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
          value.start || value.end
            ? "border-violet text-violet-bright"
            : "border-hairline text-muted hover:border-hairline/60"
        } ${className}`}
      >
        <PiCalendarBlankLight className="h-3.5 w-3.5" />
        {formatTriggerLabel(value, placeholder)}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-bg/70 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[42rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 transition-all data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
          <CornerFrame className="bg-panel">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <Dialog.Title className="font-display text-lg leading-none text-body">Date range.</Dialog.Title>
                <Dialog.Close
                  aria-label="Close date range"
                  className="flex h-5 w-5 items-center justify-center border border-transparent font-body text-sm leading-none text-muted transition-colors hover:border-hairline hover:text-body"
                >
                  &times;
                </Dialog.Close>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">Start date</span>
                  <input
                    type="date"
                    value={toIsoDate(draft.start)}
                    onChange={(e) => {
                      const d = fromIsoDate(e.target.value);
                      setDraft((prev) => ({ ...prev, start: d }));
                      if (d) setMonth(d);
                    }}
                    className="w-full border border-hairline bg-base px-2.5 py-1.5 font-mono text-sm text-body outline-none [color-scheme:dark] focus:border-violet"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">End date</span>
                  <input
                    type="date"
                    value={toIsoDate(draft.end)}
                    onChange={(e) => setDraft((prev) => ({ ...prev, end: fromIsoDate(e.target.value) }))}
                    className="w-full border border-hairline bg-base px-2.5 py-1.5 font-mono text-sm text-body outline-none [color-scheme:dark] focus:border-violet"
                  />
                </label>
              </div>

              <div className="mt-5 divide-x divide-hairline">
                <DayPicker
                  mode="range"
                  numberOfMonths={2}
                  month={month}
                  onMonthChange={setMonth}
                  selected={toRdpRange(draft)}
                  onSelect={(range) => setDraft({ start: range?.from ?? null, end: range?.to ?? null })}
                  showOutsideDays
                  weekStartsOn={0}
                  classNames={classNames}
                  components={{ Chevron }}
                  formatters={{ formatWeekdayName: (day) => WEEKDAY_LETTERS[day.getDay()] ?? "" }}
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="font-mono text-xs text-muted">
                  {draft.start ? formatShort(draft.start) : "—"}
                  {" → "}
                  {draft.end ? formatShort(draft.end) : "—"}
                </span>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(EMPTY_RANGE)}
                    className="rounded-full border border-hairline px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-body"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(draft);
                      setOpen(false);
                    }}
                    className="rounded-full bg-gradient-to-br from-violet-bright to-violet px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </CornerFrame>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
