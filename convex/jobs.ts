import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        return await ctx.db
            .query("jobs")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }
        return await ctx.db
            .query("jobs")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        color: v.string(),
        hourlyRate: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called create without authentication present");
        }
        return await ctx.db.insert("jobs", {
            name: args.name,
            color: args.color,
            hourlyRate: args.hourlyRate,
            isActive: true,
            createdAt: Date.now(),
            userId: identity.subject,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("jobs"),
        name: v.string(),
        color: v.string(),
        hourlyRate: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called update without authentication present");
        }
        const job = await ctx.db.get(args.id);
        if (job?.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(args.id, {
            name: args.name,
            color: args.color,
            hourlyRate: args.hourlyRate,
        });
    },
});

export const remove = mutation({
    args: { id: v.id("jobs") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called remove without authentication present");
        }
        const job = await ctx.db.get(args.id);
        if (job?.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(args.id, { isActive: false });
    },
});

export const restore = mutation({
    args: { id: v.id("jobs") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called restore without authentication present");
        }
        const job = await ctx.db.get(args.id);
        if (job?.userId !== identity.subject) {
            throw new Error("Unauthorized");
        }
        await ctx.db.patch(args.id, { isActive: true });
    },
});
