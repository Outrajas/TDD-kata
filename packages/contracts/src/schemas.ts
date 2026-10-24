import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

export const createVehicleSchema = z.object({
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(40),
  price: z.number().finite().positive().max(9_999_999_999).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7, 'Price must have at most two decimal places'),
  quantity: z.number().int().min(0).max(2_147_483_647),
});

export const updateVehicleSchema = z.object({
  make: z.string().trim().min(1).max(80).optional(),
  model: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(40).optional(),
  price: z.number().finite().positive().max(9_999_999_999).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7, 'Price must have at most two decimal places').optional(),
  quantity: z.number().int().min(0).max(2_147_483_647).optional(),
});

export const restockSchema = z.object({
  quantity: z.number().int().min(1).max(2_147_483_647)
});

export const vehicleIdSchema = z.object({
  id: z.string().uuid()
});

export const searchQuerySchema = z.object({
  make: z.string().trim().optional(),
  model: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().finite().min(0).optional(),
  maxPrice: z.coerce.number().finite().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).refine((data) => {
  if (data.minPrice !== undefined && data.maxPrice !== undefined) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, { message: "minPrice must be less than or equal to maxPrice", path: ["minPrice"] });
