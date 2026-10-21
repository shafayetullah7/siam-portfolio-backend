CREATE TYPE "research_theme_resource_type" AS ENUM('code', 'data', 'demo', 'paper', 'other');--> statement-breakpoint
CREATE TABLE "research_theme_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"theme_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" varchar(200) NOT NULL,
	"url" varchar(500) NOT NULL,
	"resource_type" "research_theme_resource_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "research_theme_resources" ADD CONSTRAINT "research_theme_resources_theme_id_research_themes_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "research_themes"("id") ON DELETE CASCADE;