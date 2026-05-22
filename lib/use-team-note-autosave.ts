"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTeamNote } from "@/lib/actions/create-team-note";
import { updateTeamNote } from "@/lib/actions/update-team-note";
import { titleFromBody } from "@/lib/team-note-access";
import type { NoteColor, NoteVisibility } from "@/types/note";

export type TeamNoteAutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 500;
const SAVED_RESET_MS = 2000;

export function useTeamNoteAutosave({
  noteId: initialNoteId,
  initialTitle = "",
  initialBody = "",
  visibility = "private",
  sharedUserIds = [],
  color = null,
  enabled = true,
  onCreated,
}: {
  noteId: string | null;
  initialTitle?: string;
  initialBody?: string;
  visibility?: NoteVisibility;
  sharedUserIds?: string[];
  color?: NoteColor | null;
  enabled?: boolean;
  onCreated?: (
    id: string,
    payload: {
      title: string;
      body: string;
      visibility: NoteVisibility;
      sharedUserIds: string[];
      color: NoteColor | null;
    },
  ) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [status, setStatus] = useState<TeamNoteAutosaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const noteIdRef = useRef<string | null>(initialNoteId);
  const syncedNoteIdRef = useRef<string | null>(initialNoteId);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const visibilityRef = useRef(visibility);
  const sharedUserIdsRef = useRef(sharedUserIds);
  const colorRef = useRef(color);

  useEffect(() => {
    visibilityRef.current = visibility;
  }, [visibility]);

  useEffect(() => {
    sharedUserIdsRef.current = sharedUserIds;
  }, [sharedUserIds]);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    if (initialNoteId === syncedNoteIdRef.current) {
      return;
    }
    if (
      initialNoteId !== null &&
      noteIdRef.current === initialNoteId
    ) {
      syncedNoteIdRef.current = initialNoteId;
      return;
    }
    syncedNoteIdRef.current = initialNoteId;
    noteIdRef.current = initialNoteId;
    setTitle(initialTitle);
    setBody(initialBody);
    setStatus("idle");
    setErrorMessage(null);
  }, [initialNoteId, initialTitle, initialBody]);

  const clearTimers = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (savedResetRef.current) {
      clearTimeout(savedResetRef.current);
      savedResetRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const performSave = useCallback(async () => {
    if (!enabled) return;

    const effectiveTitle = titleFromBody(body, title);
    const trimmedBody = body.trim();
    const trimmedTitle = title.trim();

    if (!noteIdRef.current) {
      if (!trimmedBody) {
        setStatus("idle");
        return;
      }
    } else if (!trimmedBody && !trimmedTitle) {
      setStatus("idle");
      return;
    }

    if (savingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    savingRef.current = true;
    setStatus("saving");
    setErrorMessage(null);

    try {
      if (!noteIdRef.current) {
        const currentVisibility = visibilityRef.current;
        const currentShared = sharedUserIdsRef.current;
        const currentColor = colorRef.current;
        if (currentVisibility === "shared" && currentShared.length === 0) {
          setStatus("idle");
          return;
        }
        const fd = new FormData();
        fd.set("title", effectiveTitle);
        fd.set("body", body);
        fd.set("visibility", currentVisibility);
        fd.set("sharedUserIds", JSON.stringify(currentShared));
        if (currentColor && currentColor !== "default") {
          fd.set("color", currentColor);
        }
        const result = await createTeamNote(fd);
        if (!result.ok) {
          setStatus("error");
          setErrorMessage(result.message);
          return;
        }
        noteIdRef.current = result.id;
        syncedNoteIdRef.current = result.id;
        onCreated?.(result.id, {
          title: effectiveTitle,
          body,
          visibility: currentVisibility,
          sharedUserIds: currentShared,
          color:
            currentColor && currentColor !== "default" ? currentColor : null,
        });
      } else {
        const result = await updateTeamNote(noteIdRef.current, {
          title: effectiveTitle,
          body,
        });
        if (!result.ok) {
          setStatus("error");
          setErrorMessage(result.message);
          return;
        }
      }

      setStatus("saved");
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
      savedResetRef.current = setTimeout(() => {
        setStatus("idle");
      }, SAVED_RESET_MS);
    } finally {
      savingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void performSave();
      }
    }
  }, [body, title, enabled, onCreated]);

  const scheduleSave = useCallback(() => {
    if (!enabled) return;
    clearTimers();
    debounceRef.current = setTimeout(() => {
      void performSave();
    }, DEBOUNCE_MS);
  }, [clearTimers, enabled, performSave]);

  const setTitleAndSchedule = useCallback(
    (value: string) => {
      setTitle(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const setBodyAndSchedule = useCallback(
    (value: string) => {
      setBody(value);
      scheduleSave();
    },
    [scheduleSave],
  );

  const flushSave = useCallback(() => {
    clearTimers();
    void performSave();
  }, [clearTimers, performSave]);

  return {
    title,
    body,
    setTitle: setTitleAndSchedule,
    setBody: setBodyAndSchedule,
    status,
    errorMessage,
    noteId: noteIdRef.current,
    flushSave,
  };
}
