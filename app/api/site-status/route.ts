import { NextResponse } from "next/server"
import { isHostReachable } from "@/lib/network-utils"
import { sitesConfig } from "@/lib/sites-config"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get("siteId")

  try {
    // If a specific site ID is provided, check only that site
    if (siteId) {
      const site = Object.values(sitesConfig).find((site) => site.id === siteId)

      if (!site) {
        return NextResponse.json({ error: "Site not found" }, { status: 404 })
      }

      // Check site connectivity
      const siteStatus = await isHostReachable(site.ipAddress)

      // Check camera statuses
      const cameraStatuses = await Promise.all(
        site.cameras.map(async (camera) => {
          const isOnline = await isHostReachable(camera.ipAddress)
          return {
            ...camera,
            status: isOnline ? "online" : "offline",
          }
        }),
      )

      return NextResponse.json({
        id: site.id,
        name: site.name,
        status: siteStatus ? "online" : "offline",
        cameras: cameraStatuses,
      })
    }
    // Otherwise, check all sites (with a limit to avoid too many simultaneous connections)
    else {
      const results = []
      const sites = Object.values(sitesConfig)

      // Process sites in batches to avoid too many simultaneous connections
      const batchSize = 5
      for (let i = 0; i < sites.length; i += batchSize) {
        const batch = sites.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(async (site) => {
            // Check site connectivity
            const siteStatus = await isHostReachable(site.ipAddress)

            // Check camera statuses (only if site is online)
            const cameraStatuses = siteStatus
              ? await Promise.all(
                  site.cameras.map(async (camera) => {
                    const isOnline = await isHostReachable(camera.ipAddress)
                    return {
                      ...camera,
                      status: isOnline ? "online" : "offline",
                    }
                  }),
                )
              : site.cameras.map((camera) => ({ ...camera, status: "unknown" }))

            return {
              id: site.id,
              name: site.name,
              status: siteStatus ? "online" : "offline",
              cameras: cameraStatuses,
            }
          }),
        )

        results.push(...batchResults)
      }

      return NextResponse.json(results)
    }
  } catch (error) {
    console.error("Error checking site status:", error)
    return NextResponse.json(
      {
        error: "Failed to check site status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

