"use client"

import { useState, useEffect } from "react"
import { Signal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { SiteType } from "@/lib/sites-config"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { isHostReachable } from "@/lib/network-utils"

interface NetworkStatusProps {
  siteData: SiteType
  mqttData: Record<string, string>
  expanded?: boolean
}

export function NetworkStatus({ siteData, mqttData, expanded = false }: NetworkStatusProps) {
  const [networkUptime, setNetworkUptime] = useState<number>(0)
  const [latency, setLatency] = useState<number>(0)
  const [bandwidth, setBandwidth] = useState<number>(0)
  const [status, setStatus] = useState<"Stable" | "Degraded" | "Critical">("Stable")
  const [networkData, setNetworkData] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const setNetworkStatus = (isOnline: boolean) => {
    if (isOnline) {
      setNetworkUptime(99.8)
      setLatency(12)
      setBandwidth(85)
      setStatus("Stable")
    } else {
      setNetworkUptime(0)
      setLatency(999)
      setBandwidth(0)
      setStatus("Critical")
    }
  }

  useEffect(() => {
    // Check network status using ping
    const checkNetworkStatus = async () => {
      if (!siteData.ipAddress) return

      try {
        const isOnline = await isHostReachable(siteData.ipAddress)
        setNetworkStatus(isOnline)
        setLastUpdated(new Date().toLocaleTimeString())

        // Determine status based on network connectivity
        if (isOnline) {
          // Generate network data for chart
          const data = []
          const now = new Date()

          for (let i = 0; i < 24; i++) {
            const time = new Date(now)
            time.setHours(now.getHours() - 23 + i)

            data.push({
              time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              latency: Math.floor(Math.random() * 10) + 8,
              bandwidth: Math.floor(Math.random() * 15) + 75,
            })
          }

          setNetworkData(data)
        } else {
          setNetworkData([])
        }
      } catch (error) {
        console.error("Error checking network status:", error)
        setNetworkStatus(false)
      }
    }

    // Initial check
    checkNetworkStatus()

    // Set up interval to check status periodically
    const interval = setInterval(checkNetworkStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [siteData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "text-red-500"
      case "Degraded":
        return "text-amber-500"
      default:
        return "text-green-500"
    }
  }

  return (
    <Card className={expanded ? "col-span-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Network Status</CardTitle>
        <Signal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{networkUptime}%</span>
            <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Network Uptime</p>
            <Progress value={networkUptime} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Latency</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{latency} ms</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bandwidth</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{bandwidth}%</span>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Network Diagnostics</h3>
              <div className="h-[300px]">
                {networkData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={networkData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        label={{ value: "Latency (ms)", angle: -90, position: "insideLeft" }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{ value: "Bandwidth (%)", angle: 90, position: "insideRight" }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#8884d8" name="Latency (ms)" />
                      <Line yAxisId="right" type="monotone" dataKey="bandwidth" stroke="#82ca9d" name="Bandwidth (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
                    <p className="text-red-500">Network offline - No data available</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Connection Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Primary Link:</span>
                      <span className={status === "Critical" ? "text-red-500" : "text-green-500"}>
                        {status === "Critical" ? "Offline" : "Active"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Backup Link:</span>
                      <span className="text-muted-foreground">Standby</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Outage:</span>
                      <span>{lastUpdated ? lastUpdated : "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Traffic Stats</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Download:</span>
                      <span>2.4 Mbps</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Upload:</span>
                      <span>1.2 Mbps</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Packet Loss:</span>
                      <span>0.02%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

