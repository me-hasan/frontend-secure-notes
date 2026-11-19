import { useCallback, useEffect, useState } from "react";
import { api, messageOf } from "../api/client";
import type { InterestGroup } from "../api/types";
import { Button, Card, ErrorNote, Skeleton } from "../components/ui";

/** Aggregation Scenario 1 — exactly one `collection.aggregate()` call, no other read on this path. */
export function InterestsScreen() {
  const [groups, setGroups] = useState<InterestGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .groupedByInterests()
      .then(setGroups)
      .catch((cause: unknown) => setError(messageOf(cause)));
  }, []);

  useEffect(load, [load]);

  const people = groups?.reduce((total, group) => total + group.userCount, 0) ?? 0;

  return (
    <Card
      title="People who share an interest"
      subtitle="Each group is one interest, with everyone who listed it on their profile — the discovery page of the platform."
      actions={
        <Button variant="secondary" onClick={load}>
          Refresh
        </Button>
      }
    >
      <div>
        <ErrorNote message={error} />

        {groups === null ? (
          <Skeleton label="Loading groups…" />
        ) : groups.length === 0 ? (
          <Skeleton label="Nobody has listed an interest yet — an admin can add them on the Users tab." />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">
              {groups.length} {groups.length === 1 ? "interest" : "interests"} ·{" "}
              {people} {people === 1 ? "listing" : "listings"} in total
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {groups.map((group) => (
                <li
                  key={group._id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 transition duration-150 hover:border-slate-300 hover:bg-slate-50"
                >
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold capitalize text-slate-900">{group._id}</span>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100">
                      {group.userCount} {group.userCount === 1 ? "person" : "people"}
                    </span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {group.users.map((member) => (
                      <span
                        key={member._id}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm"
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
