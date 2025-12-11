import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getActive = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        const entries = await ctx.db
            .query("timeEntries")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .filter((q) => q.eq(q.field("endTime"), undefined))
            .collect();

        // Get job details for each entry
        const entriesWithJobs = await Promise.all(
            entries.map(async (entry) => {
                const job = await ctx.db.get(entry.jobId);
                return { ...entry, job };
            })
        );

        return entriesWithJobs;
    },
});

export const clockIn = mutation({
    args: {
        jobId: v.id("jobs"),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called clockIn without authentication present");
        }

        const job = await ctx.db.get(args.jobId);
        if (job?.userId !== identity.subject) {
            throw new Error("Unauthorized job access");
        }

        // Check if already clocked in to this job
        const existing = await ctx.db
            .query("timeEntries")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .filter((q) =>
                q.and(
                    q.eq(q.field("jobId"), args.jobId),
                    q.eq(q.field("endTime"), undefined)
                )
            )
            .first();

        if (existing) {
            throw new Error("Already clocked in to this job");
        }

        return await ctx.db.insert("timeEntries", {
            jobId: args.jobId,
            startTime: Date.now(),
            notes: args.notes,
            userId: identity.subject,
        });
    },
});

export const clockOut = mutation({
    args: { id: v.id("timeEntries") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called clockOut without authentication present");
        }
        const entry = await ctx.db.get(args.id);
        if (!entry) {
            throw new Error("Time entry not found");
        }
        if (entry.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }

        const endTime = Date.now();
        const duration = endTime - entry.startTime;

        await ctx.db.patch(args.id, {
            endTime,
            duration,
        });

        return { duration };
    },
});

export const getByDateRange = query({
    args: {
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        // Ideally we would use an index on (userId, startTime) but for now let's filter in memory or use helper
        // Since we already have by_user index, we can start with that if we expect fewer user entries than total entires
        // BUT we also have by_start_time. 
        // Best approach given existing indexes: use by_user and then filter by time. 

        const entries = await ctx.db
            .query("timeEntries")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .filter((q) =>
                q.and(
                    q.gte(q.field("startTime"), args.startDate),
                    q.lte(q.field("startTime"), args.endDate),
                    q.neq(q.field("endTime"), undefined)
                )
            )
            .collect();

        // Get job details for each entry
        const entriesWithJobs = await Promise.all(
            entries.map(async (entry) => {
                const job = await ctx.db.get(entry.jobId);
                return { ...entry, job };
            })
        );

        return entriesWithJobs;
    },
});

export const getToday = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

        const entries = await ctx.db
            .query("timeEntries")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .filter((q) =>
                q.and(
                    q.gte(q.field("startTime"), startOfDay),
                    q.lt(q.field("startTime"), endOfDay)
                )
            )
            .collect();

        const entriesWithJobs = await Promise.all(
            entries.map(async (entry) => {
                const job = await ctx.db.get(entry.jobId);
                return { ...entry, job };
            })
        );

        return entriesWithJobs;
    },
});

export const deleteEntry = mutation({
    args: { id: v.id("timeEntries") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called deleteEntry without authentication present");
        }
        const entry = await ctx.db.get(args.id);
        if (entry?.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }
        await ctx.db.delete(args.id);
    },
});

export const updateEntry = mutation({
    args: {
        id: v.id("timeEntries"),
        startTime: v.number(),
        endTime: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called updateEntry without authentication present");
        }
        const entry = await ctx.db.get(args.id);
        if (entry?.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }

        const duration = args.endTime - args.startTime;
        await ctx.db.patch(args.id, {
            startTime: args.startTime,
            endTime: args.endTime,
            duration,
            notes: args.notes,
        });
    },
});
