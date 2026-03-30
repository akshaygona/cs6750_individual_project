import { useMemo, useState } from "react";
import {
  addDays,
  addHours,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Grid3X3,
  BarChart3,
  Vote,
  Menu,
} from "lucide-react";
import SmartSchedulingModal from "./SmartSchedulingModal";
import FindATimeHeatmap from "./FindATimeHeatmap";
import PollSchedulingModal from "./PollSchedulingModal";

type ModalView = "smart" | "heatmap" | "poll" | null;

const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM – 5 PM

const sampleEvents = [
  { day: 1, startHour: 9, duration: 1, title: "Standup", color: "bg-google-blue/20 border-l-4 border-google-blue" },
  { day: 1, startHour: 14, duration: 1.5, title: "Design Review", color: "bg-google-green/20 border-l-4 border-google-green" },
  { day: 2, startHour: 10, duration: 1, title: "1:1 with Alex", color: "bg-google-orange/20 border-l-4 border-google-orange" },
  { day: 3, startHour: 11, duration: 2, title: "Sprint Planning", color: "bg-google-red/20 border-l-4 border-google-red" },
  { day: 4, startHour: 9, duration: 1, title: "Standup", color: "bg-google-blue/20 border-l-4 border-google-blue" },
  { day: 4, startHour: 15, duration: 1, title: "Team Sync", color: "bg-google-green/20 border-l-4 border-google-green" },
  { day: 5, startHour: 13, duration: 1, title: "Retrospective", color: "bg-google-orange/20 border-l-4 border-google-orange" },
];

