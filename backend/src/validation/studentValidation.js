const { z } = require('zod');

const phone = z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,19}$/, 'Invalid phone number');
const optionalText = z.string().trim().max(255).optional().or(z.literal(''));

const studentFields = {
  admission_number: z.string().trim().min(1).max(50),
  roll_number: optionalText,
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  gender: z.enum(['male', 'female', 'other']),
  dob: z.string().date(),
  blood_group: optionalText,
  email: z.string().trim().email(),
  phone,
  parent_phone: phone.optional().or(z.literal('')),
  address: z.string().trim().max(2000).optional().or(z.literal('')),
  city: optionalText,
  state: optionalText,
  country: optionalText,
  pincode: optionalText,
  class_id: z.string().trim().min(1).max(100),
  batch_id: z.string().uuid().optional().or(z.literal('')),
};

exports.createStudentSchema = z.object({
  ...studentFields,
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dot, underscore, or hyphen'),
  temporary_password: z.string().min(8).max(128).optional(),
});

exports.updateStudentSchema = z.object({ ...studentFields, username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/).optional() }).partial();
exports.statusSchema = z.object({ status: z.enum(['active', 'inactive']) });
exports.listStudentsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  classId: z.string().trim().max(100).optional(),
  batchId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'deleted']).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().refine(v => [10, 25, 50, 100].includes(v), 'pageSize must be 10, 25, 50, or 100').default(10),
  sortBy: z.enum(['admission_number', 'first_name', 'last_name', 'created_at', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
