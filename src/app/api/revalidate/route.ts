import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import envConfig from '@/config'

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag')
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== envConfig.REVALIDATION_SECRET) {
    return Response.json({ message: 'Invalid revalidation secret' }, { status: 401 })
  }
  if (!tag) {
    return Response.json({ message: 'Missing tag parameter' }, { status: 400 })
  }
  revalidateTag(tag, { expire: 0 })
  return Response.json({ revalidated: true, now: Date.now() })
}
