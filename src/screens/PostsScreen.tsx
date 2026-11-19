import { useEffect, useState, type FormEvent } from "react";
import { api, messageOf } from "../api/client";
import type { UserWithPosts } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Pager } from "../components/Pager";
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Skeleton,
  TextArea,
} from "../components/ui";
import { usePaginated } from "../hooks/usePaginated";
import { formatDate } from "../lib/format";

/**
 * Posts: the public feed (visible to everyone, no token) plus Aggregation Scenario 2 — one user with
 * their posts joined in by a single `$lookup` pipeline.
 *
 * Both props are optional so the signed-out screen can render this component unchanged.
 */
export function PostsScreen({
  lookupUserId = "",
  onLookupUserIdChange,
}: {
  lookupUserId?: string;
  onLookupUserIdChange?: (id: string) => void;
}) {
  const { user } = useAuth();
  const feed = usePaginated((page, limit) => api.listPosts(page, limit));

  const [draft, setDraft] = useState({ title: "", body: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [lookupInput, setLookupInput] = useState(lookupUserId);
  const [lookupId, setLookupId] = useState(lookupUserId);
  const [joined, setJoined] = useState<UserWithPosts | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // The Users screen hands us an id, which should load immediately rather than wait for a click.
  useEffect(() => {
    setLookupInput(lookupUserId);
    setLookupId(lookupUserId);
  }, [lookupUserId]);

  useEffect(() => {
    if (!lookupId) {
      setJoined(null);
      setLookupError(null);
      return;
    }

    let cancelled = false;
    setLookupError(null);

    api
      .userPosts(lookupId)
      .then((result) => {
        if (!cancelled) setJoined(result);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setJoined(null);
        setLookupError(messageOf(cause));
      });

    return () => {
      cancelled = true;
    };
  }, [lookupId]);

  function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    api
      .createPost({ title: draft.title, body: draft.body })
      .then(() => {
        setDraft({ title: "", body: "" });
        feed.reload();
      })
      .catch((cause: unknown) => setError(messageOf(cause)))
      .finally(() => setBusy(false));
  }

  function loadPosts(event: FormEvent) {
    event.preventDefault();
    const id = lookupInput.trim();
    onLookupUserIdChange?.(id);
    setLookupId(id);
  }

  return (
    <div className="space-y-4">
      {user && (
        <Card
          title="Write a post"
          subtitle="Posts are public: everyone can read them, including people who are not signed in."
        >
          <form onSubmit={create} className="space-y-2">
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
            <ErrorNote message={error} />
            <Button type="submit" disabled={busy}>
              Publish
            </Button>
            <p className="text-xs text-slate-500">
              Your name is attached automatically — you cannot post as somebody else.
            </p>
          </form>
        </Card>
      )}

      <Card
        title="Public feed"
        subtitle="The newest posts from everyone on the platform. No account needed to read it."
      >
        <div className="mt-1">
          {feed.loading ? (
            <Skeleton label="Loading posts…" />
          ) : feed.items.length === 0 ? (
            <Skeleton label="Nobody has published a post yet." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {feed.items.map((post) => (
                <li
                  key={post._id}
                  className="-mx-2 rounded-xl px-2 py-3 transition duration-150 hover:bg-slate-50"
                >
                  <p className="font-semibold text-slate-900">{post.title}</p>
                  {post.body && <p className="text-sm text-slate-600">{post.body}</p>}
                  <p className="tabular mt-1 text-xs text-slate-400">{formatDate(post.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
          <ErrorNote message={feed.error} />
          <Pager meta={feed.meta} unit="posts" onPage={feed.setPage} onLimit={feed.setLimit} />
        </div>
      </Card>

      <Card
        title="One person's posts"
        subtitle="A public profile view: a single person and everything they have published."
      >
        {/* The tip sits below the row so the button aligns with the input, not with the hint. */}
        <form onSubmit={loadPosts} className="flex flex-wrap items-end gap-2">
          <Field
            label="Person"
            value={lookupInput}
            onChange={(event) => setLookupInput(event.target.value)}
            placeholder="user id (24 characters)"
            className="w-80"
          />
          <Button type="submit" variant="secondary">
            Load
          </Button>
        </form>
        <p className="mb-3 mt-1.5 text-xs text-slate-500">
          Tip: on the Users tab, press Posts on a row to load that person here.
        </p>

        <ErrorNote message={lookupError} />

        {joined && (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-semibold text-white">
                {joined.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{joined.name}</p>
                <p className="truncate text-xs text-slate-500">{joined.email}</p>
              </div>
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {joined.posts.length} {joined.posts.length === 1 ? "post" : "posts"}
              </span>
            </div>

            <div className="px-4 py-3">
              <p className="text-xs text-slate-500">
                {joined.interests.length > 0
                  ? `Interests: ${joined.interests.join(", ")}`
                  : "No interests listed"}
              </p>

              {joined.posts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  This person has not published anything yet.
                </p>
              ) : (
                <ul className="mt-1 divide-y divide-slate-200/70">
                  {joined.posts.map((post) => (
                    <li key={post._id} className="py-2.5">
                      <p className="text-sm font-semibold text-slate-900">{post.title}</p>
                      {post.body && <p className="text-sm text-slate-600">{post.body}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
