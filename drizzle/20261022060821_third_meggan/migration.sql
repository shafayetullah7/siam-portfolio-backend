CREATE TABLE "publication_authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"publication_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"name" varchar(200) NOT NULL,
	"affiliation" varchar(500),
	"orcid" varchar(50)
);
--> statement-breakpoint
CREATE INDEX "publication_authors_publication_sort_idx" ON "publication_authors" ("publication_id","sort_order");--> statement-breakpoint
ALTER TABLE "publication_authors" ADD CONSTRAINT "publication_authors_publication_id_publications_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE;--> statement-breakpoint
INSERT INTO "publication_authors" ("publication_id", "sort_order", "name")
SELECT "id", 0, "authors_short"
FROM "publications"
WHERE trim("authors_short") <> '';