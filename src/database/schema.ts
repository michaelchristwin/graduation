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
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

const now = timestamp({ withTimezone: true }).notNull().defaultNow();

// Enums Definitions
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

const meterStatus = pgEnum("meter_status", [
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

const paymentStatus = pgEnum("payment_status", [
  "pending",
  "successful",
  "failed",
  "reversed",
]);

// Tables Definitions
const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  full_name: varchar({ length: 150 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 30 }),
  address: text(),
  account_status: accountStatus().notNull().default("active"),
  created_at: now,
});

const tariffs = pgTable("tariffs", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  type: tariffType().notNull(),
  base_rate: numeric({ precision: 10, scale: 6 }).notNull(),
  peak_rate: numeric({ precision: 10, scale: 6 }),
  off_peak_rate: numeric({ precision: 10, scale: 6 }),
  effective_from: timestamp({ withTimezone: true }).notNull(),
  effective_to: timestamp({ withTimezone: true }),
});

const servicePoints = pgTable("service_points", {
  id: uuid().primaryKey().defaultRandom(),
  user_id: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  tarrif_id: uuid().references(() => tariffs.id),
  address: text().notNull(),
  coordinates: point(),
  connection_type: connectionType().notNull().default("residential"),
  activated_at: timestamp({ withTimezone: true }),
});

const meters = pgTable("meters", {
  id: uuid().primaryKey().defaultRandom(),
  service_point_id: uuid()
    .notNull()
    .references(() => servicePoints.id, { onDelete: "restrict" }),
  serial_number: varchar({ length: 100 }).notNull().unique(),
  manufacturer: varchar({ length: 100 }),
  model: varchar({ length: 100 }),
  firmware_version: varchar({ length: 50 }),
  meter_status: meterStatus().notNull().default("active"),
  installed_at: now,
  last_seen_at: timestamp({ withTimezone: true }),
});

const readings = pgTable(
  "readings",
  {
    id: uuid().primaryKey().defaultRandom(),
    meter_id: uuid()
      .notNull()
      .references(() => meters.id, { onDelete: "cascade" }),
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

const alerts = pgTable(
  "alerts",
  {
    id: uuid().primaryKey().defaultRandom(),
    meter_id: uuid()
      .notNull()
      .references(() => meters.id, { onDelete: "cascade" }),
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

const invoices = pgTable(
  "invoices",
  {
    id: uuid().primaryKey().defaultRandom(),
    user_id: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    service_point_id: uuid()
      .notNull()
      .references(() => servicePoints.id, { onDelete: "restrict" }),
    total_kwh: numeric({ precision: 12, scale: 4 }).notNull(),
    amount_due: numeric({ precision: 12, scale: 2 }).notNull(),
    invoice_status: invoiceStatus().notNull().default("unpaid"),
    period_start: date().notNull(),
    period_end: date().notNull(),
    issued_at: now,
    due_date: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [check("is_due", gt(table.period_end, table.period_start))],
);

const payments = pgTable("payments", {
  id: uuid().primaryKey().defaultRandom(),
  invoice_id: uuid()
    .notNull()
    .references(() => invoices.id, { onDelete: "restrict" }),
  amount: numeric({ precision: 12, scale: 2 }).notNull(),
  method: paymentMethod().notNull(),
  transaction_ref: varchar({ length: 200 }),
  payment_status: paymentStatus().notNull().default("pending"),
  paid_at: now,
});

// const selectServicePointsSchema = createSelectSchema(servicePoints);
// const selectTariffsSchema = createSelectSchema(tariffs);
// const selectMetersSchema = createSelectSchema(meters);
// const selectReadingsSchema = createSelectSchema(readings);
// const selectAlertsSchema = createSelectSchema(alerts);
// const selectInvoicesSchema = createSelectSchema(invoices);
// const selectPaymentsSchema = createSelectSchema(payments);
const selectUsersSchema = createSelectSchema(users);
const insertUsersSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});
const updateUsersSchema = createUpdateSchema(users).omit({
  id: true,
  created_at: true,
});

export {
  // Tables
  users,
  tariffs,
  servicePoints,
  meters,
  readings,
  alerts,
  invoices,
  payments,

  // Enums
  accountStatus,
  tariffType,
  connectionType,
  meterStatus,
  readingType,
  alertType,
  severity,
  invoiceStatus,
  paymentMethod,
  paymentStatus,

  // Schemas
  selectUsersSchema,
  insertUsersSchema,
  updateUsersSchema,
};
