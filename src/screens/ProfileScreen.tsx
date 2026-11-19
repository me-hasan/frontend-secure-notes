import { useEffect, useState } from "react";
import { api, messageOf } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button, Callout, Card, ErrorNote, RoleBadge, Skeleton } from "../components/ui";
import { formatDate } from "../lib/format";

/** `GET /users/me` — the profile the JWT resolves to. Never carries `passwordHash`. */
export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.me>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(messageOf(cause));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card
      title="Your account"
      subtitle="What the server knows about you — the profile your signed-in token resolves to."
      actions={
        <Button variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      }
    >
      <div>
        <ErrorNote message={error} />

        {profile === null ? (
          <Skeleton label="Loading profile…" />
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-lg font-semibold text-white">
                {profile.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{profile.name}</p>
                <p className="truncate text-sm text-slate-600">{profile.email}</p>
              </div>
              <span className="ml-auto">
                <RoleBadge role={profile.role} />
              </span>
            </div>

            <dl className="mt-3 grid gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {profile.role === "admin" ? "Administrator" : "Standard user"}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Interests
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {profile.interests.length > 0 ? profile.interests.join(", ") : "None listed"}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Joined</dt>
                <dd className="tabular mt-1 text-sm text-slate-900">
                  {formatDate(profile.createdAt)}
                </dd>
              </div>
            </dl>

            <p className="mt-2 text-xs text-slate-500">Signed in as {user?.email}</p>

            <Callout tone={profile.role === "admin" ? "warn" : "info"} className="mt-4 text-xs">
              {profile.role === "admin"
                ? "Your role is what unlocks the Users tab outside this page, and gives you read access to everybody's notes."
                : "Your role is what keeps the admin tools hidden: you can only ever read and edit your own notes."}
              {profile.interests.length > 0 &&
                " Your interests are what put you in the groups on the Interests tab."}
            </Callout>
          </>
        )}
      </div>
    </Card>
  );
}
