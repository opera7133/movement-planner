CREATE TABLE `itineraries` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itinerary_id` text NOT NULL,
	`day` integer NOT NULL,
	`display_order` integer NOT NULL,
	`departure_point` text NOT NULL,
	`departure_time` text NOT NULL,
	`travel_method` text NOT NULL,
	`line_name` text,
	`arrival_time` text NOT NULL,
	`arrival_point` text NOT NULL,
	`fare` integer,
	`notes` text,
	FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries`(`id`) ON UPDATE no action ON DELETE cascade
);
