/** Cycle order matches the original tracker: unattempted → needed help → slow → clean. */
export const STATUSES = ["NOT_STARTED", "NEEDED_HELP", "SOLVED_SLOW", "SOLVED_CLEAN"] as const;
export type Status = (typeof STATUSES)[number];

/** Statuses that are persisted; NOT_STARTED is the absence of a row. */
export const STORED_STATUSES = ["NEEDED_HELP", "SOLVED_SLOW", "SOLVED_CLEAN"] as const;
export type StoredStatus = (typeof STORED_STATUSES)[number];

export const STATUS_LABEL: Record<Status, string> = {
  NOT_STARTED: "Not started",
  NEEDED_HELP: "Needed help",
  SOLVED_SLOW: "Solved slowly",
  SOLVED_CLEAN: "Solved clean",
};

export const STATUS_HINT: Record<Status, string> = {
  NOT_STARTED: "Not attempted yet.",
  NEEDED_HELP: "Needed hints or the solution. Due for a revisit.",
  SOLVED_SLOW: "Solved without help, but slowly. Due for a revisit.",
  SOLVED_CLEAN: "Recognised the pattern and solved it cleanly.",
};

export function nextStatus(status: Status): Status {
  return STATUSES[(STATUSES.indexOf(status) + 1) % STATUSES.length];
}

/** Solved = got to an accepted answer without help, fast or slow. */
export function isSolved(status: Status): boolean {
  return status === "SOLVED_SLOW" || status === "SOLVED_CLEAN";
}

/** Same definition as the original tracker's "due for revisit" counter. */
export function needsRevisit(status: Status): boolean {
  return status === "NEEDED_HELP" || status === "SOLVED_SLOW";
}

/** Sheet status filter: the four statuses plus the three roll-ups used by the dashboard. */
export const STATUS_FILTERS = [...STATUSES, "SOLVED", "PENDING", "REVISIT"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const STATUS_FILTER_LABEL: Record<StatusFilter, string> = {
  ...STATUS_LABEL,
  SOLVED: "Solved (slow or clean)",
  PENDING: "Pending (not solved)",
  REVISIT: "Due for revisit",
};
