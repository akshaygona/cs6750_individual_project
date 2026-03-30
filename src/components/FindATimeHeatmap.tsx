import { X, Star } from "lucide-react";
import { addDays, addHours, format, isSameDay } from "date-fns";

const hoursNumbers = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const hours = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];

// availability out of 4 for each cell [row][col]
const availability: (number | null)[][] = [
  [4, 3, 2, 1, 3],   // 9 AM
  [4, 4, 3, 0, 2],   // 10 AM
  [3, 2, 1, 0, 1],   // 11 AM
  [1, 0, 0, 0, 0],   // 12 PM
  [2, 1, 3, 2, 1],   // 1 PM
  [3, 3, 4, 1, 2],   // 2 PM
  [2, 1, 2, 3, 3],   // 3 PM
  [1, 0, 1, 2, 4],   // 4 PM
  [0, 0, 0, 1, 2],   // 5 PM
];

const cellBg = (val: number | null): string => {
  if (val === null || val === 0) return "bg-secondary";
  if (val === 1) return "bg-amber-100";
  if (val === 2) return "bg-amber-200";
  if (val === 3) return "bg-emerald-200";
  return "bg-teal-400";
};

const cellText = (val: number | null): string => {
  if (val === null || val === 0) return "text-muted-foreground";
  if (val >= 3) return "text-foreground font-semibold";
  return "text-foreground";
};

interface Props {
  weekStart: Date;
  selectedSlot?: { start: Date; end: Date } | null;
  onPickSlot: (slot: { start: Date; end: Date }) => void;
  onClose?: () => void;
}

const FindATimeHeatmap = ({ weekStart, selectedSlot, onPickSlot, onClose }: Props) => {
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Availability table is fixed to the best-match at [row=1][col=1] (Tue 10 AM).
  const bestDay = days[1];
  const bestStart = new Date(bestDay);
  bestStart.setHours(10, 0, 0, 0);
  const bestEnd = addHours(bestStart, 1);

  return (
    <div className="w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden bg-card border border-border">
      {/* Header */}
      <div className="bg-google-blue px-6 py-4 flex items-center justify-between">
        <h2 className="text-primary-foreground text-lg font-medium">
          Find a Time — Group Availability Heatmap
        </h2>
        <button
          onClick={onClose}
          className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5">
        {/* Pinned best match */}
        <div className="rounded-lg p-3 mb-5 flex items-center justify-between bg-best-match-bg border border-best-match-border">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-google-gold fill-google-gold" />
            <span className="text-sm font-bold text-google-gold uppercase tracking-wide">
              Best Match
            </span>
            <span className="text-sm font-medium text-foreground ml-1">
              — {format(bestStart, "EEE MMM d")} · {format(bestStart, "h:mm")}–{format(bestEnd, "h:mm")} {format(bestStart, "a")} — 4/4 free
            </span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-full bg-google-green" />
            ))}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-20 p-2 text-xs text-muted-foreground font-medium text-left" />
                {days.map((d) => (
                  <th
                    key={d.toISOString()}
                    className="p-2 text-xs font-semibold text-foreground text-center"
                  >
                    {format(d, "EEE M/d")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour, ri) => (
                <tr key={hour}>
                  <td className="p-2 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {hour}
                  </td>
                  {days.map((day, ci) => {
                    const val = availability[ri][ci];
                    const isBest = ri === 1 && ci === 1; // Tue 10 AM
                    const cellStart = new Date(day);
                    cellStart.setHours(hoursNumbers[ri], 0, 0, 0);
                    const cellEnd = addHours(cellStart, 1);
                    const isSelected =
                      selectedSlot?.start &&
                      isSameDay(selectedSlot.start, cellStart) &&
                      selectedSlot.start.getHours() === cellStart.getHours();
                    return (
                      <td key={day.toISOString()} className="p-1">
                        <div
                          className={`relative rounded-md h-10 flex items-center justify-center text-xs cursor-pointer transition-colors hover:ring-2 hover:ring-google-blue/40 ${cellBg(val)} ${cellText(val)} ${
                            isBest ? "ring-2 ring-google-red" : ""
                          } ${isSelected ? "ring-2 ring-google-blue/60" : ""}`}
                          onClick={() => onPickSlot({ start: cellStart, end: cellEnd })}
                        >
                          {isBest && (
                            <span className="absolute -top-2 left-1 text-[9px] font-bold text-google-gold flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-google-gold" />
                              Best
                            </span>
                          )}
                          {val !== null && val > 0 ? `${val}/4` : ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Color Key */}
        <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Availability:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-4 rounded bg-secondary border border-border" />
            None
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-4 rounded bg-amber-100" />
            1 of 4
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-4 rounded bg-emerald-200" />
            3 of 4
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-4 rounded bg-teal-400" />
            All 4
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindATimeHeatmap;
