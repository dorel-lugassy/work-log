import { v } from "convex/values";
import { query } from "./_generated/server";

export const getDailySummary = query({
    args: {
        date: v.number(), // Start of day timestamp
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        const startOfDay = args.date;
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

        const entries = await ctx.db
            .query("timeEntries")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .filter((q) =>
                q.and(
                    q.gte(q.field("startTime"), startOfDay),
                    q.lt(q.field("startTime"), endOfDay),
                    q.neq(q.field("endTime"), undefined)
                )
            )
            .collect();

        // Group by job
        const jobSummaries: Record<string, {
            jobId: string;
            jobName: string;
            jobColor: string;
            hourlyRate: number;
            totalDuration: number;
            entries: typeof entries;
        }> = {};

        for (const entry of entries) {
            const job = await ctx.db.get(entry.jobId);
            if (!job) continue;

            const jobIdStr = entry.jobId.toString();
            if (!jobSummaries[jobIdStr]) {
                jobSummaries[jobIdStr] = {
                    jobId: jobIdStr,
                    jobName: job.name,
                    jobColor: job.color,
                    hourlyRate: job.hourlyRate,
                    totalDuration: 0,
                    entries: [],
                };
            }

            jobSummaries[jobIdStr].totalDuration += entry.duration || 0;
            jobSummaries[jobIdStr].entries.push(entry);
        }

        return Object.values(jobSummaries);
    },
});

export const getMonthlySummary = query({
    args: {
        year: v.number(),
        month: v.number(), // 0-11
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        const startOfMonth = new Date(args.year, args.month, 1).getTime();
        const endOfMonth = new Date(args.year, args.month + 1, 0, 23, 59, 59, 999).getTime();

        const entries = await ctx.db
            .query("timeEntries")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .filter((q) =>
                q.and(
                    q.gte(q.field("startTime"), startOfMonth),
                    q.lte(q.field("startTime"), endOfMonth),
                    q.neq(q.field("endTime"), undefined)
                )
            )
            .collect();

        // Group by job
        const jobSummaries: Record<string, {
            jobId: string;
            jobName: string;
            jobColor: string;
            hourlyRate: number;
            totalDuration: number;
            totalSalary: number;
            entriesCount: number;
        }> = {};

        for (const entry of entries) {
            const job = await ctx.db.get(entry.jobId);
            if (!job) continue;

            const jobIdStr = entry.jobId.toString();
            if (!jobSummaries[jobIdStr]) {
                jobSummaries[jobIdStr] = {
                    jobId: jobIdStr,
                    jobName: job.name,
                    jobColor: job.color,
                    hourlyRate: job.hourlyRate,
                    totalDuration: 0,
                    totalSalary: 0,
                    entriesCount: 0,
                };
            }

            const duration = entry.duration || 0;
            jobSummaries[jobIdStr].totalDuration += duration;
            jobSummaries[jobIdStr].totalSalary += (duration / 3600000) * job.hourlyRate;
            jobSummaries[jobIdStr].entriesCount += 1;
        }

        return Object.values(jobSummaries);
    },
});

export const getEntriesForExport = query({
    args: {
        startDate: v.number(),
        endDate: v.number(),
        jobId: v.optional(v.id("jobs")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        let entriesQuery = ctx.db
            .query("timeEntries")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .filter((q) =>
                q.and(
                    q.gte(q.field("startTime"), args.startDate),
                    q.lte(q.field("startTime"), args.endDate),
                    q.neq(q.field("endTime"), undefined)
                )
            );

        const entries = await entriesQuery.collect();

        // Filter by job if specified
        const filteredEntries = args.jobId
            ? entries.filter(e => e.jobId === args.jobId)
            : entries;

        // Get job details and format for export
        const exportData = await Promise.all(
            filteredEntries.map(async (entry) => {
                const job = await ctx.db.get(entry.jobId);
                const startDate = new Date(entry.startTime);
                const endDate = new Date(entry.endTime!);
                const durationHours = (entry.duration || 0) / 3600000;

                return {
                    date: startDate.toLocaleDateString('he-IL'),
                    jobName: job?.name || 'Unknown',
                    startTime: startDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                    endTime: endDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                    durationFormatted: `${Math.floor(durationHours)}:${String(Math.round((durationHours % 1) * 60)).padStart(2, '0')}`,
                    durationHours: durationHours.toFixed(2),
                    hourlyRate: job?.hourlyRate || 0,
                    salary: (durationHours * (job?.hourlyRate || 0)).toFixed(2),
                    notes: entry.notes || '',
                };
            })
        );

        return exportData;
    },
});
