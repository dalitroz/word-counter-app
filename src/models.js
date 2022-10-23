import * as z from 'zod'

export const countWordsRequestSchema = z.object({
  inputType: z.enum(['string', 'url', 'file']),
  input: z.string(),
})

/** @typedef {z.infer<typeof countWordsRequestSchema>} countWordsRequest */
