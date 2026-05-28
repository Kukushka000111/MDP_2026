const { z } = require("zod");

const createReviewSchema = z.object({
  body: z.object({
    eventId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    body: z.string().min(3).max(2000)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const listReviewsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}),
  params: z.object({
    eventId: z.string().uuid()
  })
});

module.exports = {
  createReviewSchema,
  listReviewsSchema
};
