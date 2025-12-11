import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  jobs: defineTable({
    name: v.string(),
    color: v.string(),
    hourlyRate: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    userId: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  timeEntries: defineTable({
    jobId: v.id("jobs"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    userId: v.optional(v.string()),
  }).index("by_job", ["jobId"])
    .index("by_start_time", ["startTime"])
    .index("by_user", ["userId"]),
});
