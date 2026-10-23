CREATE TABLE "project_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"publication_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_section_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"section_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "projects_hub_intro" text;--> statement-breakpoint
CREATE UNIQUE INDEX "project_publications_project_pub_unique" ON "project_publications" ("project_id","publication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_section_media_section_media_unique" ON "project_section_media" ("section_id","media_id");--> statement-breakpoint
ALTER TABLE "project_publications" ADD CONSTRAINT "project_publications_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_publications" ADD CONSTRAINT "project_publications_publication_id_publications_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_section_media" ADD CONSTRAINT "project_section_media_section_id_project_sections_id_fkey" FOREIGN KEY ("section_id") REFERENCES "project_sections"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "project_section_media" ADD CONSTRAINT "project_section_media_media_id_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE RESTRICT;