"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  CLASS_TYPES,
  CLASS_TYPE_DEFAULTS,
  COURTS,
  DURATIONS,
} from "@/lib/classes";
import { LEVEL_MAX, LEVEL_MIN, LEVEL_STEP, formatLevel } from "@/lib/level";
import { strings } from "@/lib/strings";
import { supabase } from "@/lib/supabase";
import { clubFormParts, clubLocalToUtc, formatDuration } from "@/lib/time";
import type { ClassType } from "@/lib/types";

const LEVELS = Array.from(
  { length: Math.round((LEVEL_MAX - LEVEL_MIN) / LEVEL_STEP) + 1 },
  (_, i) => LEVEL_MIN + i * LEVEL_STEP,
);

export default function NewClassPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const defaults = clubFormParts();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ClassType>("group");
  const [court, setCourt] = useState<string>(COURTS[0]);
  const [day, setDay] = useState(defaults.day);
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(CLASS_TYPE_DEFAULTS.group.capacity);
  const [price, setPrice] = useState(CLASS_TYPE_DEFAULTS.group.price);
  const [levelMin, setLevelMin] = useState(2);
  const [levelMax, setLevelMax] = useState(4);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && user.role !== "coach") {
    router.replace("/classes");
    return null;
  }

  /** Changing the type re-fills capacity and price; both stay editable after. */
  function onTypeChange(next: ClassType) {
    setType(next);
    setCapacity(CLASS_TYPE_DEFAULTS[next].capacity);
    setPrice(CLASS_TYPE_DEFAULTS[next].price);
  }

  async function onCreate() {
    if (!user) return;
    if (!title.trim()) {
      setError(strings.newClass.failed);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("class_session").insert({
        coach_id: user.id,
        title: title.trim(),
        type,
        level_min: Math.min(levelMin, levelMax),
        level_max: Math.max(levelMin, levelMax),
        starts_at: clubLocalToUtc(day, time),
        duration_min: duration,
        court,
        capacity,
        price,
        notes: notes.trim() || null,
      });
      if (insertError) throw insertError;
      await queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      router.replace("/classes");
    } catch {
      setError(strings.newClass.failed);
      setSaving(false);
    }
  }

  return (
    <div className="pt-10 pb-4">
      <Link
        href="/classes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {strings.nav.classes}
      </Link>

      <h1 className="headline mt-6 text-3xl">{strings.newClass.title}</h1>

      <div className="mt-6 flex flex-col gap-5">
        <Field label={strings.newClass.classTitle}>
          <input
            type="text"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={strings.newClass.titlePlaceholder}
            className={inputClass}
          />
        </Field>

        <Field label={strings.newClass.type}>
          <select
            value={type}
            onChange={(event) => onTypeChange(event.target.value as ClassType)}
            className={inputClass}
          >
            {CLASS_TYPES.map((option) => (
              <option key={option} value={option}>
                {strings.newClass.types[option]}
              </option>
            ))}
          </select>
        </Field>

        <Field label={strings.newClass.court}>
          <select
            value={court}
            onChange={(event) => setCourt(event.target.value)}
            className={inputClass}
          >
            {COURTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={strings.newClass.date}>
            <input
              type="date"
              required
              value={day}
              onChange={(event) => setDay(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={strings.newClass.time}>
            <input
              type="time"
              required
              step={300}
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={strings.newClass.duration}>
          <select
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className={inputClass}
          >
            {DURATIONS.map((option) => (
              <option key={option} value={option}>
                {formatDuration(option)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={strings.newClass.capacity}>
            <input
              type="number"
              min={1}
              max={20}
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label={strings.newClass.price}>
            <input
              type="number"
              min={0}
              step={5}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label={strings.newClass.levelRange}>
          <div className="flex items-center gap-3">
            <select
              value={levelMin}
              onChange={(event) => setLevelMin(Number(event.target.value))}
              className={inputClass}
            >
              {LEVELS.map((value) => (
                <option key={value} value={value}>
                  {formatLevel(value)}
                </option>
              ))}
            </select>
            <span className="numeric text-muted-foreground">–</span>
            <select
              value={levelMax}
              onChange={(event) => setLevelMax(Number(event.target.value))}
              className={inputClass}
            >
              {LEVELS.map((value) => (
                <option key={value} value={value}>
                  {formatLevel(value)}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label={strings.newClass.notes}>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={strings.newClass.notesPlaceholder}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <Button
        size="xl"
        className="mt-8 w-full"
        disabled={saving || title.trim().length === 0}
        onClick={onCreate}
      >
        {saving ? strings.newClass.creating : strings.newClass.create}
      </Button>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-input bg-card px-4 py-3 text-[15px] outline-none focus-visible:border-ring";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
