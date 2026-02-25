import { z } from 'zod';

export const languageSchema = z.object({
    en: z.string().min(1, "English name is required"),
    bn: z.string().min(1, "Bengali name is required"),
});

export const categorySchema = z.object({
    id: z.string(),
    category: languageSchema,
    commissionRate: z.number().min(0).max(100),
    isActive: z.boolean(),
    icon: z.string().optional(),
    subCategories: z.array(z.object({
        id: z.string(),
        name: languageSchema,
        value: z.string(),
        isActive: z.boolean().optional(),
    })),
    order: z.number(),
});

export const homepageSectionSchema = z.object({
    id: z.string(),
    title: languageSchema,
    targetCategoryId: z.string(),
    priority: z.number(),
    isActive: z.boolean(),
    displayLimit: z.number().min(1).max(20).optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type HomepageSectionInput = z.infer<typeof homepageSectionSchema>;
