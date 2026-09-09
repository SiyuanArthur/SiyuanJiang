CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`date` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
