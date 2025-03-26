"use client"

import { useState, useEffect } from "react"
import { Thermometer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MqttClient } from "@/lib/mqtt-client"

interface TemperatureCardProps {
  mqttClient: MqttClient | null
  expanded?: boolean
}

export function TemperatureCard({ mqttClient, expanded = false }: TemperatureCardProps) {
  const [outletTemp, setOutletTemp] = useState<number>(39)
  const [inletTemp, setInletTemp] = useState<number>(23)
  const [ambientTemp, setAmbientTemp] = useState<number>(21)
  const [tempDiff, setTempDiff] = useState<number>(16)

  useEffect(() => {
    if (!mqttClient) return

    // Subscribe to MQTT topics for temperature data
    const topics = [
      "Forest/MinningRoom/T", // Outlet temperature (mining room)
      "Forest/FilterRoom/T", // Inlet temperature (filter room)
      "Forest/ExhuastRoom/T", // Ambient temperature (exhaust room)
    ]

    topics.forEach((topic, index) => {
      mqttClient.subscribe(topic, (message) => {
        const value = Number.parseFloat(message)
        if (index === 0) setOutletTemp(value)
        else if (index === 1) setInletTemp(value)
        else if (index === 2) setAmbientTemp(value)
      })
    })

    // Calculate temperature differential
    const interval = setInterval(() => {
      setTempDiff(Math.abs(outletTemp - inletTemp))
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [mqttClient, outletTemp, inletTemp])

  return (
    <Card className={expanded ? "col-span-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Temperature</CardTitle>
        <Thermometer className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{outletTemp}°C</span>
            <span className="text-sm font-medium">{tempDiff}°C Diff</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Outlet Temperature</p>
            <Progress value={(outletTemp / 50) * 100} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Inlet</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{inletTemp}°C</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ambient</p>
              <div className="flex justify-between items-center">
                <span className="font-medium">{ambientTemp}°C</span>
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium">Temperature Trends</h3>
              <div className="h-[200px] bg-muted/20 rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Temperature trend chart would appear here</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Room Temperatures</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Mining Room:</span>
                      <span>{outletTemp}°C</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Filter Room:</span>
                      <span>{inletTemp}°C</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>RPI Room:</span>
                      <span>25°C</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Exhaust Room:</span>
                      <span>{ambientTemp}°C</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Cooling System</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cooling Status:</span>
                      <span className="text-green-500">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Fan Speed:</span>
                      <span>85%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Target Temp:</span>
                      <span>35°C</span>
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

