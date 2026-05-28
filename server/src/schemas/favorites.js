const { z } = require("zod");

const addFavoriteSchema = z.object({
  body: z.object({
    eventId: z.string().uuid()
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

module.exports = {
  addFavoriteSchema
};
