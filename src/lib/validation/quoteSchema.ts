import { z } from 'zod';

export const quoteStep1Schema = z.object({
    origin: z.string().min(2, "Origin is required"),
    destination: z.string().min(2, "Destination is required"),
    serviceType: z.string(),
    cargoType: z.string(),
    urgency: z.string(),
});

export const quoteStep2Schema = z.object({
    weight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: "Weight must be a positive number",
    }),
    dimensions: z.object({
        length: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Length required"),
        width: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Width required"),
        height: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Height required"),
    }),
    value: z.string().optional(), // Value might be optional for a quote
    incoterms: z.string(),
});

export const quoteStep3Schema = z.object({
    contactInfo: z.object({
        name: z.string().min(2, "Full Name is required"),
        email: z.string().email("Invalid email address"),
        phone: z.string().optional(),
        company: z.string().optional(),
    }),
});

// Combined schema for final submission if needed
export const quoteFormSchema = quoteStep1Schema
    .merge(quoteStep2Schema)
    .merge(quoteStep3Schema);
