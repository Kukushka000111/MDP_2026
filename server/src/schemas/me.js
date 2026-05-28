const { z } = require("zod");
const { validatePersonName } = require("../utils/user-validation");

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_error) {
    return false;
  }
}

function isDataImageUrl(value) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

const updateProfileSchema = z
  .object({
    body: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().max(40).optional().default(""),
      avatarUrl: z
        .string()
        .max(5000000)
        .optional()
        .default("")
        .refine(
          (value) => value === "" || isHttpUrl(value) || isDataImageUrl(value),
          "Некорректная ссылка на фото"
        ),
      vkUrl: z.string().max(200).optional().default(""),
      telegram: z.string().max(120).optional().default(""),
      bio: z.string().max(500).optional().default("")
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional()
  })
  .superRefine((data, ctx) => {
    const b = data.body;
    const firstErr = validatePersonName(b.firstName, "Имя");
    if (firstErr) ctx.addIssue({ code: z.ZodIssueCode.custom, message: firstErr, path: ["body", "firstName"] });

    const lastErr = validatePersonName(b.lastName, "Фамилия");
    if (lastErr) ctx.addIssue({ code: z.ZodIssueCode.custom, message: lastErr, path: ["body", "lastName"] });
  });

module.exports = {
  updateProfileSchema
};
