CREATE TYPE "public"."avatar_color" AS ENUM('coral', 'sky', 'mint', 'amber');--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "is_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "hubs" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "hubs" ADD COLUMN "color" "avatar_color" DEFAULT 'coral' NOT NULL;--> statement-breakpoint
ALTER TABLE "hubs" ADD COLUMN "icon" text DEFAULT 'rocket' NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "mentions_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_color" "avatar_color" DEFAULT 'coral' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status_emoji" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status_text" text;--> statement-breakpoint
CREATE UNIQUE INDEX "pod_name_per_hub" ON "conversations" USING btree ("hub_id","name") WHERE "conversations"."type" = 'pod';