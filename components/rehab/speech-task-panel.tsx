"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  SPEECH_HARD_SOUND_OPTIONS,
  SPEECH_RATING_FIELDS,
  parseSpeechSession,
  serializeSpeechSession,
  type SpeechHardSound,
  type SpeechRatingKey,
  type SpeechSessionData,
} from "@/lib/rehab/speech-session";
import { speechReadingTextForDate } from "@/modules/rehab/neuro-rehab-2026/speech-content";
import {
  SPEECH_SPONTANEOUS_PROMPTS,
  type SpontaneousPromptKey,
} from "@/modules/rehab/neuro-rehab-2026/speech-reading-texts";
import { useRehabPlanStore } from "@/stores/rehab-plan-store";
import { cn } from "@/lib/utils";

export function SpeechTaskPanel({
  eventId,
  description,
  startAt,
  persistence,
  readOnly = false,
  className,
}: {
  eventId: string;
  description?: string | null;
  startAt: string;
  persistence: boolean;
  readOnly?: boolean;
  className?: string;
}) {
  const updateEvent = useRehabPlanStore((state) => state.updateEvent);
  const storeDescription = useRehabPlanStore(
    (state) => state.events.find((event) => event.id === eventId)?.description,
  );

  const reading = speechReadingTextForDate(new Date(startAt));
  const initial = parseSpeechSession(description ?? storeDescription);
  const [session, setSession] = useState<SpeechSessionData>(initial);
  const savingRef = useRef(false);

  useEffect(() => {
    setSession(parseSpeechSession(storeDescription ?? description));
  }, [description, eventId, storeDescription]);

  const persistSession = useCallback(
    async (next: SpeechSessionData) => {
      setSession(next);
      if (readOnly || !eventId || !persistence) {
        return;
      }

      if (savingRef.current) {
        return;
      }
      savingRef.current = true;

      const serialized = serializeSpeechSession(next);
      const result = await updateEvent({ id: eventId, description: serialized });

      if (!result.ok) {
        toast.error(result.message);
        setSession(parseSpeechSession(storeDescription ?? description));
      }

      savingRef.current = false;
    },
    [description, eventId, readOnly, storeDescription, updateEvent],
  );

  function setRating(key: SpeechRatingKey, value: number) {
    const nextRatings = { ...session.ratings };
    if (nextRatings[key] === value) {
      delete nextRatings[key];
    } else {
      nextRatings[key] = value;
    }
    void persistSession({ ...session, ratings: nextRatings });
  }

  function setSpontaneousChoice(key: SpontaneousPromptKey, optionId: string) {
    const nextSpontaneous = { ...session.spontaneous };
    if (nextSpontaneous[key] === optionId) {
      delete nextSpontaneous[key];
    } else {
      nextSpontaneous[key] = optionId;
    }

    const hasSelection = Object.keys(nextSpontaneous).length > 0;
    void persistSession({
      ...session,
      spontaneous: nextSpontaneous,
      spontaneousDone: hasSelection,
      spontaneousDoneAt: hasSelection
        ? (session.spontaneousDoneAt ?? new Date().toISOString())
        : null,
    });
  }

  function toggleHardSound(sound: SpeechHardSound) {
    const has = session.hardSounds.includes(sound);
    const hardSounds = has
      ? session.hardSounds.filter((item) => item !== sound)
      : [...session.hardSounds, sound];
    void persistSession({ ...session, hardSounds });
  }

  return (
    <div className={cn("mt-3 shrink-0 space-y-5 pb-2", className)}>
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-white">
          Speech recording — ~5 min
        </h3>
        <p className="text-sm leading-relaxed text-white/75">
          Sit upright, feet grounded, shoulders relaxed. Take 3 calm breaths.
          Record yourself reading the text below, then optionally tap how
          spontaneous speech felt and your ratings.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-white">{reading.title}</h4>
        <p className="text-xs text-white/55">{reading.hint}</p>
        <p className="text-base leading-relaxed text-white/90">{reading.body}</p>
      </div>

      <div className="space-y-4 border-t border-white/10 pt-4">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-white">
            Spontaneous speech (~30 sec)
          </h4>
          <p className="text-xs text-white/50">Optional — tap one per line</p>
        </div>

        {SPEECH_SPONTANEOUS_PROMPTS.map((prompt) => (
          <div key={prompt.key} className="space-y-1.5">
            <span className="text-sm text-white/75">{prompt.lead}</span>
            <div className="flex flex-wrap gap-1.5">
              {prompt.options.map((option) => {
                const selected = session.spontaneous[prompt.key] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() =>
                      setSpontaneousChoice(prompt.key, option.id)
                    }
                    aria-pressed={selected}
                    aria-label={`${prompt.lead} ${option.label}`}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors disabled:opacity-50",
                      selected
                        ? "bg-white font-semibold text-black"
                        : "bg-white/8 text-white/65 hover:bg-white/15 hover:text-white",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t border-white/10 pt-4">
        <p className="text-xs font-medium tracking-wide text-white/45 uppercase">
          Self-rate after recording
        </p>

        {SPEECH_RATING_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <span className="text-sm text-white/75">{field.label}</span>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 11 }, (_, score) => {
                const selected = session.ratings[field.key] === score;
                return (
                  <button
                    key={score}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setRating(field.key, score)}
                    aria-pressed={selected}
                    aria-label={`${field.label}: ${score}`}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-xs tabular-nums transition-colors disabled:opacity-50 sm:size-7",
                      selected
                        ? "bg-white font-semibold text-black"
                        : "bg-white/8 text-white/65 hover:bg-white/15 hover:text-white",
                    )}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="space-y-1.5">
          <span className="text-sm text-white/75">Hard words/sounds</span>
          <div className="flex flex-wrap gap-1.5">
            {SPEECH_HARD_SOUND_OPTIONS.map((sound) => {
              const selected = session.hardSounds.includes(sound);
              return (
                <button
                  key={sound}
                  type="button"
                  disabled={readOnly}
                  onClick={() => toggleHardSound(sound)}
                  aria-pressed={selected}
                  aria-label={`Hard sound: ${sound}`}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                    selected
                      ? "bg-white font-semibold text-black"
                      : "bg-white/8 text-white/65 hover:bg-white/15 hover:text-white",
                  )}
                >
                  {sound}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
