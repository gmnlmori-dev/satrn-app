"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useExclusiveAppSlide } from "@/components/app/app-slide-coordinator";
import { listNoteSharingOptions } from "@/lib/actions/list-note-sharing-options";
import { NotesGrid } from "@/components/notes/notes-grid";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import {
  filterNotesBySearch,
  filterNotesByTab,
  sortNotesForGrid,
} from "@/lib/team-note-access";
import { uiBtnSecondary, uiControl, uiTransition } from "@/lib/ui-classes";
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
  const newNoteSlide = useExclusiveAppSlide("new-note");
  const [notes, setNotes] = useState(initialNotes);
  const [tab, setTab] = useState<NotesTabFilter>("mine");
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [sharingOptions, setSharingOptions] = useState<AssigneeOption[]>([]);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

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

  const handleDraftCreated = useCallback((note: TeamNote) => {
    setNotes((prev) => [note, ...prev]);
    setComposerOpen(false);
  }, []);

  const handleNoteUpdated = useCallback((note: TeamNote) => {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
  }, []);

  const handleNoteArchived = useCallback((noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, isArchived: true, isPinned: false } : n,
      ),
    );
  }, []);

  return (
    <div className="space-y-6 md:space-y-7">
      <header className="min-w-0">
        <h1 className={uiPageTitle}>Note</h1>
        <p className={cn(uiPageLead, "mt-1.5 max-w-2xl")}>
          Blocchi rapidi stile Keep: scrivi direttamente sulle card con
          autosalvataggio, oppure crea una nota dal menu Crea con salvataggio
          esplicito.
        </p>
      </header>

      <Panel padding className="space-y-3">
        {!composerOpen ? (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className={cn(
              uiControl,
              uiTransition,
              "w-full py-3 text-left text-sm text-fg-tertiary shadow-sm hover:shadow-md",
            )}
          >
            Prendi una nota…
          </button>
        ) : null}

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

      {filtered.length === 0 && !composerOpen ? (
        <AppEmptyState
          title="Nessuna nota"
          description={
            tab === "archived"
              ? "Non ci sono note archiviate."
              : "Crea la prima nota con il composer in alto o dal menu Crea."
          }
          icon="none"
        >
          <button
              type="button"
              className={uiBtnSecondary}
              onClick={newNoteSlide.openSlide}
            >
              Nuova nota
            </button>
        </AppEmptyState>
      ) : (
        <NotesGrid
          notes={filtered}
          currentUserId={currentUserId}
          teamId={teamId}
          sharingOptions={sharingOptions}
          draftOpen={composerOpen && tab === "mine"}
          onDraftCreated={handleDraftCreated}
          onNoteUpdated={handleNoteUpdated}
          onNoteArchived={handleNoteArchived}
          onCollapseDraft={() => setComposerOpen(false)}
        />
      )}
    </div>
  );
}