const CalendarShell = () => {
  const [activeModal, setActiveModal] = useState<ModalView>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [createdEvents, setCreatedEvents] = useState<
    Array<{ id: string; start: Date; end: Date; title: string; location: string; description: string }>
  >([]);

  const weekStart = useMemo(() => startOfWeek(viewDate, { weekStartsOn: 1 }), [viewDate]);
  const selectedSlotFallback = useMemo(() => {
    // Default to 10:00 AM on Monday of the visible week.
    const fallbackStart = addHours(weekStart, 10);
    // Ensure the fallback stays in the visible hour range.
    const hour = fallbackStart.getHours();
    const clamped = Math.min(Math.max(hour, 8), 17);
    fallbackStart.setHours(clamped, 0, 0, 0);
    return { start: fallbackStart, end: addHours(fallbackStart, 1) };
  }, [weekStart]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const d = addDays(weekStart, i);
        return {
          label: format(d, "EEE").toUpperCase(),
          date: format(d, "d"),
          full: format(d, "EEE M/d"),
          dateObj: d,
        };
      }),
    [weekStart],
  );

  const monthStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
  const monthGridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart]);
  const monthGrid = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i)), [monthGridStart]);
  const currentWeekStart = weekStart;
  const currentWeekEnd = useMemo(() => addDays(weekStart, 4), [weekStart]);

  const openSmartModalForSlot = (slot: { start: Date; end: Date }) => {
    setSelectedSlot(slot);
    setActiveModal("smart");
  };

  const defaultMonthLabel = format(viewDate, "MMMM yyyy");

  const closeModal = () => setActiveModal(null);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 border-b border-border flex items-center px-4 gap-4 shrink-0 bg-card">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-secondary rounded-full transition-colors">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <Calendar className="w-7 h-7 text-google-blue" />
        <h1 className="text-xl font-medium text-foreground hidden sm:block">
          Google Calendar
        </h1>

        <div className="flex items-center gap-1 ml-4">
          <button
            className="p-1.5 hover:bg-secondary rounded-full transition-colors"
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            aria-label="Previous month"
            type="button"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            className="p-1.5 hover:bg-secondary rounded-full transition-colors"
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            aria-label="Next month"
            type="button"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-lg font-medium text-foreground ml-2">
            {defaultMonthLabel}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-secondary rounded-full transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="px-4 py-1.5 text-sm font-medium border border-border rounded-md text-foreground">
            Week
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-60 border-r border-border p-4 shrink-0 hidden md:flex flex-col gap-4 bg-card">
            {/* Create Button */}
            <button
              onClick={() => openSmartModalForSlot(selectedSlotFallback)}
              className="flex items-center gap-3 px-6 py-3 rounded-full shadow-md hover:shadow-lg transition-shadow bg-card border border-border text-foreground"
            >
              <Plus className="w-8 h-8 text-google-blue" />
              <span className="text-sm font-medium">Create</span>
            </button>

            {/* Mini calendar placeholder */}
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-sm font-semibold text-foreground mb-2">{defaultMonthLabel}</p>
              <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i} className="font-semibold">
                    {d}
                  </span>
                ))}
                {monthGrid.map((d) => {
                  const dayInMonth = isSameMonth(d, viewDate);
                  const isInCurrentWeek = d >= currentWeekStart && d <= currentWeekEnd;
                  return (
                    <span
                      key={d.toISOString()}
                      className={`w-5 h-5 flex items-center justify-center rounded-full ${
                        dayInMonth
                          ? isInCurrentWeek
                            ? "bg-google-blue/10 text-google-blue font-semibold"
                            : "text-muted-foreground"
                          : "opacity-40"
                      }`}
                    >
                      {dayInMonth ? d.getDate() : ""}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Demo Feature Buttons */}
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                Demo Features
              </p>
              <button
                onClick={() => setActiveModal("smart")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors text-foreground"
              >
                <Grid3X3 className="w-4 h-4 text-google-blue" />
                Smart Scheduling
              </button>
              <button
                onClick={() => setActiveModal("heatmap")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors text-foreground"
              >
                <BarChart3 className="w-4 h-4 text-google-green" />
                Find a Time
              </button>
              <button
                onClick={() => setActiveModal("poll")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors text-foreground"
              >
                <Vote className="w-4 h-4 text-google-orange" />
                Quick Poll
              </button>
            </div>
          </aside>
        )}

        {/* Main Calendar Grid */}
        <main className="flex-1 overflow-auto">
          {/* Day headers */}
          <div className="sticky top-0 z-10 bg-card border-b border-border grid grid-cols-[60px_repeat(5,1fr)]">
            <div className="border-r border-border" />
            {weekDays.map((d) => (
              <div
                key={d.full}
                className={`py-3 text-center border-r border-border`}
              >
                <p className="text-xs text-muted-foreground font-medium">
                  {d.label}
                </p>
                <p className="text-2xl font-medium text-foreground">{d.date}</p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(5,1fr)] relative">
            {hours.map((h) => (
              <div key={h} className="contents">
                <div className="h-16 border-r border-border flex items-start justify-end pr-2 -mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
                  </span>
                </div>
                {weekDays.map((d, di) => (
                  <div
                    key={`${h}-${d.label}`}
                    className="h-16 border-r border-b border-border relative cursor-pointer hover:bg-google-blue/5 transition-colors"
                    onClick={() => {
                      const start = new Date(d.dateObj);
                      start.setHours(h, 0, 0, 0);
                      openSmartModalForSlot({ start, end: addHours(start, 1) });
                    }}
                  >
                    {sampleEvents
                      .filter((e) => e.day === di + 1 && e.startHour === h)
                      .map((e, ei) => (
                        <div
                          key={ei}
                          className={`absolute inset-x-1 top-0 rounded-md px-2 py-1 text-xs font-medium text-foreground ${e.color}`}
                          style={{ height: `${e.duration * 64}px`, zIndex: 5 }}
                        >
                          {e.title}
                        </div>
                      ))}
                    {createdEvents
                      .filter(
                        (ev) =>
                          isSameDay(ev.start, d.dateObj) &&
                          ev.start.getHours() === h &&
                          ev.start.getMinutes() === 0,
                      )
                      .map((ev, ei) => {
                        const durationHours = (ev.end.getTime() - ev.start.getTime()) / 3600000;
                        return (
                          <div
                            key={ev.id ?? ei}
                            className="absolute inset-x-1 top-0 rounded-md px-2 py-1 text-xs font-medium text-foreground bg-google-blue/25 border-l-4 border-google-blue"
                            style={{ height: `${durationHours * 64}px`, zIndex: 10 + ei }}
                          >
                            {ev.title}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {activeModal === "smart" && (
              <SmartSchedulingModal
                selectedSlot={selectedSlot ?? selectedSlotFallback}
                onClose={closeModal}
                onShowHeatmap={() => setActiveModal("heatmap")}
                onShowPoll={() => setActiveModal("poll")}
                onSendInvite={(payload) => {
                  const id =
                    typeof crypto !== "undefined" && "randomUUID" in crypto
                      ? crypto.randomUUID()
                      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                  setCreatedEvents((prev) => [...prev, { id, ...payload }]);
                }}
              />
            )}
            {activeModal === "heatmap" && (
              <FindATimeHeatmap
                weekStart={weekStart}
                selectedSlot={selectedSlot ?? selectedSlotFallback}
                onClose={closeModal}
                onPickSlot={(slot) => {
                  setSelectedSlot(slot);
                  setActiveModal("smart");
                }}
              />
            )}
            {activeModal === "poll" && (
              <PollSchedulingModal
                selectedSlot={selectedSlot ?? selectedSlotFallback}
                onClose={closeModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarShell;
