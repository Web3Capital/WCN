/**
 * Notes UI module — same layering idea as `/dashboard/projects`: route pages stay thin;
 * feature types + components live under `notes/` (co-located domain slice).
 */

export type { NoteFeedItem, NoteSectionVariant, CapitalNoteFeedItem } from "./types";

export { NoteReadonlyInset } from "./components/note-readonly-inset";
export { NoteFeed } from "./components/note-feed";
export { NoteComposerRow } from "./components/note-composer-row";
export { NoteSectionCard } from "./components/note-section-card";
export { InternalNoteField } from "./components/internal-note-field";

/** Legacy names — prefer `Note*` in new code. */
export { NoteReadonlyInset as CapitalNotesReadonlyInset } from "./components/note-readonly-inset";
export { NoteFeed as CapitalNotesFeed } from "./components/note-feed";
export { NoteComposerRow as CapitalNotesComposerRow } from "./components/note-composer-row";
