CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`itinerary_id` text NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `movements` ADD `is_continuous_fare` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `movements` ADD `ticket_id` text REFERENCES tickets(id);