"use client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { sitesList } from "@/lib/sites-config"
import { useSiteContext } from "@/components/site-provider"
import { Activity, AlertTriangle, Building2, Zap, Thermometer, Wifi } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useMqttContext } from "@/components/mqtt-provider"
import { useEffect, useState } from "react"

export function SiteGrid() {
  const { siteAlerts, getSiteStatus, siteData } = useSiteContext()
  const { mqttData } = useMqttContext()
  const [siteMetrics, setSiteMetrics] = useState<Record<string, any>>({})

  // Collect critical metrics for each site
  useEffect(() => {
    const metrics: Record<string, any> = {}

    sitesList.forEach((site) => {
      if (!siteData) return

      // Get power data
      const totalPowerTopic = siteData.neutralTopics.find((t) => t.includes("Total Active Power"))
      const totalPower = totalPowerTopic ? Number.parseFloat(mqttData[totalPowerTopic] || "0") / 1000 : 0

      // Get temperature data
      const tempTopic = siteData.tempTopics[1] // Mining room temperature
      const temperature = tempTopic ? Number.parseFloat(mqttData[tempTopic] || "0") : 0

      // Get humidity data
      const humTopic = siteData.humTopics[1] // Mining room humidity
      const humidity = humTopic ? Number.parseFloat(mqttData[humTopic] || "0") : 0

      // Get network status
      const networkTopic = siteData.networkTopics[0]
      const networkStatus = networkTopic
        ? mqttData[networkTopic] === "1" ||
          mqttData[networkTopic]?.toLowerCase() === "true" ||
          mqttData[networkTopic]?.toLowerCase() === "online"
        : false

      metrics[site.name] = {
        power: totalPower,
        temperature,
        humidity,
        networkStatus,
      }
    })

    setSiteMetrics(metrics)
  }, [mqttData, siteData])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sitesList.map((site) => {
        const status = getSiteStatus(site.name)
        const alertCount = siteAlerts[site.name] || 0
        const metrics = siteMetrics[site.name] || {}

        return (
          <Link href={`/site/${site.id}`} key={site.id}>
            <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {site.name}
                    </CardTitle>
                    <CardDescription>
                      {site.status === "development" ? "Under Development" : "Active Monitoring"}
                    </CardDescription>
                  </div>

                  {site.status !== "development" && <StatusBadge status={status} alertCount={alertCount} />}
                </div>
              </CardHeader>
              <CardContent>
                {site.status === "development" ? (
                  <div className="bg-amber-50 text-amber-800 p-3 rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="text-sm">Site is under development</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Critical Metrics */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* Power Metric */}
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <p className="text-xs font-medium">Power</p>
                          </div>
                          <span className="text-sm font-semibold">{metrics.power?.toFixed(1) || "0"} kW</span>
                        </div>
                        <Progress
                          value={metrics.power ? Math.min((metrics.power / 100) * 100, 100) : 0}
                          className="h-1.5"
                          indicatorClassName={
                            metrics.power > 90 ? "bg-red-500" : metrics.power > 75 ? "bg-amber-500" : "bg-green-500"
                          }
                        />
                      </div>

                      {/* Temperature Metric */}
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-red-500" />
                            <p className="text-xs font-medium">Temperature</p>
                          </div>
                          <span className="text-sm font-semibold">{metrics.temperature?.toFixed(1) || "0"}°C</span>
                        </div>
                        <Progress
                          value={metrics.temperature ? Math.min((metrics.temperature / 50) * 100, 100) : 0}
                          className="h-1.5"
                          indicatorClassName={
                            metrics.temperature > 40
                              ? "bg-red-500"
                              : metrics.temperature > 35
                                ? "bg-amber-500"
                                : "bg-blue-500"
                          }
                        />
                      </div>

                      {/* Network Status */}
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-blue-500" />
                            <p className="text-xs font-medium">Network</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              metrics.networkStatus
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                            }
                          >
                            {metrics.networkStatus ? "Online" : "Offline"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        Live Data
                      </span>
                      <span>Last updated: just now</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function StatusBadge({ status, alertCount }: { status: string; alertCount: number }) {
  const getStatusConfig = () => {
    switch (status) {
      case "critical":
        return { bg: "bg-red-100", text: "text-red-800", label: "Critical" }
      case "warning":
        return { bg: "bg-amber-100", text: "text-amber-800", label: "Warning" }
      default:
        return { bg: "bg-green-100", text: "text-green-800", label: "Normal" }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge variant="outline" className={`${config.bg} ${config.text} hover:${config.bg}`}>
      {alertCount > 0 && (
        <span className="mr-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {alertCount}
        </span>
      )}
      {config.label}
    </Badge>
  )
}

