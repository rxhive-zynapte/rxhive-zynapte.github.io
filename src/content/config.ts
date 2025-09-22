import { z, defineCollection } from 'astro:content';

const compositionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  is_banned: z.boolean().optional().default(false),
  lastModified: z.string().optional(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
});

const combinationSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  is_banned: z.boolean().optional().default(false),
  lastModified: z.string().optional(),
  ingredients: z
    .array(z.object({ generic_slug: z.string(), strength: z.string().optional() }))
    .optional(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
});

const medicineSchema = z
  .object({
    title: z.string(),
    type: z.enum(['single', 'combination']).optional().default('single'),
    generic_slug: z.string().optional(),
    combination_slug: z.string().optional(),
    company: z.string().optional(),
    strength: z.string().optional(),
    pack_size: z.string().optional(),
    mrp: z.number().optional(),
    lastModified: z.string().optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'single' && !val.generic_slug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'generic_slug required for single type' });
    }
    if (val.type === 'combination' && !val.combination_slug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'combination_slug required for combination type' });
    }
  });

export const collections = {
  compositions: defineCollection({ schema: compositionSchema }),
  combinations: defineCollection({ schema: combinationSchema }),
  medicines: defineCollection({ schema: medicineSchema }),
};
