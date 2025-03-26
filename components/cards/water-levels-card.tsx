"use client"

import { useState, useEffect } from "react"
import { Droplet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MqttClient } from "@/lib/mqtt-client"

interface WaterLevelsCardProps {
  mqttClient: MqttClient | null
  expanded?: boolean
}

export function WaterLevelsCard({ mqttClient, expanded = false }: WaterLevelsCardProps) {
  const [mainTankLevel, setMainTankLevel] = useState<number>(85)
  const [reserveLevel, setReserveLevel] = useState<number>(92)
  const [circulationRate, setCirculationRate] = useState<number>(78)
  const [status, setStatus] = useState<"Normal" | "Low" | "Critical">("Normal")

  useEffect(() => {
    if (!mqttClient) return

    // Subscribe to MQTT topics for water level data
    const topics = [
      "Forest/Water", // Water level
    ]

    topics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        const value = Number.parseFloat(message)
        setMainTankLevel(value)

        // Simulate reserve level and circulation rate based on main tank level
        setReserveLevel(Math.min(value + 7, 100))
        setCirculationRate(value - 7)
      })
    })

    // Determine status based on water level
    const interval = setInterval(() => {
      if (mainTankLevel < 50) {
        setStatus("Critical")
      } else if (mainTankLevel < 70) {
        setStatus("Low")
      } else {
        setStatus("Normal")
      }
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [mqttClient, mainTankLevel])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "text-red-500"
      case "Low":
        return "text-amber-500"
      default:
        return "text-green-500"
    }
  }

  return (
    <Card className={expanded ? "col-span-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Water Levels</CardTitle>
        <Droplet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{mainTankLevel}%</span>
            <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Main Tank Level</p>
            <Progress value={mainTankLevel} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reserve</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{reserveLevel}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Circulation</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{circulationRate}%</span>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Water System Details</h3>
              <div className="h-[200px] bg-muted/20 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Water system diagram would appear here</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Flow Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Flow Rate:</span>
                      <span>42.5 L/min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pressure:</span>
                      <span>3.2 bar</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Temperature:</span>
                      <span>24.8°C</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">System Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pump 1:</span>
                      <span className="text-green-500">Running</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pump 2:</span>
                      <span className="text-muted-foreground">Standby</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Filter Status:</span>
                      <span className="text-amber-500">Maintenance Due</span>
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

