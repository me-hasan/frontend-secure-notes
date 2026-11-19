import { useEffect, useState, type FormEvent } from "react";
import { api, messageOf } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Pager } from "../components/Pager";
import { Button, Card, ErrorNote, Field, Skeleton, TextArea } from "../components/ui";
import { usePaginated } from "../hooks/usePaginated";
import { formatDate, shortId } from "../lib/format";

/**
 * Notes CRUD. A regular user only ever sees their own rows (Q5); an admin sees every note and can
 * narrow the list to one owner (Q6 + the `?owner=` filter).
 */
export function NotesScreen({
  owner,
  onOwnerChange,
}: {
  owner: string;
  onOwnerChange: (owner: string) => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const list = usePaginated(
    (page, limit) => api.listNotes(page, limit, owner || undefined),
    [owner],
  );

  const [ownerInput, setOwnerInput] = useState(owner);
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [editing, setEditing] = useState<{ id: string; title: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The Users screen can hand us an owner id from the outside.
  useEffect(() => setOwnerInput(owner), [owner]);

  async function run(action: () => Promise<unknown>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await action();
      list.reload();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  function create(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await api.createNote({ title: draft.title, body: draft.body });
      setDraft({ title: "", body: "" });
    });
  }

  function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    void run(async () => {
      await api.updateNote(editing.id, { title: editing.title, body: editing.body });
      setEditing(null);
    });
  }

  function applyOwner(event: FormEvent) {
    event.preventDefault();
    onOwnerChange(ownerInput.trim());
    list.setPage(1);
  }

  return (
    <Card
      title={isAdmin ? "Every note in the system" : "My notes"}
      subtitle={
        isAdmin
          ? "Notes belong to one person and stay private to them — you can read all of them because you are an admin."
          : "These are yours alone. Nobody else can read, edit or delete them."
      }
    >
      {isAdmin && (
        <div className="border-t border-slate-100 pt-3">
          {/* The tip sits outside the row: inside it, the field would be one line taller than the
              buttons and `items-end` would drop them below the input. */}
          <form onSubmit={applyOwner} className="flex flex-wrap items-end gap-2">
            <Field
              label="Show only one person's notes"
              value={ownerInput}
              onChange={(event) => setOwnerInput(event.target.value)}
              placeholder="user id (24 characters)"
              className="w-80"
            />
            <Button type="submit" variant="secondary">
              Apply
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setOwnerInput("");
                onOwnerChange("");
                list.setPage(1);
              }}
            >
              Clear
            </Button>
          </form>
          <p className="mt-1.5 text-xs text-slate-500">
            Tip: open the Users tab and press Notes on a row to jump straight here.
          </p>
        </div>
      )}

      {isAdmin && owner && (
        <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-600">
          Filtered to notes owned by {shortId(owner)} — clear the filter to go back to every note.
        </p>
      )}

      <form onSubmit={create} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-900">
          {isAdmin ? "Write a note for yourself" : "Write a new note"}
        </p>
        <Field
          label="Title"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          required
        />
        <TextArea
          label="Body"
          value={draft.body}
          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
        />
        <Button type="submit" disabled={busy}>
          Create note
        </Button>
      </form>

      <div className="mt-4">
        <ErrorNote message={error ?? list.error} />

        {list.loading ? (
          <Skeleton label="Loading notes…" />
        ) : list.items.length === 0 ? (
          <Skeleton
            label={
              isAdmin && owner
                ? "This person has not written any notes yet."
                : isAdmin
                  ? "No notes exist yet. The list is empty for every owner."
                  : "You have not written any notes yet — create your first one above."
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.items.map((note) =>
              editing?.id === note._id ? (
                <li key={note._id} className="py-3">
                  <form onSubmit={saveEdit} className="space-y-3 rounded-xl bg-slate-50/80 p-3">
                    <Field
                      label="Title"
                      value={editing.title}
                      onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                      required
                    />
                    <TextArea
                      label="Body"
                      value={editing.body}
                      onChange={(event) => setEditing({ ...editing, body: event.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={busy}>
                        Save
                      </Button>
                      <Button variant="secondary" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </li>
              ) : (
                <li
                  key={note._id}
                  className="-mx-2 flex flex-wrap items-start gap-3 rounded-xl px-2 py-3 transition duration-150 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{note.title}</p>
                    {note.body && <p className="text-sm text-slate-600">{note.body}</p>}
                    <p className="tabular mt-1 text-xs text-slate-400">
                      {formatDate(note.updatedAt)}
                      {isAdmin && ` · owned by ${shortId(note.owner)}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setEditing({ id: note._id, title: note.title, body: note.body })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      disabled={busy}
                      onClick={() => void run(() => api.deleteNote(note._id))}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        <Pager
          meta={list.meta}
          unit={isAdmin && owner ? "notes for this owner" : "notes"}
          onPage={list.setPage}
          onLimit={list.setLimit}
        />
      </div>
    </Card>
  );
}
