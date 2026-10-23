CREATE TYPE "timeline_entry_kind" AS ENUM('award', 'competition', 'scholarship_fellowship_grant', 'certification', 'recognition_service', 'education', 'research_experience', 'industry_experience', 'teaching_mentoring', 'affiliation');--> statement-breakpoint
CREATE TYPE "timeline_image_role" AS ENUM('certificate', 'photo', 'badge', 'logo');--> statement-breakpoint
CREATE TABLE "timeline_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"kind" "timeline_entry_kind" NOT NULL,
	"slug" varchar(200),
	"title" varchar(500) NOT NULL,
	"subtitle" text,
	"summary" text,
	"organization" varchar(500),
	"location" varchar(300),
	"start_date" date,
	"end_date" date,
	"is_ongoing" boolean DEFAULT false NOT NULL,
	"is_current" boolean,
	"proof_url" varchar(2000),
	"rank_or_placement" varchar(200),
	"event_name" varchar(500),
	"credential_id" varchar(200),
	"expires_at" date,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"publication_id" uuid,
	"project_id" uuid,
	"seo_title" varchar(500),
	"seo_description" text,
	"hide_from_search" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline_entry_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"timeline_entry_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"caption" text,
	"image_role" "timeline_image_role"
);
--> statement-breakpoint
CREATE UNIQUE INDEX "timeline_entries_slug_unique" ON "timeline_entries" ("slug");--> statement-breakpoint
CREATE INDEX "timeline_entries_publish_status_idx" ON "timeline_entries" ("publish_status");--> statement-breakpoint
CREATE INDEX "timeline_entries_kind_sort_order_idx" ON "timeline_entries" ("kind","sort_order");--> statement-breakpoint
CREATE INDEX "timeline_entries_kind_start_date_idx" ON "timeline_entries" ("kind","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "timeline_entry_media_entry_media_unique" ON "timeline_entry_media" ("timeline_entry_id","media_id");--> statement-breakpoint
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_publication_id_publications_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "timeline_entry_media" ADD CONSTRAINT "timeline_entry_media_timeline_entry_id_timeline_entries_id_fkey" FOREIGN KEY ("timeline_entry_id") REFERENCES "timeline_entries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "timeline_entry_media" ADD CONSTRAINT "timeline_entry_media_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT;