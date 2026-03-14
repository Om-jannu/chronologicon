const { z } = require("zod")

const eventSchema = z.object({

  eventId: z.uuid(),

  eventName: z.string().min(1),

  startDate: z.iso.datetime(),

  endDate: z.iso.datetime(),

  parentId: z.uuid().nullable(),

  researchValue: z.string(),

  description: z.string()

})

module.exports = { eventSchema }