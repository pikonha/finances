CREATE TYPE "public"."rec_interval" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."tx_type" AS ENUM('earn', 'expend');--> statement-breakpoint
CREATE TABLE "card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text DEFAULT 'default-user' NOT NULL,
	"name" text NOT NULL,
	"limit" integer
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text DEFAULT 'default-user' NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text DEFAULT 'default-user' NOT NULL,
	"card_id" uuid NOT NULL,
	"total_amount" integer NOT NULL,
	"count" integer NOT NULL,
	"start_date" date NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "recurrence_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text DEFAULT 'default-user' NOT NULL,
	"amount" integer NOT NULL,
	"type" "tx_type" NOT NULL,
	"interval" "rec_interval" NOT NULL,
	"next_run" date NOT NULL,
	"category_id" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text DEFAULT 'default-user' NOT NULL,
	"type" "tx_type" NOT NULL,
	"amount" integer NOT NULL,
	"date" date NOT NULL,
	"category_id" uuid,
	"card_id" uuid,
	"installment_plan_id" uuid,
	"recurrence_rule_id" uuid,
	"period_key" text,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_recurrence_period" UNIQUE("recurrence_rule_id","period_key")
);
--> statement-breakpoint
ALTER TABLE "installment_plan" ADD CONSTRAINT "installment_plan_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrence_rule" ADD CONSTRAINT "recurrence_rule_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_card_id_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."card"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_installment_plan_id_installment_plan_id_fk" FOREIGN KEY ("installment_plan_id") REFERENCES "public"."installment_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_recurrence_rule_id_recurrence_rule_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rule"("id") ON DELETE cascade ON UPDATE no action;