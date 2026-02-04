import { MATCH_STATUS, type MatchStatus } from "../validation/matches.ts";

type DateLike = string | Date;

export interface MatchWithStatus {
  startTime: DateLike;
  endTime: DateLike;
  status: MatchStatus;
}

export function getMatchStatus(
  startTime: DateLike,
  endTime: DateLike,
  now: Date = new Date(),
): MatchStatus | null {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now >= end) {
    return MATCH_STATUS.FINISHED;
  }

  return MATCH_STATUS.LIVE;
}

export async function syncMatchStatus(
  match: MatchWithStatus,
  updateStatus: (status: MatchStatus) => Promise<void>,
): Promise<MatchStatus> {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);
  if (!nextStatus) {
    return match.status;
  }
  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }
  return nextStatus;
}
