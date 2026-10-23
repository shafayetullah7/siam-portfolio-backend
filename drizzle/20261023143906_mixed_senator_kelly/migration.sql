CREATE TYPE "contact_message_status" AS ENUM('new', 'read', 'replied', 'archived', 'spam');--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"status" "contact_message_status" DEFAULT 'new'::"contact_message_status" NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"category" varchar(100),
	"sender_name" varchar(200) NOT NULL,
	"sender_email" varchar(320) NOT NULL,
	"affiliation" varchar(200),
	"subject" varchar(300),
	"body" text NOT NULL,
	"consent_given" boolean DEFAULT false NOT NULL,
	"consent_text_version" varchar(64),
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"replied_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"admin_notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_form_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_page_intro" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_collaboration_guidance" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_response_time_note" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_categories" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_consent_text" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_success_message" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_public_email" varchar(320);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "contact_show_email_on_page" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "contact_messages_status_idx" ON "contact_messages" ("status");--> statement-breakpoint
CREATE INDEX "contact_messages_is_read_idx" ON "contact_messages" ("is_read");--> statement-breakpoint
CREATE INDEX "contact_messages_submitted_at_idx" ON "contact_messages" ("submitted_at");