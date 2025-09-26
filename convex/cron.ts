import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

export default crons;
