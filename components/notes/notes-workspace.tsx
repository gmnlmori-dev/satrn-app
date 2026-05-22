"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOpenCreateNote } from "@/components/app/create-note-context";
import { listNoteSharingOptions } from "@/lib/actions/list-note-sharing-options";
import { reorderTeamNotes } from "@/lib/actions/reorder-team-notes";
import { NotesGrid } from "@/components/notes/notes-grid";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import {
  filterNotesBySearch,
  filterNotesByTab,
  reorderUserNotesInPinGroup,
  sortNotesForGrid,
} from "@/lib/team-note-access";
import { uiBtnSecondary, uiControl } from "@/lib/ui-classes";
import { uiPageLead, uiPageTitle } from "@/lib/typography";
import type { NotesTabFilter, TeamNote } from "@/types/note";
import type { AssigneeOption } from "@/types/profile";

type NotesWorkspaceProps = {
  notes: TeamNote[];
  currentUserId: string;
  teamId?: string;
};

export function NotesWorkspace({
  notes: initialNotes,
  currentUserId,
  teamId = "",
}: NotesWorkspaceProps) {
  const openNewNote = useOpenCreateNote();
  const [notes, setNotes] = useState(initialNotes);
  const [tab, setTab] = useState<NotesTabFilter>("mine");
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composingNoteId, setComposingNoteId] = useState<string | null>(null);
  const [sharingOptions, setSharingOptions] = useState<AssigneeOption[]>([]);

  useEffect(() => {
    if (composerOpen) return;
    setNotes(initialNotes);
  }, [initialNotes, composerOpen]);

  useEffect(() => {
    let cancelled = false;
    listNoteSharingOptions().then((result) => {
      if (!cancelled && result.ok) setSharingOptions(result.options);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const byTab = filterNotesByTab(notes, tab, currentUserId);
    const bySearch = filterNotesBySearch(byTab, search);
    return sortNotesForGrid(bySearch);
  }, [notes, tab, currentUserId, search]);

  const gridNotes = useMemo(() => {
    if (!composerOpen || !composingNoteId) return filtered;
    return filtered.filter((n) => n.id !== composingNoteId);
  }, [filtered, composerOpen, composingNoteId]);

  const handleDraftCreated = useCallback((note: TeamNote) => {
    setNotes((prev) => {
      const minSort = prev
        .filter(
          (n) =>
            n.createdByUserId === currentUserId &&
            !n.isPinned &&
            !n.isArchived,
        )
        .reduce((min, n) => Math.min(min, n.sortOrder), 0);
      const withSort = { ...note, sortOrder: minSort - 1 };
      if (prev.some((n) => n.id === withSort.id)) {
        return prev.map((n) => (n.id === withSort.id ? withSort : n));
      }
      return [withSort, ...prev];
    });
    setComposingNoteId(note.id);
  }, [currentUserId]);

  const handleNoteUpdated = useCallback((note: TeamNote) => {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
  }, []);

  const handleCollapseComposer = useCallback(() => {
    setComposerOpen(false);
    setComposingNoteId(null);
  }, []);

  const handleOpenComposer = useCallback(() => {
    setComposingNoteId(null);
    setComposerOpen(true);
  }, []);

  const handleNoteDeleted = useCallback((noteId: string) => {
    if (composingNoteId === noteId) {
      setComposerOpen(false);
      setComposingNoteId(null);
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, [composingNoteId]);

  const handleNoteArchived = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, isArchived: true, isPinned: false } : n,
      ),
    );
  }, []);

  const handleReorder = useCallback(
    async (draggedId: string, targetId: string, insertBefore: boolean) => {
      const previous = notes;
      const next = reorderUserNotesInPinGroup(
        notes,
        currentUserId,
        draggedId,
        targetId,
        insertBefore,
      );
      if (!next) return;

      setNotes(next);

      const dragged = next.find((n) => n.id === draggedId);
      if (!dragged) return;

      const orderedIds = next
        .filter(
          (n) =>
            n.createdByUserId === currentUserId &&
            n.isPinned === dragged.isPinned &&
            n.isArchived === dragged.isArchived,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((n) => n.id);

      const result = await reorderTeamNotes(orderedIds, dragged.isPinned);
      if (!result.ok) {
        setNotes(previous);
      }
    },
    [notes, currentUserId],
  );

  const reorderEnabled = search.trim().length === 0;
  const showGrid = tab === "mine" || filtered.length > 0 || composerOpen;

  return (
    <div className="space-y-6 md:space-y-7">
      <header className="min-w-0">
        <h1 className={uiPageTitle}>Note</h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Clicca una card per aprirla e scrivere: le modifiche si salvano da
          sole. Usa «Prendi una nota…» per crearne una nuova, trascina una card
          chiusa per riordinarla e, passando sopra con il mouse, il menu
          azioni per pin, colore, condivisione e archiviazione.
        </p>
      </header>

      <Panel padding className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl
            ariaLabel="Filtro note"
            value={tab}
            onChange={setTab}
            options={[
              { value: "mine", label: "Le mie" },
              { value: "shared_with_me", label: "Condivise" },
              { value: "team", label: "Team" },
              { value: "archived", label: "Archivio" },
            ]}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nelle note…"
            className={cn(uiControl, "w-full py-2 text-sm sm:max-w-xs")}
            aria-label="Cerca nelle note"
          />
        </div>
      </Panel>

      {filtered.length === 0 && !showGrid && !composerOpen ? (
        <AppEmptyState
          title="Nessuna nota"
          description={
            tab === "archived"
              ? "Non ci sono note archiviate."
              : "Crea la prima nota dal menu Crea."
          }
          icon="none"
        >
          <button
            type="button"
            className={uiBtnSecondary}
            onClick={openNewNote}
          >
            Nuova nota
          </button>
        </AppEmptyState>
      ) : showGrid ? (
        <NotesGrid
          notes={gridNotes}
          currentUserId={currentUserId}
          teamId={teamId}
          sharingOptions={sharingOptions}
          draftOpen={composerOpen && tab === "mine"}
          composerTriggerOpen={!composerOpen && tab === "mine"}
          onOpenComposer={handleOpenComposer}
          reorderEnabled={reorderEnabled}
          onDraftCreated={handleDraftCreated}
          onNoteUpdated={handleNoteUpdated}
          onNoteArchived={handleNoteArchived}
          onNoteDeleted={handleNoteDeleted}
          onCollapseDraft={handleCollapseComposer}
          onReorder={handleReorder}
        />
      ) : null}
    </div>
  );
}
