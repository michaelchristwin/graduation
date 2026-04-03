CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'closed');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('tamper', 'outage', 'high_usage', 'low_battery');--> statement-breakpoint
CREATE TYPE "public"."connection_type" AS ENUM('residential', 'commercial', 'industrial');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('unpaid', 'paid', 'overdue', 'disputed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."meter_status" AS ENUM('active', 'inactive', 'faulty', 'decommissioned');--> statement-breakpoint
CREATE TYPE "public"."method" AS ENUM('bank_transfer', 'card', 'ussd', 'cash', 'wallet');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'successful', 'failed', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."reading_type" AS ENUM('automatic', 'manual', 'estimated');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('flat', 'time_of_use', 'tiered');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_id" uuid NOT NULL,
	"alert_type" "alert_type" NOT NULL,
	"severity" "severity" DEFAULT 'info' NOT NULL,
	"message" text,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_point_id" uuid NOT NULL,
	"total_kwh" numeric(12, 4) NOT NULL,
	"amount_due" numeric(12, 2) NOT NULL,
	"invoice_status" "invoice_status" DEFAULT 'unpaid' NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	CONSTRAINT "is_due" CHECK ("invoices"."period_end" > "invoices"."period_start")
);
--> statement-breakpoint
CREATE TABLE "meters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_point_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"manufacturer" varchar(100),
	"model" varchar(100),
	"firmware_version" varchar(50),
	"meter_status" "meter_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	CONSTRAINT "meters_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" "method" NOT NULL,
	"transaction_ref" varchar(200),
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meter_id" uuid NOT NULL,
	"value_kwh" numeric(12, 4) NOT NULL,
	"reading_type" "reading_type" DEFAULT 'automatic' NOT NULL,
	"source" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tarrif_id" uuid,
	"address" text NOT NULL,
	"coordinates" "point",
	"connection_type" "connection_type" DEFAULT 'residential' NOT NULL,
	"activated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tariffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "type" NOT NULL,
	"base_rate" numeric(10, 6) NOT NULL,
	"peak_rate" numeric(10, 6),
	"off_peak_rate" numeric(10, 6),
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"address" text,
	"account_status" "account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_service_point_id_service_points_id_fk" FOREIGN KEY ("service_point_id") REFERENCES "public"."service_points"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meters" ADD CONSTRAINT "meters_service_point_id_service_points_id_fk" FOREIGN KEY ("service_point_id") REFERENCES "public"."service_points"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_meter_id_meters_id_fk" FOREIGN KEY ("meter_id") REFERENCES "public"."meters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_points" ADD CONSTRAINT "service_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_points" ADD CONSTRAINT "service_points_tarrif_id_tariffs_id_fk" FOREIGN KEY ("tarrif_id") REFERENCES "public"."tariffs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_alerts_meter" ON "alerts" USING btree ("meter_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_readings_meter_time" ON "readings" USING btree ("meter_id","created_at" DESC NULLS LAST);