CREATE TABLE `alerts` (
  `id` text PRIMARY KEY NOT NULL,
  `symbol` text NOT NULL,
  `condition` text NOT NULL,
  `threshold` text NOT NULL,
  `active` integer DEFAULT true,
  `triggered_at` integer,
  `created_at` integer
);

CREATE TABLE `positions` (
  `id` text PRIMARY KEY NOT NULL,
  `symbol` text NOT NULL,
  `asset_type` text NOT NULL,
  `quantity` text NOT NULL,
  `avg_cost` text NOT NULL,
  `currency` text DEFAULT 'USD',
  `created_at` integer,
  `updated_at` integer
);

CREATE TABLE `trades` (
  `id` text PRIMARY KEY NOT NULL,
  `position_id` text,
  `symbol` text NOT NULL,
  `side` text NOT NULL,
  `quantity` text NOT NULL,
  `price` text NOT NULL,
  `fee` text DEFAULT '0',
  `currency` text DEFAULT 'USD',
  `fx_rate_to_usd` text DEFAULT '1',
  `executed_at` integer NOT NULL,
  `created_at` integer,
  FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE no action ON DELETE no action
);
