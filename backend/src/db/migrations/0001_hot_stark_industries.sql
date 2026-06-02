CREATE TABLE "incident_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" uuid NOT NULL,
	"status" "status" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "incidents_created_at_idx";--> statement-breakpoint
DROP INDEX "incidents_status_severity_idx";--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "last_event_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "incident_events" ADD CONSTRAINT "incident_events_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incident_events_incident_id_idx" ON "incident_events" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "incident_events_occurred_at_idx" ON "incident_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "incident_events_status_occurred_at_idx" ON "incident_events" USING btree ("status","occurred_at");--> statement-breakpoint
CREATE INDEX "incidents_occurred_at_idx" ON "incidents" USING btree ("occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "incidents_severity_occurred_at_idx" ON "incidents" USING btree ("severity","occurred_at");--> statement-breakpoint
CREATE INDEX "incidents_status_occurred_at_idx" ON "incidents" USING btree ("status","occurred_at");