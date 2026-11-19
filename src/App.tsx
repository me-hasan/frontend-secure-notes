import { useState } from "react";
import type { UserRole } from "./api/types";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Bullets, BrandMark, Button, Callout, RoleBadge } from "./components/ui";
import { AuthScreen } from "./screens/AuthScreen";
import { InterestsScreen } from "./screens/InterestsScreen";
import { NotesScreen } from "./screens/NotesScreen";
import { PostsScreen } from "./screens/PostsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { UsersScreen } from "./screens/UsersScreen";

type View = "notes" | "posts" | "interests" | "users" | "profile";

/**
 * The product rules for the signed-in role, written where they are visible. This is the fastest way
 * to understand the business: what a user may do, and what only an admin may do.
 */
const ROLE_GUIDE: Record<UserRole, { tone: "info" | "warn"; title: string; points: string[] }> = {
  user: {
    tone: "info",
    title: "You are signed in as a user",
    points: [
      "Notes are private — you only ever see and edit your own.",
      "Posts are public — everyone can read them, even people without an account.",
      "Anyone can browse the post feed and the interest groups; no sign-in needed.",
      "Admin tools (managing accounts, reading everyone's notes) are hidden from this account.",
    ],
  },
  admin: {
    tone: "warn",
    title: "You are signed in as an admin",
    points: [
      "You can do everything a normal user can, plus the admin tools below.",
      "Users — create, edit, delete and page through every account.",
      "Notes — read everyone's notes, and narrow the list down to one owner.",
      "Deleting an account also deletes the notes and posts that belong to it.",
    ],
  },
};

export function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

function Shell() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>("notes");

  /**
   * Cross-screen hand-off. The admin Users screen can point the notes list at one owner, or open a
   * user's `$lookup` posts — which is what makes the admin role differences visible in the UI.
   */
  const [notesOwner, setNotesOwner] = useState("");
  const [lookupUserId, setLookupUserId] = useState("");

  if (!user) {
    return <AuthScreen />;
  }

  const tabs: { id: View; label: string; adminOnly?: boolean }[] = [
    { id: "notes", label: "Notes" },
    { id: "posts", label: "Posts" },
    { id: "interests", label: "Interests" },
    ...(user.role === "admin" ? [{ id: "users" as View, label: "Users", adminOnly: true }] : []),
    { id: "profile", label: "Profile" },
  ];

  const guide = ROLE_GUIDE[user.role];

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 pb-12 pt-6">
      <header className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm shadow-slate-900/5 backdrop-blur sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">Secure Notes</h1>
              <p className="text-xs text-slate-500">
                Private notes, public posts, and admins who manage the accounts.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <RoleBadge role={user.role} />
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <Callout tone={guide.tone} title={guide.title} className="text-xs">
        <Bullets items={guide.points} />
      </Callout>

      <nav className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm shadow-slate-900/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-150 ${
              view === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {tab.label}
            {tab.adminOnly && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  view === tab.id ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                admin
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="space-y-4">
        {view === "notes" && <NotesScreen owner={notesOwner} onOwnerChange={setNotesOwner} />}
        {view === "posts" && (
          <PostsScreen lookupUserId={lookupUserId} onLookupUserIdChange={setLookupUserId} />
        )}
        {view === "interests" && <InterestsScreen />}
        {view === "users" && (
          <UsersScreen
            onOpenPosts={(id) => {
              setLookupUserId(id);
              setView("posts");
            }}
            onOpenNotes={(id) => {
              setNotesOwner(id);
              setView("notes");
            }}
          />
        )}
        {view === "profile" && <ProfileScreen />}
      </main>
    </div>
  );
}
