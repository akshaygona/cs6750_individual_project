import { useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import { addHours, format } from "date-fns";

const steps = ["Propose Times", "Invite & Vote", "Confirm"];

interface Props {
  selectedSlot: { start: Date; end: Date };
  onClose?: () => void;
}

const PollSchedulingModal = ({ selectedSlot, onClose }: Props) => {
  const pollTimeSlots = useMemo(() => {
    const base = selectedSlot.start;
    const makeRange = (start: Date) => {
      const end = addHours(start, 1);
      const startTime = format(start, "h:mm");
      const endTime = format(end, "h:mm");
      const meridiem = format(start, "a");
      const meridiemEnd = format(end, "a");
      if (meridiem === meridiemEnd) return `${startTime}–${endTime} ${meridiem}`;
      return `${startTime} ${meridiem}–${endTime} ${meridiemEnd}`;
    };

    const candidates = [
      base,
      addHours(base, 2),
      addHours(base, 1),
      addHours(base, -1),
      addHours(base, 3),
    ];

    // Keep unique starts.
    const seen = new Set<number>();
    const unique: Date[] = [];
    for (const c of candidates) {
      const d = new Date(c);
      d.setMinutes(0, 0, 0);
      const k = d.getTime();
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(d);
    }

    // Limit to 5 display rows.
    return unique.slice(0, 5).map((d, i) => ({
      date: format(d, "EEE MMM d"),
      time: makeRange(d),
      defaultChecked: i < 3,
      start: d,
      end: addHours(d, 1),
    }));
  }, [selectedSlot.start]);

  const [checked, setChecked] = useState(pollTimeSlots.map((s) => s.defaultChecked));
  const currentStep = 0;

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  return (
    <div className="w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden bg-card border border-border">
      {/* Header */}
      <div className="bg-google-blue px-6 py-4 flex items-center justify-between">
        <h2 className="text-primary-foreground text-lg font-medium">
          Schedule Meeting — Quick Poll
        </h2>
        <button
          onClick={onClose}
          className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 py-5 flex items-center justify-center gap-0">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i === currentStep
                    ? "bg-google-blue text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs font-medium ${
                  i === currentStep ? "text-google-blue" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-16 border-t-2 border-dashed border-border mx-2 mb-5" />
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="px-6 pb-6">
        {/* Title */}
        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
            Meeting Title
          </label>
          <input
            type="text"
            readOnly
            value="Team Sync — Week of March 11"
            className="w-full text-lg font-medium text-foreground bg-transparent border-b-2 border-google-blue pb-1 outline-none"
          />
        </div>

        {/* Time slots */}
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 block">
          Proposed Time Slots (select up to 5)
        </label>
        <div className="space-y-2 mb-4">
          {pollTimeSlots.map((slot, i) => (
            <div
              key={i}
              onClick={() => toggle(i)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                checked[i]
                  ? "bg-best-match-bg border-google-green/40"
                  : "bg-card border-border hover:border-google-blue/30"
              }`}
            >
              <Checkbox
                checked={checked[i]}
                onCheckedChange={() => toggle(i)}
                className="data-[state=checked]:bg-google-green data-[state=checked]:border-google-green"
              />
              <span className="text-sm font-medium text-foreground min-w-[90px]">
                {slot.date}
              </span>
              <span className="text-sm text-muted-foreground">{slot.time}</span>
            </div>
          ))}
        </div>

        <button className="text-sm text-google-blue hover:underline flex items-center gap-1 mb-5">
          <Plus className="w-4 h-4" />
          Add Another Time
        </button>

        {/* Vote bars */}
        <div className="mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current votes
          </span>
        </div>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-1">
          <div className="bg-google-green flex-[4]" />
          <div className="bg-emerald-300 flex-[3]" />
          <div className="bg-amber-200 flex-[2]" />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>4/4</span>
          <span>3/4</span>
          <span>2/4</span>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm font-medium text-google-blue border border-google-blue rounded-full hover:bg-google-blue/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            const selected = pollTimeSlots.filter((_, i) => checked[i]);
            if (selected.length === 0) {
              toast.error("Select at least one time slot.");
              return;
            }
            toast.success(`Poll sent (demo) for ${selected.length} time(s).`);
            onClose?.();
          }}
          className="px-5 py-2 text-sm font-medium text-primary-foreground bg-google-blue rounded-full hover:opacity-90 transition-opacity"
        >
          Send Poll to Participants
        </button>
      </div>
    </div>
  );
};

export default PollSchedulingModal;
