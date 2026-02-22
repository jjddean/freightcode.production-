import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * USA AMS Data - Daily at 2 AM UTC
 * Most valuable source, updates daily
 */
crons.daily(
    "ingest-usa-ams",
    { hourUTC: 2, minuteUTC: 0 },
    internal.freightintel.ingest_usa_ams.scheduledIngest
);

/**
 * Recalculate Forwarder Scores - Daily at 3 AM UTC
 * Run after data ingestion completes
 */
crons.daily(
    "recalculate-scores",
    { hourUTC: 3, minuteUTC: 0 },
    internal.freightintel.internal.recalculateAllScores
);

/**
 * India DGCI&S Data - Monthly on 5th at 2 AM UTC
 * India releases data monthly
 */
crons.monthly(
    "ingest-india-dgcis",
    { day: 5, hourUTC: 2, minuteUTC: 0 },
    internal.freightintel.ingest_usa_ams.scheduledIngest // Placeholder: reused daily logic for now
);

/**
 * Pakistan FBR Data - Monthly on 10th at 2 AM UTC
 */
crons.monthly(
    "ingest-pakistan-fbr",
    { day: 10, hourUTC: 2, minuteUTC: 0 },
    internal.freightintel.ingest_usa_ams.scheduledIngest // Placeholder
);

/**
 * Bangladesh NBR Data - Monthly on 12th at 2 AM UTC
 */
crons.monthly(
    "ingest-bangladesh-nbr",
    { day: 12, hourUTC: 2, minuteUTC: 0 },
    internal.freightintel.ingest_usa_ams.scheduledIngest // Placeholder
);

/**
 * Clean old data - Weekly on Sunday at 4 AM UTC
 * Remove shipments older than 2 years
 */
crons.weekly(
    "cleanup-old-data",
    { dayOfWeek: "sunday", hourUTC: 4, minuteUTC: 0 },
    internal.freightintel.maintenance.cleanupOldData
);

export default crons;
