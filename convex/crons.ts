import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// crons.daily(
//   "resolve image cleanup",
//   { hourUTC: 7, minuteUTC: 0 },
//   internal.imageReferences.resolveImageReferences,
//   {},
// );

crons.interval(
  "resolve image cleanup table",
  { minutes: 1 },
  internal.imageReferences.resolveImageReferences,
);

export default crons;
