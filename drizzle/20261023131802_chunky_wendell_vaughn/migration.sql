CREATE TABLE "writing_article_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"article_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_article_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"article_id" uuid NOT NULL,
	"publication_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_article_related" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"article_id" uuid NOT NULL,
	"related_article_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_article_research_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"article_id" uuid NOT NULL,
	"theme_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "writing_hub_intro" text;--> statement-breakpoint
CREATE UNIQUE INDEX "writing_article_projects_unique" ON "writing_article_projects" ("article_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "writing_article_publications_unique" ON "writing_article_publications" ("article_id","publication_id");--> statement-breakpoint
CREATE UNIQUE INDEX "writing_article_related_unique" ON "writing_article_related" ("article_id","related_article_id");--> statement-breakpoint
CREATE UNIQUE INDEX "writing_article_research_themes_unique" ON "writing_article_research_themes" ("article_id","theme_id");--> statement-breakpoint
ALTER TABLE "writing_article_projects" ADD CONSTRAINT "writing_article_projects_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "writing_article_projects" ADD CONSTRAINT "writing_article_projects_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "writing_article_publications" ADD CONSTRAINT "writing_article_publications_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "writing_article_publications" ADD CONSTRAINT "writing_article_publications_ESEk563FiBTE_fkey" FOREIGN KEY ("publication_id") REFERENCES "publications"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "writing_article_related" ADD CONSTRAINT "writing_article_related_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "writing_article_related" ADD CONSTRAINT "writing_article_related_related_article_id_articles_id_fkey" FOREIGN KEY ("related_article_id") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "writing_article_research_themes" ADD CONSTRAINT "writing_article_research_themes_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "writing_article_research_themes" ADD CONSTRAINT "writing_article_research_themes_RfcdMTgvQwmJ_fkey" FOREIGN KEY ("theme_id") REFERENCES "research_themes"("id") ON DELETE CASCADE;