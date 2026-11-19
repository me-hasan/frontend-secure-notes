import { useState, type FormEvent } from "react";
import { api, messageOf } from "../api/client";
import type { UserRole } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import {
  BrandMark,
  Bullets,
  Button,
  Callout,
  Card,
  ErrorNote,
  Field,
  RoleBadge,
} from "../components/ui";
import { PostsScreen } from "./PostsScreen";

type Mode = "login" | "register" | "feed";

const MODE_LABELS: Record<Mode, string> = {
  login: "Sign in",
  register: "Register",
  feed: "Browse public feed",
};

/** Created by `pnpm run seed` — the same credentials the backend README documents. */
const DEMO_PASSWORD = "Password123!";
const DEMO_ACCOUNTS: { role: UserRole; email: string; note: string }[] = [
  { role: "admin", email: "admin@example.com", note: "every account and every note" },
  { role: "user", email: "user01@example.com", note: "their own notes only" },
];

const WHAT_THIS_IS = [
  <><strong>Notes</strong> are private — each person keeps their own, and only you can read yours.</>,
  <><strong>Posts</strong> are public — everyone can read them, even people without an account.</>,
  <><strong>Interests</strong> are listed on a profile, so people with the same ones can find each other.</>,
  <><strong>Admins</strong> manage the accounts and can read everyone's notes.</>,
];

/** Signed-out surface: what the product is, credentials, plus the two public endpoints. */
export function AuthScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  /** One click instead of typing a password — the fastest path to seeing the roles. */
  function useDemo(demoEmail: string) {
    setMode("login");
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result =
        mode === "register"
          ? await api.register({ name, email, password })
          : await api.login({ email, password });
      signIn(result);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-5 px-4 py-10">
      <div className="text-center">
        <BrandMark className="mx-auto h-12 w-12" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Secure Notes</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
          Private notes, public posts, and role-based access — with the API behind it running live.
        </p>
      </div>

      <Card>
        <Callout title="What you can do here">
          <Bullets items={WHAT_THIS_IS} />
        </Callout>

        <nav className="mt-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {(Object.keys(MODE_LABELS) as Mode[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => switchMode(id)}
              className={`flex-1 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-150 ${
                mode === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {MODE_LABELS[id]}
            </button>
          ))}
        </nav>

        <div className="mt-4">
          {mode === "feed" ? (
            <Callout tone="good" title="No account needed">
              The post feed and the posts of a single user are public by design — they load with no
              token at all, which is exactly why this view works before you sign in.
            </Callout>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <form onSubmit={submit} className="space-y-3">
                {mode === "register" && (
                  <Field
                    label="Name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                )}
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <Field
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={mode === "register" ? 8 : undefined}
                  hint={mode === "register" ? "At least 8 characters." : undefined}
                  required
                />
                <ErrorNote message={error} />
                {error !== null && mode === "login" && (
                  <p className="text-xs text-slate-500">
                    Tip: the seeded accounts all use the password {DEMO_PASSWORD} — pick one on the
                    right.
                  </p>
                )}
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? "Working…" : MODE_LABELS[mode]}
                </Button>
                {mode === "register" && (
                  <p className="text-xs text-slate-500">
                    Signing up always creates a normal account. Only an admin can create another
                    admin, or set anyone's interests.
                  </p>
                )}
              </form>

              {mode === "login" && (
                <Callout tone="info" title="Demo accounts" className="h-fit">
                  <p className="text-xs">
                    Two seeded accounts, so both sides of the role rules are one click away. Password
                    for both: <strong>{DEMO_PASSWORD}</strong>
                  </p>
                  <div className="mt-2.5 space-y-2">
                    {DEMO_ACCOUNTS.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => useDemo(account.email)}
                        className="flex w-full items-center gap-2.5 rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-left shadow-sm transition duration-150 hover:border-sky-300 hover:bg-sky-50 active:translate-y-px"
                      >
                        <RoleBadge role={account.role} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium text-slate-800">
                            {account.email}
                          </span>
                          <span className="block text-xs text-slate-500">
                            sees {account.note}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Callout>
              )}
            </div>
          )}
        </div>
      </Card>

      {mode === "feed" && <PostsScreen />}
    </div>
  );
}
