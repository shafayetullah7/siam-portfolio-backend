CREATE TYPE "publication_supplement_kind" AS ENUM('code', 'data', 'slides', 'poster', 'demo', 'repository', 'other');--> statement-breakpoint
CREATE TABLE "publication_supplements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"publication_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" varchar(200) NOT NULL,
	"url" varchar(2000) NOT NULL,
	"kind" "publication_supplement_kind" DEFAULT 'other'::"publication_supplement_kind" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "pdf_media_id" uuid;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "open_access" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "pdf_rights_granted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "publication_supplements_publication_sort_idx" ON "publication_supplements" ("publication_id","sort_order");--> statement-breakpoint
ALTER TABLE "publications" ADD CONSTRAINT "publications_pdf_media_id_media_id_fkey" FOREIGN KEY ("pdf_media_id") REFERENCES "media"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "publication_supplements" ADD CONSTRAINT "publication_supplements_publication_id_publications_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE;