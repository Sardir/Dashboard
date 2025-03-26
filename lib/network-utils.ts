/**
 * Network utility functions for checking connectivity
 */

// Function to check if a host is reachable
export async function isHostReachable(host: string, timeout = 3000): Promise<boolean> {
  try {
    // For server-side use
    if (typeof window === "undefined") {
      // We'll use a simple HTTP request to check if the host is reachable
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        // Try to connect to the host with a short timeout
        const response = await fetch(`http://${host}`, {
          method: "HEAD",
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return response.ok
      } catch (error) {
        clearTimeout(timeoutId)
        return false
      }
    }
    // For client-side use
    else {
      return new Promise((resolve) => {
        const img = new Image()

        // Set a timeout to consider the host unreachable
        const timer = setTimeout(() => {
          img.onload = img.onerror = null
          resolve(false)
        }, timeout)

        img.onload = () => {
          clearTimeout(timer)
          resolve(true)
        }

        img.onerror = () => {
          clearTimeout(timer)
          resolve(false)
        }

        // Try to load a favicon or any small resource from the host
        img.src = `http://${host}/favicon.ico?t=${new Date().getTime()}`
      })
    }
  } catch (error) {
    console.error("Error checking host reachability:", error)
    return false
  }
}

// Function to check multiple hosts
export async function checkHostsStatus(hosts: Record<string, string>): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}

  const checks = Object.entries(hosts).map(async ([id, host]) => {
    results[id] = await isHostReachable(host)
  })

  await Promise.all(checks)
  return results
}

