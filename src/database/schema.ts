import {
  uuid,
  text,
  pgEnum,
  pgTable,
  varchar,
  numeric,
  timestamp,
  point,
} from "drizzle-orm/pg-core";

const accountStatusEnum = pgEnum("account_status", [
  "active",
  "suspended",
  "closed",
]);

const tariffTypeEnum = pgEnum("type", ["flat", "time_of_use", "tiered"]);

const connectionTypeEnum = pgEnum("connection_type", [
  "residential",
  "commercial",
  "industrial",
]);

const usersTable = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  full_name: varchar({ length: 150 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  phone: varchar({ length: 30 }),
  address: text(),
  account_status: accountStatusEnum().notNull().default("active"),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

const tariffsTable = pgTable("tariffs", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  type: tariffTypeEnum().notNull(),
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
  connection_type: connectionTypeEnum().notNull().default("residential"),
  activated_at: timestamp({ withTimezone: true }),
});

export {
  usersTable,
  tariffsTable,
  servicePointsTable,
  accountStatusEnum,
  tariffTypeEnum,
  connectionTypeEnum,
};
