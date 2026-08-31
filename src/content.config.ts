import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/case-studies' }),
  schema: z.object({
    title: z.string(),
    short: z.string(),
    client: z.string(),
    via: z.string().optional(),
    role: z.string(),
    period: z.string(),
    status: z.string(),
    live: z.boolean().default(false),
    outcome: z.string(),
    order: z.number(),
    /** Headline figure for the work index row. */
    metric: z.object({ figure: z.string(), label: z.string() }),
    /** What changed, pulled out of the prose so it can be scanned. */
    results: z.array(z.object({ v: z.string(), l: z.string() })).default([]),
    /** The calls he personally made, and why. */
    decisions: z.array(z.object({ what: z.string(), why: z.string() })).default([]),
    diagram: z.enum(['parallel-approval', 'certificate-versioning', 'estate-turnaround']).optional(),
    stack: z.array(z.string()).optional(),
    compliance: z.array(z.string()).optional(),
  }),
});

export const collections = { caseStudies };
