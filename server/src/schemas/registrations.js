const { z } = require("zod");

const attendEventSchema = z.object({
  body: z.object({
    message: z.string().max(500).optional().default("")
  }),
  query: z.object({}).optional(),
  params: z.object({
    eventId: z.string().uuid()
  })
});

const reviewRegistrationSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"])
  }),
  query: z.object({}).optional(),
  params: z.object({
    eventId: z.string().uuid(),
    userId: z.string().uuid()
  })
});

module.exports = {
  attendEventSchema,
  reviewRegistrationSchema
};
