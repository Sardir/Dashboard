"use client"

import { useState, useEffect } from "react"
import { Droplet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { SiteType } from "@/lib/sites-config"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface HumidityMonitoringProps {
  siteData: SiteType
  mqttData: Record<string, string>
  expanded?: boolean
}

export function HumidityMonitoring({ siteData, mqttData, expanded = false }: HumidityMonitoringProps) {
  const [indoorHumidity, setIndoorHumidity] = useState<number>(0)
  const [outdoorHumidity, setOutdoorHumidity] = useState<number>(0)
  const [recirculatedHumidity, setRecirculatedHumidity] = useState<number>(0)
  const [rpiHumidity, setRpiHumidity] = useState<number>(0)
  const [status, setStatus] = useState<"Normal" | "Warning" | "Critical">("Normal")
  const [humidityData, setHumidityData] = useState<any[]>([])

  useEffect(() => {
    // Get humidity data from MQTT
    if (siteData.humTopics.length >= 4) {
      const filterRoomHum = Number.parseFloat(mqttData[siteData.humTopics[0]] || "0")
      const miningRoomHum = Number.parseFloat(mqttData[siteData.humTopics[1]] || "0")
      const rpiRoomHum = Number.parseFloat(mqttData[siteData.humTopics[2]] || "0")
      const exhaustRoomHum = Number.parseFloat(mqttData[siteData.humTopics[3]] || "0")

      setIndoorHumidity(filterRoomHum)
      setRecirculatedHumidity(miningRoomHum)
      setRpiHumidity(rpiRoomHum)
      setOutdoorHumidity(exhaustRoomHum)

      // Update humidity data for chart
      setHumidityData([
        { name: "Filter Room", humidity: filterRoomHum },
        { name: "Mining Room", humidity: miningRoomHum },
        { name: "RPI Room", humidity: rpiRoomHum },
        { name: "Exhaust Room", humidity: exhaustRoomHum },
      ])

      // Determine status based on humidity values
      if (filterRoomHum < 30) {
        setStatus("Critical")
      } else if (filterRoomHum < 40) {
        setStatus("Warning")
      } else {
        setStatus("Normal")
      }
    }
  }, [siteData, mqttData])

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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={humidityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Humidity (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Humidity (%)" />
                  </LineChart>
                </ResponsiveContainer>
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
                    <div className="flex justify-between text-sm">
                      <span>RPI Room Humidity:</span>
                      <span>{rpiHumidity}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/20 rounded-md">
                  <h4 className="text-sm font-medium mb-2">System Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Humidifier:</span>
                      <span className={indoorHumidity < 40 ? "text-green-500" : "text-muted-foreground"}>
                        {indoorHumidity < 40 ? "Active" : "Standby"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dehumidifier:</span>
                      <span className={indoorHumidity > 60 ? "text-green-500" : "text-muted-foreground"}>
                        {indoorHumidity > 60 ? "Active" : "Standby"}
                      </span>
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

