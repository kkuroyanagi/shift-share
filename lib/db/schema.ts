import {
  pgTable,
  pgEnum,
  uuid,
  integer,
  text,
  date,
  time,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const shiftSlotStatusEnum = pgEnum("shift_slot_status", ["open", "confirmed"]);
export const assignmentSourceEnum = pgEnum("assignment_source", ["applied", "assigned"]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["tentative", "confirmed"]);
export const preferenceEnum = pgEnum("preference", ["preferred", "available", "unavailable"]);

export const fiscalYears = pgTable("fiscal_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 年度ごとの営業曜日 (0=日,1=月,...,6=土)
export const businessDayRules = pgTable(
  "business_day_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fiscalYearId: uuid("fiscal_year_id")
      .notNull()
      .references(() => fiscalYears.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
  },
  (t) => [unique().on(t.fiscalYearId, t.dayOfWeek)],
);

// 祝日・臨時休業日
export const closedDates = pgTable("closed_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fiscalYearId: uuid("fiscal_year_id")
    .notNull()
    .references(() => fiscalYears.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  name: text("name").notNull(),
});

// シフトテンプレート（繰り返しパターン）
export const shiftTemplates = pgTable("shift_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fiscalYearId: uuid("fiscal_year_id")
    .notNull()
    .references(() => fiscalYears.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  requiredCount: integer("required_count").notNull().default(1),
});

// 従業員（認証なし・名前のみ）
export const workers = pgTable("workers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  desiredHoursPerMonth: integer("desired_hours_per_month").notNull().default(0), // 分単位
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// シフト枠
export const shiftSlots = pgTable("shift_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  fiscalYearId: uuid("fiscal_year_id")
    .notNull()
    .references(() => fiscalYears.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => shiftTemplates.id, {
    onDelete: "set null",
  }),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  requiredCount: integer("required_count").notNull().default(1),
  status: shiftSlotStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 希望提出
export const availabilities = pgTable("availabilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  fiscalYearId: uuid("fiscal_year_id")
    .notNull()
    .references(() => fiscalYears.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workers.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  preference: preferenceEnum("preference").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 割当
export const shiftAssignments = pgTable("shift_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  shiftSlotId: uuid("shift_slot_id")
    .notNull()
    .references(() => shiftSlots.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workers.id, { onDelete: "cascade" }),
  source: assignmentSourceEnum("source").notNull(),
  status: assignmentStatusEnum("status").notNull().default("tentative"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
