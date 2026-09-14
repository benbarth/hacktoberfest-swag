import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const season = new Date().getUTCFullYear();
const reward = z.enum([
  "glasses",
  "laptop",
  "mask",
  "mug",
  "other",
  "plant",
  "shirt",
  "socks",
  "stickers",
  "swag",
]);

const opportunities = defineCollection({
  loader: glob({
    base: "./participants",
    pattern: `${season}/*.yml`,
  }),
  schema: z.object({
    Name: z.string().min(2).max(100),
    Website: z.url({ protocol: /^https$/u }),
    Swag: z.array(reward).min(1),
    Description: z.string().min(25).max(1000),
    Details: z.url({ protocol: /^https$/u }),
  }),
});

export const collections = { opportunities };
