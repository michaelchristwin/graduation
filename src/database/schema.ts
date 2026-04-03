import { gt } from "drizzle-orm";
import {
  uuid,
  text,
  index,
  check,
  pgEnum,
  pgTable,
  varchar,
  boolean,
  numeric,
  timestamp,
  point,
  date,
} from "drizzle-orm/pg-core";

const accountStatus = pgEnum("account_status", [
  "active",
  "suspended",
  "closed",
]);

const tariffType = pgEnum("type", ["flat", "time_of_use", "tiered"]);

const connectionType = pgEnum("connection_type", [
  "residential",
  "commercial",
  "industrial",
]);

const metersStatus = pgEnum("status", [
  "active",
  "inactive",
  "faulty",
  "decommissioned",
]);

const readingType = pgEnum("reading_type", [
  "automatic",
  "manual",
  "estimated",
]);

const alertType = pgEnum("alert_type", [
  "tamper",
  "outage",
  "high_usage",
  "low_battery",
]);

const severity = pgEnum("severity", ["info", "warning", "critical"]);

const invoiceStatus = pgEnum("invoice_status", [
  "unpaid",
  "paid",
  "overdue",
  "disputed",
  "cancelled",
]);

const paymentMethod = pgEnum("method", [
  "bank_transfer",
  "card",
  "ussd",
  "cash",
  "wallet",
]);

const paymentStatus = pgEnum("status", [
  "pending",
  "successful",
  "failed",
  "reversed",
]);

const now = timestamp({ withTimezone: true }).notNull().defaultNow();

const usersTable = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  full_name: varchar({ length: 150 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 30 }),
  address: text(),
  account_status: accountStatus().notNull().default("active"),
  created_at: now,
});

const tariffsTable = pgTable("tariffs", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  type: tariffType().notNull(),
  base_rate: numeric({ precision: 10, scale: 6 }).notNull(),
  peak_rate: numeric({ precision: 10, scale: 6 }),
  off_peak_rate: numeric({ precision: 10, scale: 6 }),
  effective_from: timestamp({ withTimezone: true }).notNull(),
  effective_to: timestamp({ withTimezone: true }),
});

const servicePointsTable = pgTable("service_points", {
  id: uuid().primaryKey().defaultRandom(),
  user_id: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  tarrif_id: uuid().references(() => tariffsTable.id),
  address: text().notNull(),
  coordinates: point(),
  connection_type: connectionType().notNull().default("residential"),
  activated_at: timestamp({ withTimezone: true }),
});

const metersTable = pgTable("meters", {
  id: uuid().primaryKey().defaultRandom(),
  service_point_id: uuid()
    .notNull()
    .references(() => servicePointsTable.user_id, { onDelete: "restrict" }),
  serial_number: varchar({ length: 100 }).notNull().unique(),
  manufacturer: varchar({ length: 100 }),
  model: varchar({ length: 100 }),
  firmware_version: varchar({ length: 50 }),
  status: metersStatus().notNull().default("active"),
  installed_at: now,
  last_seen_at: timestamp({ withTimezone: true }),
});

const readingsTable = pgTable(
  "readings",
  {
    id: uuid().primaryKey().defaultRandom(),
    meter_id: uuid()
      .notNull()
      .references(() => metersTable.id, { onDelete: "cascade" }),
    value_kwh: numeric({ precision: 12, scale: 4 }).notNull(),
    reading_type: readingType().notNull().default("automatic"),
    source: varchar({ length: 50 }),
    recorded_at: now,
  },
  (table) => [
    index("idx_readings_meter_time").on(
      table.meter_id,
      table.recorded_at.desc(),
    ),
  ],
);

const alertTable = pgTable(
  "alerts",
  {
    id: uuid().primaryKey().defaultRandom(),
    meter_id: uuid()
      .notNull()
      .references(() => metersTable.id, { onDelete: "cascade" }),
    alert_type: alertType().notNull(),
    severity: severity().notNull().default("info"),
    message: text(),
    acknowledged: boolean().notNull().default(false),
    triggered_at: now,
  },
  (table) => [
    index("idx_alerts_meter").on(table.meter_id, table.triggered_at.desc()),
  ],
);

const invoicesTable = pgTable(
  "invoices",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    service_point_id: uuid()
      .notNull()
      .references(() => servicePointsTable.id, { onDelete: "restrict" }),
    total_kwh: numeric({ precision: 12, scale: 4 }).notNull(),
    amount_due: numeric({ precision: 12, scale: 2 }).notNull(),
    status: invoiceStatus().notNull().default("unpaid"),
    period_start: date().notNull(),
    period_end: date().notNull(),
    issued_at: now,
    due_date: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [check("is_due", gt(table.period_end, table.period_start))],
);

const paymentsTable = pgTable("payments", {
  id: uuid().primaryKey().defaultRandom(),
  invoice_id: uuid()
    .notNull()
    .references(() => invoicesTable.id, { onDelete: "restrict" }),
  amount: numeric({ precision: 12, scale: 2 }).notNull(),
  method: paymentMethod().notNull(),
  transaction_ref: varchar({ length: 200 }),
  status: paymentStatus().notNull().default("pending"),
  paid_at: now,
});

export {
  // Tables
  usersTable,
  tariffsTable,
  servicePointsTable,
  metersTable,
  readingsTable,
  alertTable,
  invoicesTable,
  paymentsTable,

  // Enums
  accountStatus,
  tariffType,
  connectionType,
  metersStatus,
  readingType,
  alertType,
  severity,
  invoiceStatus,
  paymentMethod,
  paymentStatus,
};
