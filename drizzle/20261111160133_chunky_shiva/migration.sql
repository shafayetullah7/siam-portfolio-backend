CREATE TYPE "talk_resource_type" AS ENUM('slides', 'video', 'poster', 'event_page', 'other');--> statement-breakpoint
CREATE TYPE "talk_role" AS ENUM('speaker', 'panelist', 'poster_presenter', 'attendee', 'organizer');--> statement-breakpoint
CREATE TYPE "talk_type" AS ENUM('invited_talk', 'conference_talk', 'poster', 'workshop', 'other');--> statement-breakpoint
CREATE TYPE "academic_service_type" AS ENUM('reviewing', 'committee', 'mentoring', 'outreach', 'editorial', 'other');--> statement-breakpoint
CREATE TABLE "talks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(200) NOT NULL UNIQUE,
	"title" varchar(500) NOT NULL,
	"event_name" varchar(500) NOT NULL,
	"venue" varchar(500),
	"location" varchar(500),
	"is_online" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"timezone" varchar(100) NOT NULL,
	"role" "talk_role" DEFAULT 'speaker'::"talk_role" NOT NULL,
	"talk_type" "talk_type" DEFAULT 'other'::"talk_type" NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"hide_from_search" boolean DEFAULT false NOT NULL,
	"publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"talk_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"resource_type" "talk_resource_type" DEFAULT 'other'::"talk_resource_type" NOT NULL,
	"label" varchar(200) NOT NULL,
	"url" varchar(2000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"talk_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"talk_id" uuid NOT NULL,
	"publication_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talk_research_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"talk_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaborations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"partner_name" varchar(500) NOT NULL,
	"institution" varchar(500),
	"logo_media_id" uuid,
	"role" varchar(500),
	"period" varchar(200),
	"summary" text NOT NULL,
	"outcomes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_service_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"service_type" "academic_service_type" DEFAULT 'other'::"academic_service_type" NOT NULL,
	"organization" varchar(500) NOT NULL,
	"role_title" varchar(500) NOT NULL,
	"start_year" integer,
	"end_year" integer,
	"proof_url" varchar(2000),
	"summary" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "talks_publish_status_idx" ON "talks" ("publish_status");--> statement-breakpoint
CREATE INDEX "talks_starts_at_idx" ON "talks" ("starts_at");--> statement-breakpoint
CREATE INDEX "talk_resources_talk_sort_idx" ON "talk_resources" ("talk_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "talk_projects_unique" ON "talk_projects" ("talk_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "talk_publications_unique" ON "talk_publications" ("talk_id","publication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "talk_research_themes_unique" ON "talk_research_themes" ("talk_id","theme_id");--> statement-breakpoint
ALTER TABLE "talk_resources" ADD CONSTRAINT "talk_resources_talk_id_talks_id_fkey" FOREIGN KEY ("talk_id") REFERENCES "talks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "talk_projects" ADD CONSTRAINT "talk_projects_talk_id_talks_id_fkey" FOREIGN KEY ("talk_id") REFERENCES "talks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "talk_projects" ADD CONSTRAINT "talk_projects_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "talk_publications" ADD CONSTRAINT "talk_publications_talk_id_talks_id_fkey" FOREIGN KEY ("talk_id") REFERENCES "talks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "talk_publications" ADD CONSTRAINT "talk_publications_publication_id_publications_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "talk_research_themes" ADD CONSTRAINT "talk_research_themes_talk_id_talks_id_fkey" FOREIGN KEY ("talk_id") REFERENCES "talks"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "talk_research_themes" ADD CONSTRAINT "talk_research_themes_theme_id_research_themes_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "research_themes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_logo_media_id_media_id_fkey" FOREIGN KEY ("logo_media_id") REFERENCES "media"("id") ON DELETE SET NULL;