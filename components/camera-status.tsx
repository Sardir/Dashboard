"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, CameraOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { CameraConfig } from "@/lib/sites-config"

interface CameraStatusProps {
  siteId: string
  siteName: string
}

export function CameraStatus({ siteId, siteName }: CameraStatusProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [siteStatus, setSiteStatus] = useState<"online" | "offline" | "unknown">("unknown")
  const [cameras, setCameras] = useState<(CameraConfig & { status: "online" | "offline" | "unknown" })[]>([])
  const [activeTab, setActiveTab] = useState("all")

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/site-status?siteId=${siteId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`)
      }

      const data = await response.json()
      setSiteStatus(data.status)
      setCameras(data.cameras)
    } catch (err) {
      console.error("Error fetching camera status:", err)
      setError("Failed to fetch camera status. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()

    // Refresh status every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [siteId])

  const onlineCameras = cameras.filter((cam) => cam.status === "online")
  const offlineCameras = cameras.filter((cam) => cam.status === "offline")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "offline":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getCameraTypeIcon = (type: string) => {
    switch (type) {
      case "ptz":
        return "🔄"
      case "outdoor":
        return "🏢"
      case "indoor":
        return "🏠"
      default:
        return "📷"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Camera Status</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(siteStatus)}>
            {siteStatus === "online" ? "Site Online" : "Site Offline"}
          </Badge>
          <Button variant="outline" size="icon" onClick={fetchStatus} disabled={loading} title="Refresh Status">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-600" />
                <span className="font-medium">{onlineCameras.length} Online</span>
              </div>
              <div className="flex items-center gap-2">
                <CameraOff className="h-5 w-5 text-red-600" />
                <span className="font-medium">{offlineCameras.length} Offline</span>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({cameras.length})</TabsTrigger>
                <TabsTrigger value="online">Online ({onlineCameras.length})</TabsTrigger>
                <TabsTrigger value="offline">Offline ({offlineCameras.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {renderCameraList(cameras, loading)}
              </TabsContent>

              <TabsContent value="online" className="mt-4">
                {onlineCameras.length > 0 ? (
                  renderCameraList(onlineCameras, loading)
                ) : (
                  <p className="text-center text-muted-foreground py-4">No online cameras</p>
                )}
              </TabsContent>

              <TabsContent value="offline" className="mt-4">
                {offlineCameras.length > 0 ? (
                  renderCameraList(offlineCameras, loading)
                ) : (
                  <p className="text-center text-muted-foreground py-4">No offline cameras</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function renderCameraList(cameras: (CameraConfig & { status: "online" | "offline" | "unknown" })[], loading: boolean) {
  const getCameraTypeIcon = (type: string) => {
    switch (type) {
      case "ptz":
        return "🔄"
      case "outdoor":
        return "🏢"
      case "indoor":
        return "🏠"
      default:
        return "📷"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "offline":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cameras.map((camera) => (
        <div key={camera.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
              {getCameraTypeIcon(camera.type)}
            </div>
            <div>
              <p className="font-medium">{camera.name}</p>
              <p className="text-xs text-muted-foreground">{camera.location}</p>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(camera.status)}>
            {camera.status}
          </Badge>
        </div>
      ))}
    </div>
  )
}

