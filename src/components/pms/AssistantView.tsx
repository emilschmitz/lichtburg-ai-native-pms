/**
 * AI Assistant view — operator types a desired stay (natural language or
 * structured form), the AI returns ranked alternatives with trade-offs.
 *
 * Calls into `@/lib/ai` only — never imports a specific provider directly.
 */

import { useState } from "react";
import {
  ROOMS,
  BEDS,
  BOOKINGS,
  TODAY,
  ROOM_CLASS_LABEL,
  NEXT_WEEK_START,
  NEXT_WEEK_END,
} from "@/data/hostel";
import type { RoomClass } from "@/data/hostel/types";
import {
  buildOccupationContext,
  getAlternativesProvider,
  listProviders,
  setActiveProvider,
  type AISuggestionsResponse,
  type ProviderId,
} from "@/lib/ai";
import { addDaysISO, formatShort } from "@/lib/pms/dates";
import { ArrowRight, Loader2, Sparkles, Wand2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CLASS_TOKEN: Record<string, string> = {
  shared_mixed: "bg-class-shared",
  shared_female: "bg-class-female",
  double_private: "bg-class-double",
  single_private: "bg-class-single",
  private_ensuite: "bg-class-private",
};

export function AssistantView() {
  const [naturalLanguage, setNaturalLanguage] = useState(
    `Solo traveler "Mr. Sato" wants to stay the full next week (${NEXT_WEEK_START} to ${NEXT_WEEK_END}). Prefers a mixed shared dorm but is open to alternatives if needed.`,
  );
  const [checkIn, setCheckIn] = useState(NEXT_WEEK_START);
  const [checkOut, setCheckOut] = useState(NEXT_WEEK_END);
  const [guests, setGuests] = useState(1);
  const [preferredClass, setPreferredClass] = useState<RoomClass | "">("shared_mixed");
  const [providerId, setProviderId] = useState<ProviderId>("openai");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AISuggestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      setActiveProvider(providerId);
      const provider = getAlternativesProvider(providerId);
      const context = buildOccupationContext({
        rooms: ROOMS,
        beds: BEDS,
        bookings: BOOKINGS,
        windowStart: addDaysISO(checkIn, -1),
        windowEnd: addDaysISO(checkOut, 1),
        desiredCheckIn: checkIn,
        desiredCheckOut: checkOut,
        preferredClass: preferredClass || undefined,
      });
      const out = await provider.suggestAlternatives({
        desired: {
          naturalLanguage,
          checkIn,
          checkOut,
          guests,
          preferredClass: preferredClass || undefined,
        },
        context,
      });
      setResult(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

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
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
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

          <Field label="AI provider (swappable)">
            <div className="hairline divide-x divide-[var(--color-hairline)] flex">
              {listProviders().map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProviderId(p.id as ProviderId)}
                  className={cn(
                    "flex-1 px-2 py-1.5 text-[11px] font-medium",
                    providerId === p.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-secondary",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full hairline bg-foreground text-background py-2.5 text-[12px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> Find alternatives
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
        {!result && !loading && (
          <div className="h-full flex items-center justify-center text-center px-8">
            <div className="max-w-md">
              <Sparkles className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-[14px] font-semibold mb-2">No request yet</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Describe a desired stay on the left. The assistant will inspect
                current occupancy, find chainable bed sequences, and rank
                alternatives by trade-off (room switches, class match, price).
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="p-6 space-y-6">
            <header className="hairline bg-card p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Resolved stay · provider <span className="font-mono">{result.provider}</span>
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
                No valid alternative found.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {result.suggestions.map((s, idx) => (
                  <SuggestionCard key={s.id} suggestion={s} rank={idx + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
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
}: {
  suggestion: AISuggestionsResponse["suggestions"][number];
  rank: number;
}) {
  return (
    <article className="hairline bg-card flex flex-col">
      <header className="hairline-b px-4 py-3 flex items-start gap-3">
        <span className="hairline bg-foreground text-background h-6 w-6 flex items-center justify-center text-[11px] font-bold tabular shrink-0">
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold leading-snug">{suggestion.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 tabular">
            {suggestion.totalNights} nights · €{suggestion.totalPrice.toFixed(0)} total · {suggestion.switches} switch{suggestion.switches === 1 ? "" : "es"}
          </div>
        </div>
        <span className="text-[10px] tabular text-muted-foreground shrink-0">
          conf {Math.round(suggestion.confidence * 100)}%
        </span>
      </header>

      <div className="px-4 py-3 hairline-b">
        <p className="text-[12px] leading-relaxed text-foreground/85">{suggestion.rationale}</p>
      </div>

      <ol className="divide-y divide-[var(--color-hairline)]">
        {suggestion.legs.map((leg, i) => (
          <li key={i} className="px-4 py-2.5 flex items-center gap-3 text-[12px]">
            <span
              className={cn(
                "h-2.5 w-2.5 hairline shrink-0",
                CLASS_TOKEN[leg.roomClass],
              )}
            />
            <span className="font-mono font-semibold tabular w-12">{leg.roomNumber}</span>
            <span className="flex-1 min-w-0 truncate">
              <span className="font-medium">{leg.roomName}</span>
              <span className="text-muted-foreground"> · {leg.bedLabel}</span>
            </span>
            <span className="tabular text-muted-foreground shrink-0">
              {leg.from} <ChevronRight className="inline h-3 w-3" /> {leg.to}
            </span>
            <span className="tabular w-12 text-right shrink-0">{leg.nights}n</span>
            <span className="tabular w-14 text-right shrink-0">€{leg.pricePerNight}</span>
          </li>
        ))}
      </ol>

      <footer className="hairline-t px-4 py-2.5 bg-secondary/40">
        <ul className="space-y-1">
          {suggestion.tradeoffs.map((t, i) => (
            <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1.5">
              <span className="text-muted-foreground mt-1">›</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
}
