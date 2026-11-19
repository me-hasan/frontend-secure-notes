import { useState, type FormEvent } from "react";
import { api, messageOf } from "../api/client";
import type { UserEntity, UserRole } from "../api/types";
import { Pager } from "../components/Pager";
import {
  Button,
  Card,
  ErrorNote,
  Field,
  RoleBadge,
  Select,
  Skeleton,
} from "../components/ui";
import { usePaginated } from "../hooks/usePaginated";
import { formatDate } from "../lib/format";

interface Draft {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  interests: string;
}

const EMPTY_DRAFT: Draft = { name: "", email: "", password: "", role: "user", interests: "" };

const INTERESTS_HINT = "Comma separated — these are what group the person on the Interests tab.";

/** Comma-separated input → the array the API expects. */
function toInterests(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Admin user management — the Q3 list, plus create / update / delete. Deleting cascades the user's
 * notes and posts on the server, so it asks for confirmation before it happens.
 */
export function UsersScreen({
  onOpenPosts,
  onOpenNotes,
}: {
  onOpenPosts: (id: string) => void;
  onOpenNotes: (id: string) => void;
}) {
  const list = usePaginated((page, limit) => api.listUsers(page, limit));

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<(Draft & { id: string }) | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      await api.createUser({
        name: draft.name,
        email: draft.email,
        password: draft.password,
        role: draft.role,
        interests: toInterests(draft.interests),
      });
      setDraft(EMPTY_DRAFT);
    });
  }

  function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    void run(async () => {
      await api.updateUser(editing.id, {
        name: editing.name,
        email: editing.email,
        role: editing.role,
        interests: toInterests(editing.interests),
        // Blank means "leave the password alone" — the API only re-hashes what it is sent.
        ...(editing.password ? { password: editing.password } : {}),
      });
      setEditing(null);
    });
  }

  function startEditing(user: UserEntity) {
    setConfirmingId(null);
    setEditing({
      id: user._id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      interests: user.interests.join(", "),
    });
  }

  return (
    <Card
      title="Every account"
      subtitle="Admin only. Create, edit or remove accounts here — deleting one also deletes the notes and posts that belong to it."
    >
      <form onSubmit={create} className="space-y-2 border-t border-slate-100 pt-3">
        <p className="text-sm font-semibold text-slate-900">Add an account</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field
            label="Name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            required
          />
          <Field
            label="Email"
            type="email"
            value={draft.email}
            onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            hint="Must be unique — a second account with the same email is rejected."
            required
          />
          <Field
            label="Password"
            type="password"
            minLength={8}
            value={draft.password}
            onChange={(event) => setDraft({ ...draft, password: event.target.value })}
            hint="At least 8 characters. Stored as a bcrypt hash, never as plain text."
            required
          />
          <Select
            label="Role"
            value={draft.role}
            onChange={(event) => setDraft({ ...draft, role: event.target.value as UserRole })}
            hint="Admins get this screen and can read every note; users only see their own."
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </Select>
        </div>
        <Field
          label="Interests (comma separated)"
          value={draft.interests}
          onChange={(event) => setDraft({ ...draft, interests: event.target.value })}
          placeholder="chess, reading"
          hint={INTERESTS_HINT}
        />
        <Button type="submit" disabled={busy}>
          Create user
        </Button>
      </form>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 text-sm font-semibold text-slate-900">Accounts, newest first</p>
        <ErrorNote message={error ?? list.error} />

        {list.loading ? (
          <Skeleton label="Loading users…" />
        ) : list.items.length === 0 ? (
          <Skeleton label="No accounts found." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.items.map((user) =>
              editing?.id === user._id ? (
                <li key={user._id} className="py-3">
                  <form onSubmit={saveEdit} className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field
                        label="Name"
                        value={editing.name}
                        onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                        required
                      />
                      <Field
                        label="Email"
                        type="email"
                        value={editing.email}
                        onChange={(event) => setEditing({ ...editing, email: event.target.value })}
                        required
                      />
                      <Field
                        label="New password"
                        type="password"
                        minLength={8}
                        value={editing.password}
                        onChange={(event) => setEditing({ ...editing, password: event.target.value })}
                        hint="Leave blank to keep the current password."
                      />
                      <Select
                        label="Role"
                        value={editing.role}
                        onChange={(event) =>
                          setEditing({ ...editing, role: event.target.value as UserRole })
                        }
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </Select>
                    </div>
                    <Field
                      label="Interests (comma separated)"
                      value={editing.interests}
                      onChange={(event) => setEditing({ ...editing, interests: event.target.value })}
                      hint={INTERESTS_HINT}
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
                  key={user._id}
                  className="-mx-2 rounded-xl px-2 py-3 transition duration-150 hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {user.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-semibold text-slate-900">
                        {user.name}
                        <RoleBadge role={user.role} />
                      </p>
                      <p className="text-sm text-slate-600">{user.email}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        joined {formatDate(user.createdAt)}
                        {user.interests.length > 0
                          ? ` · interests: ${user.interests.join(", ")}`
                          : " · no interests listed"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => onOpenNotes(user._id)}>
                        View notes
                      </Button>
                      <Button variant="secondary" onClick={() => onOpenPosts(user._id)}>
                        View posts
                      </Button>
                      <Button variant="secondary" onClick={() => startEditing(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() => setConfirmingId(user._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {confirmingId === user._id && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                      <span>
                        Delete {user.name}? Their notes and posts are deleted with the account, and
                        this cannot be undone.
                      </span>
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await api.deleteUser(user._id);
                            setConfirmingId(null);
                          })
                        }
                      >
                        Yes, delete
                      </Button>
                      <Button variant="secondary" onClick={() => setConfirmingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
        )}

        <Pager meta={list.meta} unit="accounts" onPage={list.setPage} onLimit={list.setLimit} />
      </div>
    </Card>
  );
}
