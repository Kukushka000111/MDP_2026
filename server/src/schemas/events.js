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

const eventBodySchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(3000).optional().default(""),
  categoryId: z.string().uuid(),
  address: z.string().min(3).max(220),
  addressPublic: z.boolean().optional().default(false),
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
  organizerName: z.string().max(120).optional(),
  organizerContact: z.string().max(320).optional().default(""),
  organizerPhone: z.string().max(40).optional().default(""),
  organizerTelegram: z.string().max(120).optional().default(""),
  organizerVk: z.string().max(200).optional().default(""),
  maxParticipants: z.number().int().min(1).max(10000).nullable().optional().default(null),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  eventType
}).superRefine((data, ctx) => {
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(data.endsAt);
  if (startsAt > endsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Дата окончания должна быть не раньше даты начала",
      path: ["endsAt"]
    });
  }
  const addressParts = data.address.split(",").map((part) => part.trim()).filter(Boolean);
  if (addressParts.length < 2 || !/\d/.test(data.address)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Укажите адрес: город, улица и номер дома",
      path: ["address"]
    });
  }
  const hasLat = data.latitude != null && Number.isFinite(data.latitude);
  const hasLng = data.longitude != null && Number.isFinite(data.longitude);
  if (!hasLat || !hasLng) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Укажите точку на карте",
      path: ["latitude"]
    });
  }
});

const reportEventSchema = z.object({
  body: z.object({
    reason: z.string().max(1000).optional().default("")
  }),
  query: z.object({}).optional(),
  params: z.object({
    eventId: z.string().uuid()
  })
});

const createEventSchema = z.object({
  body: eventBodySchema,
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

const updateEventSchema = z.object({
  body: eventBodySchema,
  query: z.object({}).optional(),
  params: z.object({
    eventId: z.string().uuid()
  })
});

const listEventsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    q: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    type: eventType.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10)
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
  updateEventSchema,
  listEventsSchema,
  listModerationQueueSchema,
  moderateEventSchema,
  reportEventSchema
};
