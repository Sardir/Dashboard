"use client"

import { useState, useEffect } from "react"
import { Thermometer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { SiteType } from "@/lib/sites-config"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface TemperatureMonitoringProps {
  siteData: SiteType
  mqttData: Record<string, string>
  expanded?: boolean
}

export function TemperatureMonitoring({ siteData, mqttData, expanded = false }: TemperatureMonitoringProps) {
  const [outletTemp, setOutletTemp] = useState<number>(0)
  const [inletTemp, setInletTemp] = useState<number>(0)
  const [ambientTemp, setAmbientTemp] = useState<number>(0)
  const [rpiTemp, setRpiTemp] = useState<number>(0)
  const [tempDiff, setTempDiff] = useState<number>(0)
  const [tempData, setTempData] = useState<any[]>([])

  useEffect(() => {
    // Get temperature data from MQTT
    if (siteData.tempTopics.length >= 4) {
      const filterRoomTemp = Number.parseFloat(mqttData[siteData.tempTopics[0]] || "0")
      const miningRoomTemp = Number.parseFloat(mqttData[siteData.tempTopics[1]] || "0")
      const rpiRoomTemp = Number.parseFloat(mqttData[siteData.tempTopics[2]] || "0")
      const exhaustRoomTemp = Number.parseFloat(mqttData[siteData.tempTopics[3]] || "0")

      setInletTemp(filterRoomTemp)
      setOutletTemp(miningRoomTemp)
      setRpiTemp(rpiRoomTemp)
      setAmbientTemp(exhaustRoomTemp)
      setTempDiff(Math.abs(miningRoomTemp - filterRoomTemp))

      // Update temperature data for chart
      setTempData([
        { name: "Filter Room", temp: filterRoomTemp },
        { name: "Mining Room", temp: miningRoomTemp },
        { name: "RPI Room", temp: rpiRoomTemp },
        { name: "Exhaust Room", temp: exhaustRoomTemp },
      ])
    }
  }, [siteData, mqttData])

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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tempData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temp" stroke="#ff7300" name="Temperature (°C)" />
                  </LineChart>
                </ResponsiveContainer>
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
                      <span>{rpiTemp}°C</span>
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
                    <div className="flex justify-between text-sm">
                      <span>Temperature Diff:</span>
                      <span className={tempDiff > 15 ? "text-red-500" : "text-green-500"}>{tempDiff}°C</span>
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

