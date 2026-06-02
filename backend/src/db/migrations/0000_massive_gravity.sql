CREATE TYPE "public"."event_type" AS ENUM('ACCIDENT', 'CONGESTION', 'ROAD_CLOSURE', 'HAZARD', 'BREAKDOWN');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED');--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(64) NOT NULL,
	"location" varchar(256) NOT NULL,
	"event_type" "event_type" NOT NULL,
	"severity" "severity" NOT NULL,
	"status" "status" DEFAULT 'OPEN' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "incidents_device_id_idx" ON "incidents" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "incidents_severity_idx" ON "incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "incidents_status_idx" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "incidents_created_at_idx" ON "incidents" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "incidents_status_severity_idx" ON "incidents" USING btree ("status","severity");