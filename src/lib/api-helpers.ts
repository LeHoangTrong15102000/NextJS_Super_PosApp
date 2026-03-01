import { ZodSchema } from 'zod'

/**
 * Create a typed JSON response.
 */
export function createApiResponse<T>(data: T, status: number = 200) {
  return Response.json(data, { status })
}

/**
 * Validate a request body against a Zod schema.
 * Returns the validated data or a 400 error response.
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: Response }> {
  try {
    const rawBody = await request.json()
    const result = schema.safeParse(rawBody)
    if (!result.success) {
      return {
        error: createApiResponse(
          { message: 'Invalid request body', errors: result.error.issues },
          400
        )
      }
    }
    return { data: result.data }
  } catch {
    return {
      error: createApiResponse({ message: 'Invalid JSON body' }, 400)
    }
  }
}

/**
 * Wrap an API route handler with consistent error handling.
 */
export function withErrorHandler(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    try {
      return await handler(request)
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('API route error:', error)
      }
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra'
      const status = (error as { status?: number }).status ?? 500
      return createApiResponse({ message }, status)
    }
  }
}

