/**
 * Mirrors the backend's response contract (`src/domain/entities/*` + `infrastructure/mongo/mappers.ts`).
 * Kept hand-written rather than generated: the surface is small, and the whole point of the frontend is
 * to prove the API contract, so a copy that has to be updated by hand is a feature.
 */

export type UserRole = "user" | "admin";

/** What `/auth/register` and `/auth/login` return inside `user`. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface UserEntity {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteEntity {
  _id: string;
  owner: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostEntity {
  _id: string;
  author: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

/** The uniform list envelope every `GET` collection route returns. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Aggregation Scenario 1 — `GET /users/grouped-by-interests`. `_id` is the interest itself. */
export interface InterestGroup {
  _id: string;
  userCount: number;
  users: { _id: string; name: string }[];
}

/** Aggregation Scenario 2 — `GET /users/:id/posts`. */
export interface UserWithPosts {
  _id: string;
  name: string;
  email: string;
  interests: string[];
  createdAt: string;
  posts: PostEntity[];
}

export interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  interests?: string[];
}

export interface UpdateUserBody {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  interests?: string[];
}

export interface CredentialsBody {
  email: string;
  password: string;
}

export interface RegisterBody extends CredentialsBody {
  name: string;
}

export interface NoteBody {
  title: string;
  body?: string;
}

export interface PostBody {
  title: string;
  body?: string;
}
