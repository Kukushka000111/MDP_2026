const { z } = require("zod");

const eventType = z.enum(["OFFICIAL", "COMMUNITY"]);
const moderationStatus = z.enum(["PENDING", "NEEDS_EDIT", "APPROVED", "REJECTED"]);
const MAX_IMAGE_URL_LENGTH = 5000000;

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

const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(160),
    description: z.string().max(3000).optional().default(""),
    categoryId: z.string().uuid(),
    districtId: z.string().uuid(),
    address: z.string().min(3).max(220),
    imageUrl: z
      .string()
      .max(MAX_IMAGE_URL_LENGTH)
      .optional()
      .default("")
      .refine(
        (value) => value === "" || isHttpUrl(value) || isDataImageUrl(value),
        "imageUrl must be http(s) URL, data:image base64 URL, or empty"
      ),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    organizerName: z.string().min(2).max(120),
    organizerContact: z.string().max(320).optional().default(""),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    eventType
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const listEventsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    q: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    districtId: z.string().uuid().optional(),
    type: eventType.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional()
  }),
  params: z.object({}).optional()
});

const listModerationQueueSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    status: moderationStatus.optional()
  }),
  params: z.object({}).optional()
});

const moderateEventSchema = z.object({
  body: z.object({
    status: z.enum(["NEEDS_EDIT", "APPROVED", "REJECTED"]),
    moderationComment: z.string().max(2000).optional().default("")
  }),
  query: z.object({}).optional(),
  params: z.object({
    eventId: z.string().uuid()
  })
});

module.exports = {
  createEventSchema,
  listEventsSchema,
  listModerationQueueSchema,
  moderateEventSchema
};
