import type { paths } from 'api-types'
import createClient from 'openapi-fetch'
import { v4 as uuidv4 } from 'uuid'
import { API_URL } from '../constants'
import { getAccessToken } from '../userAuth'

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

const { GET: _get, POST: _post } = createClient<paths>({
  baseUrl: API_URL,
  referrerPolicy: 'no-referrer-when-downgrade',
  headers: DEFAULT_HEADERS,
})

export async function constructHeaders(
  headersInit?: HeadersInit | undefined,
  { allowUnauthenticated = false }: { allowUnauthenticated?: boolean } = {}
) {
  const requestId = uuidv4()
  const headers = new Headers(headersInit)

  headers.set('X-Request-Id', requestId)

  if (!headers.has('Authorization')) {
    const accessToken = await getAccessToken()
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    } else if (!allowUnauthenticated) {
      throw Error("can't fetch authenticated routes without signing in")
    }
  }

  return headers
}

export const get: typeof _get = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  return await _get(url, {
    ...init,
    headers,
  })
}

export const post: typeof _post = async (url, init) => {
  const headers = await constructHeaders(init?.headers)

  return await _post(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}

export const unauthedAllowedPost: typeof _post = async (url, init) => {
  const headers = await constructHeaders(init?.headers, { allowUnauthenticated: true })

  return await _post(url, {
    credentials: 'include',
    ...init,
    headers,
  })
}
