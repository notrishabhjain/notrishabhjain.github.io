import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

const caseStudies = defineCollection({
  // Case studies live in /content so they stay readable and reviewable as plain
  // Markdown, outside the src tree.
  loader: glob({ pattern: '**/*.md', base: './content/case-studies' }),
  schema: z.object({
    title: z.string(),
    short: z.string(),
    client: z.string(),
    via: z.string().optional(),
    role: z.string(),
    period: z.string(),
    status: z.string(),
    outcome: z.string(),
    order: z.number(),
    stack: z.array(z.string()).optional(),
    compliance: z.array(z.string()).optional(),
  }),
});

export const collections = { caseStudies };
