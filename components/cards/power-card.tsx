"use client"

import { useState, useEffect } from "react"
import { Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MqttClient } from "@/lib/mqtt-client"

interface PowerCardProps {
  mqttClient: MqttClient | null
  expanded?: boolean
}

export function PowerCard({ mqttClient, expanded = false }: PowerCardProps) {
  const [powerUtilization, setPowerUtilization] = useState<number>(90.5)
  const [consumption, setConsumption] = useState<number>(86)
  const [efficiency, setEfficiency] = useState<number>(91)
  const [status, setStatus] = useState<"Optimal" | "High" | "Critical">("Optimal")

  useEffect(() => {
    if (!mqttClient) return

    // Subscribe to MQTT topics for power data
    const topics = [
      "Forest/a/Total Active Power", // Total power
      "Forest/a/Active Power L1", // Power L1
      "Forest/a/Active Power L2", // Power L2
      "Forest/a/Active Power L3", // Power L3
    ]

    topics.forEach((topic, index) => {
      mqttClient.subscribe(topic, (message) => {
        const value = Number.parseFloat(message)

        if (index === 0) {
          // Calculate power utilization as a percentage of maximum capacity (assumed 100kW)
          const maxCapacity = 100 // kW
          const utilization = (value / maxCapacity) * 100
          setPowerUtilization(Math.min(utilization, 100))
          setConsumption(value)
        }
      })
    })

    // Determine status based on power utilization
    const interval = setInterval(() => {
      if (powerUtilization > 95) {
        setStatus("Critical")
      } else if (powerUtilization > 85) {
        setStatus("High")
      } else {
        setStatus("Optimal")
      }
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [mqttClient, powerUtilization])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "text-red-500"
      case "High":
        return "text-amber-500"
      default:
        return "text-green-500"
    }
  }

  return (
    <Card className={expanded ? "col-span-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Power Monitoring</CardTitle>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{powerUtilization.toFixed(1)}%</span>
            <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Power Utilization</p>
            <Progress value={powerUtilization} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Consumption</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{consumption} kW</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{efficiency}%</span>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Power Distribution</h3>
              <div className="h-[200px] bg-muted/20 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Power distribution chart would appear here</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Phase L1</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current:</span>
                      <span>42.3 A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Voltage:</span>
                      <span>230.5 V</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Power:</span>
                      <span>28.7 kW</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Phase L2</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current:</span>
                      <span>39.8 A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Voltage:</span>
                      <span>229.8 V</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Power:</span>
                      <span>27.1 kW</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Phase L3</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current:</span>
                      <span>41.5 A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Voltage:</span>
                      <span>231.2 V</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Power:</span>
                      <span>30.2 kW</span>
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

