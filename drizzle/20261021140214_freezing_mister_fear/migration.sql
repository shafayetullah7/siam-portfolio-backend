CREATE TABLE "publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(200) NOT NULL UNIQUE,
	"title" varchar(500) NOT NULL,
	"authors_short" varchar(300) NOT NULL,
	"year" integer NOT NULL,
	"venue" varchar(300) NOT NULL,
	"significance" text,
	"publish_status" "publish_status" DEFAULT 'draft'::"publish_status" NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_theme_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"theme_id" uuid NOT NULL,
	"publication_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "research_theme_publications_theme_pub_unique" ON "research_theme_publications" ("theme_id","publication_id");--> statement-breakpoint
ALTER TABLE "research_theme_publications" ADD CONSTRAINT "research_theme_publications_theme_id_research_themes_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "research_themes"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "research_theme_publications" ADD CONSTRAINT "research_theme_publications_publication_id_publications_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE;