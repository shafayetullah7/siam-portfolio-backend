CREATE TYPE "evaluation_maturity" AS ENUM('verified', 'provisional', 'experimental');--> statement-breakpoint
CREATE TYPE "project_status" AS ENUM('ongoing', 'completed', 'maintained', 'archived');--> statement-breakpoint
CREATE TYPE "project_type" AS ENUM('research_prototype', 'production', 'open_source', 'coursework', 'competition', 'other');--> statement-breakpoint
CREATE TYPE "project_section_kind" AS ENUM('problem', 'context', 'responsibilities', 'solution', 'data_methods', 'evaluation', 'results', 'limitations', 'future_work', 'custom');--> statement-breakpoint
CREATE TYPE "project_resource_type" AS ENUM('repo', 'demo', 'paper', 'dataset', 'model_card', 'documentation', 'video', 'other');--> statement-breakpoint
CREATE TABLE "project_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"kind" "project_section_kind" DEFAULT 'custom'::"project_section_kind" NOT NULL,
	"title" varchar(300),
	"body" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"resource_type" "project_resource_type" DEFAULT 'other'::"project_resource_type" NOT NULL,
	"label" varchar(200) NOT NULL,
	"url" varchar(2000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"name" varchar(300) NOT NULL,
	"value" varchar(200) NOT NULL,
	"unit" varchar(100),
	"baseline" varchar(200),
	"notes" text,
	"caption" text
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_type" "project_type" DEFAULT 'other'::"project_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_status" "project_status" DEFAULT 'completed'::"project_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "evaluation_maturity" "evaluation_maturity" DEFAULT 'provisional'::"evaluation_maturity" NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "owner_role" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "owner_contribution" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "result_teaser" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "period_start" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "period_end" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_media_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "featured_on_home" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "seo_title" varchar(500);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "hide_from_search" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "project_sections_project_sort_idx" ON "project_sections" ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX "project_resources_project_sort_idx" ON "project_resources" ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX "project_metrics_project_sort_idx" ON "project_metrics" ("project_id","sort_order");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_media_id_media_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "project_sections" ADD CONSTRAINT "project_sections_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_resources" ADD CONSTRAINT "project_resources_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_metrics" ADD CONSTRAINT "project_metrics_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;