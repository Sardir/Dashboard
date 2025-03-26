"use client"

import { useEffect, useState } from "react"
import { Activity, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MqttClient } from "@/lib/mqtt-client"

interface NetworkStatusProps {
  networkTopics: string[]
}

export function NetworkStatus({ networkTopics }: NetworkStatusProps) {
  const [networkStatus, setNetworkStatus] = useState<boolean>(false)
  const [lastUpdated, setLastUpdated] = useState<string>("")

  useEffect(() => {
    if (networkTopics.length === 0) return

    // Connect to MQTT and subscribe to network status topic
    const mqttClient = new MqttClient("ws://64.227.163.97:8083/mqtt")

    networkTopics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        // Convert message to boolean (assuming 1 = online, 0 = offline)
        const isOnline = message === "1" || message.toLowerCase() === "true" || message.toLowerCase() === "online"
        setNetworkStatus(isOnline)
        setLastUpdated(new Date().toLocaleTimeString())
      })
    })

    // Clean up subscription
    return () => {
      mqttClient.disconnect()
    }
  }, [networkTopics])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Network Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            {networkStatus ? (
              <div className="p-2 bg-green-100 rounded-full">
                <Wifi className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-red-100 rounded-full">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
            )}
            <div>
              <h3 className="font-medium">Connection Status</h3>
              <p className="text-sm text-muted-foreground">{networkStatus ? "Online" : "Offline"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">Last Updated: {lastUpdated || "N/A"}</span>
            </div>
            <div className="mt-1">
              <span
                className={`inline-block w-2 h-2 ${networkStatus ? "bg-green-500" : "bg-red-500"} rounded-full mr-1 ${networkStatus ? "animate-pulse" : ""}`}
              ></span>
              <span className="text-xs font-medium">{networkStatus ? "Active" : "Inactive"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

