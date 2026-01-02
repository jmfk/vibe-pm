import { z } from 'zod';

export const RequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['P0', 'P1', 'P2']),
});

export const PersonaSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const ProductSchema = z.object({
  name: z.string(),
  version: z.string(),
  status: z.enum(['Discovery', 'Drafted', 'Completed']),
  vision: z.object({
    summary: z.string(),
    goals: z.array(z.string()),
  }),
  personas: z.array(PersonaSchema),
  requirements: z.object({
    functional: z.array(RequirementSchema),
    non_functional: z.array(RequirementSchema),
    ui_ux: z.array(RequirementSchema),
  }),
  technical_constraints: z.array(z.string()),
  success_metrics: z.array(z.string()),
});

export type Product = z.infer<typeof ProductSchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
export type Persona = z.infer<typeof PersonaSchema>;

