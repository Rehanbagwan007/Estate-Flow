import { z } from 'zod';
import { PROPERTY_STATUSES, LEAD_STATUSES } from '@/lib/constants';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const propertySchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zip_code: z.string().min(5, 'Zip code is required'),
    price: z.coerce.number().positive('Price must be a positive number'),
    bedrooms: z.coerce.number().int().min(0, 'Bedrooms cannot be negative'),
    bathrooms: z.coerce.number().min(0, 'Bathrooms cannot be negative'),
    area_sqft: z.coerce.number().int().positive('Area must be a positive number'),
    status: z.enum(PROPERTY_STATUSES),
    files: z.any().optional(), // For handling file uploads in the form
});

export const leadSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone number seems too short').optional(),
    status: z.enum(LEAD_STATUSES),
    assigned_to: z.string().uuid().optional().nullable(),
});

export const taskSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().optional(),
  due_date: z.date().optional(),
  assigned_to: z.string().uuid('Please select an agent'),
  related_lead_id: z.string().uuid().optional().nullable(),
  related_property_id: z.string().uuid().optional().nullable(),
});
