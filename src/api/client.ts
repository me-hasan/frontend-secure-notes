import type {
  AuthResult,
  CreateUserBody,
  CredentialsBody,
  InterestGroup,
  NoteBody,
  NoteEntity,
  Paginated,
  PostBody,
  PostEntity,
  RegisterBody,
  UpdateUserBody,
  UserEntity,
  UserWithPosts,
} from "./types";

/**
 * The API root, read from `VITE_API_URL` in `.env` (Vite inlines `import.meta.env` at build time).
 * The fallback keeps `pnpm run dev` working even when `.env` is missing.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace(/\/+$/, "");

const STORAGE_KEY = "secure-notes.session";

/** The backend's error envelope is `{ error: { message, code } }` — see `AllExceptionsFilter`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Every failure the UI renders comes through here, so even a non-`Error` throw reads sensibly. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

/**
 * The token lives at module level rather than in React state because `fetch` is not a render concern,
 * and because a module-level read means it is already in place before the first screen's effect runs.
 */
let bearer: string | null = readStoredToken();

function readStoredToken(): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? ((JSON.parse(raw) as { token?: string }).token ?? null) : null;
  } catch {
    // A corrupt or absent entry simply means "signed out" — never a crash on boot.
    return null;
  }
}

export function setBearerToken(token: string | null): void {
  bearer = token;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // `204 No Content` (DELETE) has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const envelope = payload as { error?: { message?: string; code?: string } } | null;
    throw new ApiError(
      response.status,
      envelope?.error?.message ?? `Request failed with ${response.status}`,
      envelope?.error?.code ?? "ERROR",
    );
  }

  return payload as T;
}

/** Builds the shared `?page=&limit=` query; `extra` carries route-specific filters such as `owner`. */
function paging(page: number, limit: number, extra: Record<string, string | undefined> = {}): string {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });

  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }

  return params.toString();
}

export const api = {
  // --- auth (public) ---
  register: (body: RegisterBody) => request<AuthResult>("POST", "/auth/register", body),
  login: (body: CredentialsBody) => request<AuthResult>("POST", "/auth/login", body),

  // --- users ---
  me: () => request<UserEntity>("GET", "/users/me"),
  listUsers: (page: number, limit: number) =>
    request<Paginated<UserEntity>>("GET", `/users?${paging(page, limit)}`),
  createUser: (body: CreateUserBody) => request<UserEntity>("POST", "/users", body),
  updateUser: (id: string, body: UpdateUserBody) => request<UserEntity>("PATCH", `/users/${id}`, body),
  deleteUser: (id: string) => request<void>("DELETE", `/users/${id}`),
  /** Aggregation Scenario 1. */
  groupedByInterests: () => request<InterestGroup[]>("GET", "/users/grouped-by-interests"),
  /** Aggregation Scenario 2 (`$lookup`) — public. */
  userPosts: (id: string) => request<UserWithPosts>("GET", `/users/${id}/posts`),

  // --- notes ---
  listNotes: (page: number, limit: number, owner?: string) =>
    request<Paginated<NoteEntity>>("GET", `/notes?${paging(page, limit, { owner })}`),
  createNote: (body: NoteBody) => request<NoteEntity>("POST", "/notes", body),
  updateNote: (id: string, body: NoteBody) => request<NoteEntity>("PATCH", `/notes/${id}`, body),
  deleteNote: (id: string) => request<void>("DELETE", `/notes/${id}`),

  // --- posts ---
  listPosts: (page: number, limit: number) =>
    request<Paginated<PostEntity>>("GET", `/posts?${paging(page, limit)}`),
  createPost: (body: PostBody) => request<PostEntity>("POST", "/posts", body),
};

export { STORAGE_KEY };
