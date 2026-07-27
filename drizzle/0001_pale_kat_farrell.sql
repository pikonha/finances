ALTER TYPE "public"."tx_type" ADD VALUE 'transfer';--> statement-breakpoint
CREATE TABLE "fatura_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_id" uuid NOT NULL,
	"cycle_key" text NOT NULL,
	"paid_at" date NOT NULL,
	CONSTRAINT "uq_fatura_payment" UNIQUE("account_id","cycle_key")
);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "closing_day" integer;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "due_day" integer;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "prepaid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "counter_account_id" uuid;--> statement-breakpoint
ALTER TABLE "fatura_payment" ADD CONSTRAINT "fatura_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fatura_payment" ADD CONSTRAINT "fatura_payment_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_counter_account_id_account_id_fk" FOREIGN KEY ("counter_account_id") REFERENCES "public"."account"("id") ON DELETE set null ON UPDATE no action;