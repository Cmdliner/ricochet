ALTER TABLE "activity" ADD COLUMN "response" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "dm_key" text;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "one_chat_per_pair" ON "conversations" USING btree ("dm_key") WHERE "conversations"."dm_key" is not null;