import { useEffect, useMemo, useState } from "react";
import { X, Clock, Star, Square } from "lucide-react";
import { addHours, format } from "date-fns";
import { toast } from "@/components/ui/sonner";

const participants = [
  { name: "Alex", color: "bg-google-blue" },
  { name: "Sam", color: "bg-google-orange" },
  { name: "Jordan", color: "bg-google-red" },
  { name: "You", color: "bg-google-green" },
];

const dotColorMap: Record<string, string> = {
  green: "bg-google-green",
  red: "bg-google-red",
  blue: "bg-google-blue",
};

interface Props {
  selectedSlot: { start: Date; end: Date };
  onClose?: () => void;
  onShowHeatmap?: () => void;
  onShowPoll?: () => void;
  onSendInvite?: (payload: {
    start: Date;
    end: Date;
    title: string;
    location: string;
    description: string;
  }) => void;
}

const SmartSchedulingModal = ({
  selectedSlot,
  onClose,
  onShowHeatmap,
  onShowPoll,
  onSendInvite,
}: Props) => {
  const selectedStartTime = selectedSlot.start.getTime();

  const proposedSlots = useMemo(() => {
    const visibleStartHour = 8;
    const visibleEndHour = 17; // inclusive start time

    const clampStart = (d: Date) => {
      const next = new Date(d);
      next.setMinutes(0, 0, 0);
      const clampedHour = Math.min(Math.max(next.getHours(), visibleStartHour), visibleEndHour);
      next.setHours(clampedHour, 0, 0, 0);
      return next;
    };

    const candidates = [
      selectedSlot.start,
      addHours(selectedSlot.start, 2),
      addHours(selectedSlot.start, 1),
      addHours(selectedSlot.start, -1),
    ];

    const uniqueStarts: number[] = [];
    const slots: Array<{ start: Date; end: Date }> = [];
    for (const c of candidates) {
      const start = clampStart(c);
      const key = start.getTime();
      if (uniqueStarts.includes(key)) continue;
      uniqueStarts.push(key);
      slots.push({ start, end: addHours(start, 1) });
    }

    if (slots.length === 0) {
      const start = clampStart(selectedSlot.start);
      return [{ start, end: addHours(start, 1) }];
    }

    return slots;
  }, [selectedStartTime]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedStartTime]);

  const selectedProposedSlot = proposedSlots[Math.min(selectedIndex, proposedSlots.length - 1)];

  const formatTimeRange = (start: Date, end: Date) => {
    const startTime = format(start, "h:mm");
    const endTime = format(end, "h:mm");
    const startMeridiem = format(start, "a");
    const endMeridiem = format(end, "a");
    if (startMeridiem === endMeridiem) return `${startTime}–${endTime} ${startMeridiem}`;
    return `${startTime} ${startMeridiem}–${endTime} ${endMeridiem}`;
  };

  const titleValue = `Team Sync — ${format(selectedProposedSlot.start, "MMM d")}`;
  const locationValue = "Add location";
  const descriptionValue = "Add description";

  const statusMeta = [
    { status: "4/4 free", statusColor: "text-foreground", dots: ["green", "green", "green", "green"] },
    { status: "Sam has conflict", statusColor: "text-google-red", dots: ["green", "red", "green", "green"] },
    { status: "Jordan has conflict", statusColor: "text-google-red", dots: ["green", "green", "red", "green"] },
    { status: "Sam, Jordan have conflict", statusColor: "text-google-red", dots: ["green", "red", "red", "green"] },
  ];

  return (
    <div className="w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden bg-card border border-border">
      {/* Header */}
      <div className="bg-google-blue px-6 py-4 flex items-center justify-between">
        <h2 className="text-primary-foreground text-lg font-medium">
          New Event — Smart Scheduling Panel
        </h2>
        <button onClick={onClose} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex">
        {/* Left Side */}
        <div className="flex-1 p-6 border-r border-border">
          {/* Title */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
              Title
            </label>
            <input
              type="text"
              readOnly
              value={titleValue}
              className="w-full text-lg font-medium text-foreground bg-transparent border-b-2 border-google-blue pb-1 outline-none"
            />
          </div>

          {/* Participants */}
          <div className="mb-6">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Participants
            </label>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <span
                  key={p.name}
                  className={`${p.color} text-primary-foreground text-sm px-3 py-1 rounded-full font-medium`}
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {/* Placeholder fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-5 h-5" />
              <span className="text-sm">
                {format(selectedProposedSlot.start, "EEE MMM d")} · {formatTimeRange(selectedProposedSlot.start, selectedProposedSlot.end)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="text-sm text-muted-foreground">{locationValue}</div>
            <div className="h-px bg-border" />
            <div className="text-sm text-muted-foreground">{descriptionValue}</div>
          </div>

          {/* Keep these fields simple/read-only for now; the page is meant to be a working demo UI. */}
        </div>

        {/* Right Side — Smart Scheduling Panel */}
        <div className="w-72 p-5 bg-secondary/50">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Smart Scheduling Panel
          </h3>

          <div className="space-y-3">
            {proposedSlots.map((slot, i) => {
              const meta = statusMeta[i] ?? statusMeta[statusMeta.length - 1];
              const isBest = i === 0;
              const isSelected = i === selectedIndex;
              return (
              <div
                key={i}
                className={`rounded-lg p-3 border cursor-pointer transition-colors ${
                  isBest
                    ? "bg-best-match-bg border-best-match-border"
                    : isSelected
                      ? "bg-google-blue/10 border-google-blue/50"
                      : "bg-card border-border hover:border-google-blue/30"
                }`}
                onClick={() => setSelectedIndex(i)}
              >
                {isBest && (
                  <div className="flex items-center gap-1 mb-1.5">
                    <Star className="w-3.5 h-3.5 text-google-gold fill-google-gold" />
                    <span className="text-xs font-bold text-google-gold uppercase tracking-wide">
                      Best Match
                    </span>
                  </div>
                )}
                <p className="text-sm font-medium text-foreground">
                  {format(slot.start, "EEE MMM d")} · {formatTimeRange(slot.start, slot.end)}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-xs ${meta.statusColor}`}>
                    {meta.status}
                  </span>
                  <div className="flex gap-1">
                    {meta.dots.map((color, j) => (
                      <span
                        key={j}
                        className={`w-2.5 h-2.5 rounded-full ${dotColorMap[color]}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Links */}
          <div className="mt-5 space-y-2">
            <button onClick={onShowHeatmap} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <Square className="w-4 h-4" />
              Show availability heatmap
            </button>
            <button onClick={onShowPoll} className="text-sm text-google-blue cursor-pointer hover:underline">
              Not sure? Send a poll instead.
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
        <button
          className="px-5 py-2 text-sm font-medium text-google-blue border border-google-blue rounded-full hover:bg-google-blue/5 transition-colors"
          onClick={() => onShowHeatmap?.()}
        >
          Choose Different Time
        </button>
        <button
          className="px-5 py-2 text-sm font-medium text-primary-foreground bg-google-blue rounded-full hover:opacity-90 transition-opacity"
          onClick={() => {
            onSendInvite?.({
              start: selectedProposedSlot.start,
              end: selectedProposedSlot.end,
              title: titleValue,
              location: locationValue,
              description: descriptionValue,
            });
            toast.success("Invite sent (demo)");
            onClose?.();
          }}
        >
          Send Invite ({format(selectedProposedSlot.start, "h:mm a")})
        </button>
      </div>
    </div>
  );
};

export default SmartSchedulingModal;
