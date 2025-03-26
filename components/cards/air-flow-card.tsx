"use client"

import { useState, useEffect } from "react"
import { Wind } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MqttClient } from "@/lib/mqtt-client"

interface AirFlowCardProps {
  mqttClient: MqttClient | null
  expanded?: boolean
}

export function AirFlowCard({ mqttClient, expanded = false }: AirFlowCardProps) {
  const [airFlowRate, setAirFlowRate] = useState<number>(81)
  const [pressure, setPressure] = useState<number>(77)
  const [vfdSpeed, setVfdSpeed] = useState<number>(66)
  const [status, setStatus] = useState<"Normal" | "Low" | "Critical">("Normal")

  useEffect(() => {
    if (!mqttClient) return

    // Subscribe to MQTT topics for air flow data
    const topics = [
      "Forest/Airflow", // Air flow
    ]

    topics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        const value = Number.parseFloat(message)
        // Convert to percentage (assuming max airflow is 10 m/s)
        const percentage = (value / 10) * 100
        setAirFlowRate(Math.min(percentage, 100))

        // Simulate pressure and VFD speed based on air flow rate
        setPressure(Math.max(percentage - 4, 0))
        setVfdSpeed(Math.max(percentage - 15, 0))
      })
    })

    // Determine status based on air flow rate
    const interval = setInterval(() => {
      if (airFlowRate < 50) {
        setStatus("Critical")
      } else if (airFlowRate < 70) {
        setStatus("Low")
      } else {
        setStatus("Normal")
      }
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [mqttClient, airFlowRate])

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
        <CardTitle className="text-md font-medium">Air Flow</CardTitle>
        <Wind className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{airFlowRate}%</span>
            <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Air Flow Rate</p>
            <Progress value={airFlowRate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pressure</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{pressure}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">VFD Speed</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{vfdSpeed}%</span>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Ventilation System</h3>
              <div className="h-[200px] bg-muted/20 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Ventilation system diagram would appear here</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Fan Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Intake Fan:</span>
                      <span className="text-green-500">Running</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Exhaust Fan:</span>
                      <span className="text-green-500">Running</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Filter Status:</span>
                      <span className="text-green-500">Clean</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Air Quality</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Particulate Matter:</span>
                      <span>12 µg/m³</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>CO2 Level:</span>
                      <span>650 ppm</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Air Changes/Hour:</span>
                      <span>24</span>
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

