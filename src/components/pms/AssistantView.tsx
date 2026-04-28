/**
 * AI Assistant view — operator types a desired stay (natural language or
 * structured form) and the AI returns ranked booking configurations
 * (sequences of beds that together cover the stay).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ROOMS,
  BEDS,
  ROOM_CLASS_LABEL,
} from "@/data/hostel";
import { useBookings } from "@/lib/pms/bookings-store";
import type { RoomClass } from "@/data/hostel/types";
import {
  buildOccupationContext,
  type AISuggestion,
  type AISuggestionsResponse,
} from "@/lib/ai";
import { suggestAlternativesStreaming } from "@/lib/ai/openai-provider";
import { addDaysISO, formatShort } from "@/lib/pms/dates";
import { ArrowRight, Loader2, Sparkles, Wand2, ChevronRight, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePmsUi } from "@/lib/pms/ui-store";

const CLASS_TOKEN: Record<string, string> = {
  shared_mixed: "bg-class-shared",
  shared_female: "bg-class-female",
  double_private: "bg-class-double",
  single_private: "bg-class-single",
  private_ensuite: "bg-class-private",
};

export function AssistantView() {
  const { bookings } = useBookings();
  const { openNewBooking } = usePmsUi();

  const [naturalLanguage, setNaturalLanguage] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<number | "">("");
  const [preferredClass, setPreferredClass] = useState<RoomClass | "">("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISuggestionsResponse | null>(null);
  const [streamText, setStreamText] = useState("");
  const [partialSuggestions, setPartialSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);

  // Tick the elapsed-time counter while loading
  useEffect(() => {
    if (!loading) return;
    startedAtRef.current = performance.now();
    setElapsedMs(0);
    const id = setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsedMs(performance.now() - startedAtRef.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, [loading]);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);
    setStreamText("");
    setPartialSuggestions([]);
    try {
      const winStart = checkIn || addDaysISO(new Date().toISOString().slice(0, 10), 0);
      const winEnd = checkOut || addDaysISO(winStart, 14);
      const context = buildOccupationContext({
        rooms: ROOMS,
        beds: BEDS,
        bookings,
        windowStart: addDaysISO(winStart, -1),
        windowEnd: addDaysISO(winEnd, 1),
        desiredCheckIn: checkIn || undefined,
        desiredCheckOut: checkOut || undefined,
        preferredClass: preferredClass || undefined,
      });
      let acc = "";
      const out = await suggestAlternativesStreaming({
        desired: {
          naturalLanguage: naturalLanguage || undefined,
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
          guests: typeof guests === "number" ? guests : undefined,
          preferredClass: preferredClass || undefined,
        },
        context,
        onDelta: (t) => {
          acc += t;
          setStreamText(acc);
          const parsed = extractCompleteSuggestions(acc);
          if (parsed.length > 0) setPartialSuggestions(parsed);
        },
      });
      setResult(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleBookSuggestion(s: AISuggestionsResponse["suggestions"][number]) {
    // Open the New Booking dialog prefilled with the first leg; user can
    // add the rest with "Extend onto another bed" — we also send the full
    // legs via window state through ui-store extension would be cleaner but
    // for now we just prefill the first leg as a starting point.
    openNewBooking({
      bedId: s.legs[0]?.bedId,
      checkIn: s.legs[0]?.from,
      checkOut: s.legs[0]?.to,
    });
  }

  const canSubmit =
    naturalLanguage.trim().length > 0 || (checkIn && checkOut);

  return (
    <div className="flex h-full">
      {/* Left: input */}
      <div className="w-[380px] hairline-r bg-card flex flex-col shrink-0">
        <header className="hairline-b px-4 py-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <h2 className="text-[13px] font-semibold uppercase tracking-wider">
            New stay assistant
          </h2>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <Field label="Describe the request (natural language)">
            <textarea
              value={naturalLanguage}
              onChange={(e) => setNaturalLanguage(e.target.value)}
              rows={4}
              className="w-full hairline bg-background px-3 py-2 text-[12px] font-mono leading-relaxed resize-y"
              placeholder='e.g. "Couple wants 5 nights, en-suite if possible"'
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular"
              />
            </Field>
            <Field label="Check-out">
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Guests">
              <input
                type="number"
                min={1}
                max={4}
                value={guests}
                onChange={(e) => {
                  const v = e.target.value;
                  setGuests(v === "" ? "" : parseInt(v) || "");
                }}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px] tabular"
              />
            </Field>
            <Field label="Preferred class">
              <select
                value={preferredClass}
                onChange={(e) => setPreferredClass(e.target.value as RoomClass | "")}
                className="w-full hairline bg-background px-2 py-1.5 text-[12px]"
              >
                <option value="">No preference</option>
                {Object.entries(ROOM_CLASS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="w-full hairline bg-foreground text-background py-2.5 text-[12px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> Find booking configuration
              </>
            )}
          </button>

          {error && (
            <div className="hairline bg-destructive/10 text-destructive text-[11px] px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: results */}
      <div className="flex-1 min-w-0 overflow-auto bg-background">
        {loading && (
          <div className="flex flex-col">
            <header className="hairline-b px-6 py-3 flex items-center gap-2 bg-card sticky top-0 z-10">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                {partialSuggestions.length === 0 ? "Thinking…" : "Generating…"}
              </span>
              <span className="text-[11px] text-muted-foreground tabular ml-auto">
                {(elapsedMs / 1000).toFixed(1)}s
                {partialSuggestions.length > 0 && (
                  <> · {partialSuggestions.length} option{partialSuggestions.length === 1 ? "" : "s"}</>
                )}
              </span>
            </header>

            {partialSuggestions.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {partialSuggestions.map((s, idx) => (
                    <SuggestionCard
                      key={s.id || idx}
                      suggestion={s}
                      rank={idx + 1}
                      onBook={() => handleBookSuggestion(s)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-[12px] text-muted-foreground">
                Inspecting occupancy and ranking options…
              </div>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="h-full flex items-center justify-center text-center px-8">
            <div className="max-w-md">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-[14px] font-semibold mb-2">No request yet</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Describe a desired stay on the left. The assistant will inspect
                current occupancy, find chainable bed sequences across rooms,
                and rank booking configurations by trade-off.
              </p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="p-6 space-y-6">
            <header className="hairline bg-card p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Resolved stay
              </div>
              <div className="mt-1 text-[14px] font-semibold tabular">
                {formatShort(result.resolvedStay.checkIn)}
                <ArrowRight className="inline-block h-3 w-3 mx-2 align-middle" />
                {formatShort(result.resolvedStay.checkOut)} · {result.resolvedStay.guests} guest(s)
                {result.resolvedStay.preferredClass && (
                  <span className="text-muted-foreground font-normal">
                    {" · "}
                    prefers {ROOM_CLASS_LABEL[result.resolvedStay.preferredClass]}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[12px] text-foreground/80 leading-relaxed">
                {result.summary}
              </p>
            </header>

            {result.suggestions.length === 0 ? (
              <div className="hairline bg-card p-8 text-center text-[12px] text-muted-foreground">
                No valid configuration found.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {result.suggestions.map((s, idx) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    rank={idx + 1}
                    onBook={() => handleBookSuggestion(s)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Extract complete `suggestion` objects from a partially-streamed JSON string.
 * Walks the character stream after `"suggestions": [` and returns every
 * fully-balanced `{ ... }` object found so far. Strings (and escapes within
 * them) are skipped so braces inside strings don't confuse the counter.
 */
function extractCompleteSuggestions(text: string): AISuggestion[] {
  const keyIdx = text.indexOf('"suggestions"');
  if (keyIdx === -1) return [];
  const bracketIdx = text.indexOf("[", keyIdx);
  if (bracketIdx === -1) return [];

  const out: AISuggestion[] = [];
  let i = bracketIdx + 1;
  while (i < text.length) {
    while (i < text.length && (text[i] === " " || text[i] === "\n" || text[i] === "\r" || text[i] === "\t" || text[i] === ",")) i++;
    if (i >= text.length || text[i] === "]") break;
    if (text[i] !== "{") { i++; continue; }
    const start = i;
    let depth = 0;
    let inStr = false;
    let esc = false;
    let end = -1;
    for (; i < text.length; i++) {
      const c = text[i];
      if (inStr) {
        if (esc) { esc = false; continue; }
        if (c === "\\") { esc = true; continue; }
        if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) { end = i + 1; i++; break; }
      }
    }
    if (end === -1) break;
    try {
      const obj = JSON.parse(text.slice(start, end)) as AISuggestion;
      if (obj && Array.isArray(obj.legs)) out.push(obj);
    } catch {
      // skip malformed
    }
  }
  return out;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

function SuggestionCard({
  suggestion,
  rank,
  onBook,
}: {
  suggestion: AISuggestionsResponse["suggestions"][number];
  rank: number;
  onBook: () => void;
}) {
  const isUpsell = !!suggestion.upsell;
  return (
    <article
      className={cn(
        "hairline bg-card flex flex-col overflow-hidden",
        isUpsell && "ring-1 ring-foreground/40",
      )}
    >
      <header className="hairline-b px-4 py-3 flex items-start gap-3">
        <span className="hairline bg-foreground text-background h-6 w-6 flex items-center justify-center text-[11px] font-bold tabular shrink-0">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[13px] font-semibold leading-snug">{suggestion.title}</div>
            {isUpsell && (
              <span className="hairline bg-foreground text-background text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5" /> Upsell
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 tabular">
            {suggestion.totalNights} nights · €{suggestion.totalPrice.toFixed(0)} total · {suggestion.switches} switch{suggestion.switches === 1 ? "" : "es"}
          </div>
        </div>
      </header>

      <div className="px-4 py-3 hairline-b">
        <p className="text-[12px] leading-relaxed text-foreground/85">{suggestion.rationale}</p>
      </div>

      <ol className="divide-y divide-[var(--color-hairline)]">
        {suggestion.legs.map((leg, i) => (
          <li key={i} className="px-4 py-2.5 text-[12px] space-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={cn(
                  "h-2.5 w-2.5 hairline shrink-0",
                  CLASS_TOKEN[leg.roomClass],
                )}
              />
              <span className="font-mono font-semibold tabular shrink-0">{leg.roomNumber}</span>
              <span className="flex-1 min-w-0 truncate">
                <span className="font-medium">{leg.roomName}</span>
                <span className="text-muted-foreground"> · {leg.bedLabel}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 pl-[18px] text-[11px] tabular text-muted-foreground">
              <span className="truncate">
                {leg.from} <ChevronRight className="inline h-3 w-3" /> {leg.to}
              </span>
              <span className="ml-auto shrink-0">{leg.nights}n · €{leg.pricePerNight}</span>
            </div>
          </li>
        ))}
      </ol>

      <footer className="hairline-t px-4 py-2.5 bg-secondary/40 flex items-start gap-3">
        <ul className="space-y-1 flex-1 min-w-0">
          {suggestion.tradeoffs.map((t, i) => (
            <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1.5">
              <span className="text-muted-foreground mt-1">›</span>
              <span className="break-words min-w-0">{t}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onBook}
          className="hairline bg-foreground text-background px-2.5 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
          title="Open the new-booking dialog prefilled with this configuration"
        >
          <Plus className="h-3 w-3" /> Use this
        </button>
      </footer>
    </article>
  );
}
