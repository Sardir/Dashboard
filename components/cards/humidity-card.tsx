"use client"

import { useState, useEffect } from "react"
import { Droplet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MqttClient } from "@/lib/mqtt-client"

interface HumidityCardProps {
  mqttClient: MqttClient | null
  expanded?: boolean
}

export function HumidityCard({ mqttClient, expanded = false }: HumidityCardProps) {
  const [indoorHumidity, setIndoorHumidity] = useState<number>(46)
  const [outdoorHumidity, setOutdoorHumidity] = useState<number>(91)
  const [recirculatedHumidity, setRecirculatedHumidity] = useState<number>(67)
  const [status, setStatus] = useState<"Normal" | "Warning" | "Critical">("Normal")

  useEffect(() => {
    if (!mqttClient) return

    // Subscribe to MQTT topics for humidity data
    const topics = [
      "Forest/FilterRoom/H", // Indoor humidity
      "Forest/ExhuastRoom/H", // Outdoor humidity
      "Forest/MinningRoom/H", // Recirculated humidity
    ]

    topics.forEach((topic, index) => {
      mqttClient.subscribe(topic, (message) => {
        const value = Number.parseFloat(message)
        if (index === 0) setIndoorHumidity(value)
        else if (index === 1) setOutdoorHumidity(value)
        else if (index === 2) setRecirculatedHumidity(value)
      })
    })

    // Determine status based on humidity values
    const interval = setInterval(() => {
      if (indoorHumidity < 30) {
        setStatus("Critical")
      } else if (indoorHumidity < 40) {
        setStatus("Warning")
      } else {
        setStatus("Normal")
      }
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [mqttClient, indoorHumidity])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "text-red-500"
      case "Warning":
        return "text-amber-500"
      default:
        return "text-green-500"
    }
  }

  return (
    <Card className={expanded ? "col-span-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Humidity Control</CardTitle>
        <Droplet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{indoorHumidity}%</span>
            <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Indoor Humidity</p>
            <Progress value={indoorHumidity} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Outdoor</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{outdoorHumidity}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recirculated</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{recirculatedHumidity}%</span>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Humidity Trends</h3>
              <div className="h-[200px] bg-muted/20 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Humidity trend chart would appear here</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Control Settings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Target Humidity:</span>
                      <span>50%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Acceptable Range:</span>
                      <span>40% - 60%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Control Mode:</span>
                      <span>Automatic</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">System Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Humidifier:</span>
                      <span className="text-green-500">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dehumidifier:</span>
                      <span className="text-muted-foreground">Standby</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Maintenance:</span>
                      <span>7 days ago</span>
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

