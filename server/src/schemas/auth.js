const { z } = require("zod");
const {
  validatePersonName,
  validatePassword,
  validateLogin
} = require("../utils/user-validation");

const genderEnum = z.enum(["MALE", "FEMALE"], { errorMap: () => ({ message: "Укажите пол" }) });

const registerSchema = z
  .object({
    body: z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email("Укажите корректный email"),
      login: z.string().min(1),
      password: z.string().min(1),
      passwordConfirm: z.string().min(1),
      acceptRules: z.boolean(),
      ageStatus: z.enum(["adult", "minor"]),
      gender: genderEnum,
      captchaId: z.string().uuid("Пройдите проверку капчи"),
      captchaAnswer: z.union([z.string(), z.number()])
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

    const loginErr = validateLogin(b.login);
    if (loginErr) ctx.addIssue({ code: z.ZodIssueCode.custom, message: loginErr, path: ["body", "login"] });

    const passErr = validatePassword(b.password);
    if (passErr) ctx.addIssue({ code: z.ZodIssueCode.custom, message: passErr, path: ["body", "password"] });

    if (b.password !== b.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Пароли не совпадают",
        path: ["body", "passwordConfirm"]
      });
    }
    if (!b.acceptRules) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Необходимо принять правила",
        path: ["body", "acceptRules"]
      });
    }
    if (b.ageStatus !== "adult") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Регистрация доступна с 18 лет",
        path: ["body", "ageStatus"]
      });
    }
  });

const loginSchema = z.object({
  body: z.object({
    login: z.string().min(1, "Введите логин"),
    password: z.string().min(1, "Введите пароль")
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const checkAvailabilitySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    field: z.enum(["email", "login"]),
    value: z.string().min(1)
  }),
  params: z.object({}).optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  checkAvailabilitySchema
};
