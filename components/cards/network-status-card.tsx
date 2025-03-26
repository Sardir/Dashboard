"use client"

import { useState, useEffect } from "react"
import { Signal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MqttClient } from "@/lib/mqtt-client"

interface NetworkStatusCardProps {
  mqttClient: MqttClient | null
  expanded?: boolean
}

export function NetworkStatusCard({ mqttClient, expanded = false }: NetworkStatusCardProps) {
  const [networkUptime, setNetworkUptime] = useState<number>(99.8)
  const [latency, setLatency] = useState<number>(12)
  const [bandwidth, setBandwidth] = useState<number>(85)
  const [status, setStatus] = useState<"Stable" | "Degraded" | "Critical">("Stable")

  useEffect(() => {
    if (!mqttClient) return

    // Subscribe to MQTT topics for network status
    const topics = [
      "Forest/Network", // Network status
    ]

    topics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        // Network status is typically 0 or 1, but we'll use it to derive other metrics
        const isOnline = message === "1" || message.toLowerCase() === "true" || message.toLowerCase() === "online"

        if (isOnline) {
          // Simulate network metrics
          setNetworkUptime(99.8)
          setLatency(Math.floor(Math.random() * 10) + 8) // 8-18ms
          setBandwidth(Math.floor(Math.random() * 15) + 75) // 75-90%
        } else {
          setNetworkUptime(0)
          setLatency(999)
          setBandwidth(0)
        }
      })
    })

    // Determine status based on network metrics
    const interval = setInterval(() => {
      if (latency > 50 || networkUptime < 95) {
        setStatus("Critical")
      } else if (latency > 20 || networkUptime < 99) {
        setStatus("Degraded")
      } else {
        setStatus("Stable")
      }
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [mqttClient, latency, networkUptime])

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
              <div className="h-[200px] bg-muted/20 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Network traffic chart would appear here</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Connection Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Primary Link:</span>
                      <span className="text-green-500">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Backup Link:</span>
                      <span className="text-muted-foreground">Standby</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Outage:</span>
                      <span>7 days ago</span>
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

