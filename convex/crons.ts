import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "resolve image cleanup",
  { hourUTC: 7, minuteUTC: 0 },
  internal.imageReferences.resolveImageReferences,
  {},
);

crons.daily(
  "cleanup old backups",
  { hourUTC: 8, minuteUTC: 0 },
  internal.noteVersions.cleanupOldBackups,
  {},
);

// crons.interval(
//   "resolve image cleanup table",
//   { minutes: 1 },
//   internal.imageReferences.resolveImageReferences,
// );

export default crons;
