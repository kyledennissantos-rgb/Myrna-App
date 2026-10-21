const apiBaseUrl = import.meta.env.VITE_API_URL || ''

async function request(path, accessToken, options = {}) {
  if (import.meta.env.PROD && !apiBaseUrl) {
    throw new Error('The allocation API is not configured for this published website yet.')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const responseBody = response.status === 204 ? '' : await response.text()
  let result = null

  if (responseBody) {
    try {
      result = JSON.parse(responseBody)
    } catch {
      result = { error: responseBody }
    }
  }

  if (!response.ok) {
    throw new Error(
      result?.error || `Request failed with status ${response.status}.`,
    )
  }

  return result
}

export function getAllocations(accessToken) {
  return request('/api/allocations', accessToken)
}

export function createAllocation(accessToken, allocation) {
  return request('/api/allocations', accessToken, {
    method: 'POST',
    body: JSON.stringify(allocation),
  })
}

export function deleteAllocation(accessToken, allocationId) {
  return request(`/api/allocations/${encodeURIComponent(allocationId)}`, accessToken, {
    method: 'DELETE',
  })
}
