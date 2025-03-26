"use client"

import { useEffect, useState } from "react"
import { Droplet, ThermometerSnowflake, Wind } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MqttClient } from "@/lib/mqtt-client"

interface SiteEnvironmentProps {
  tempTopics: string[]
  humTopics: string[]
  waterTopics: string[]
  airflowTopics: string[]
}

export function SiteEnvironment({ tempTopics, humTopics, waterTopics, airflowTopics }: SiteEnvironmentProps) {
  const [tempValues, setTempValues] = useState<Record<string, number>>({})
  const [humValues, setHumValues] = useState<Record<string, number>>({})
  const [waterLevel, setWaterLevel] = useState<number>(0)
  const [airflow, setAirflow] = useState<number>(0)

  useEffect(() => {
    // Reset values when topics change
    setTempValues({})
    setHumValues({})
    setWaterLevel(0)
    setAirflow(0)

    // Connect to MQTT and subscribe to topics
    const mqttClient = new MqttClient("ws://64.227.163.97:8083/mqtt")

    // Subscribe to temperature topics
    tempTopics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        setTempValues((prev) => ({
          ...prev,
          [topic]: Number.parseFloat(message) || 0,
        }))
      })
    })

    // Subscribe to humidity topics
    humTopics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        setHumValues((prev) => ({
          ...prev,
          [topic]: Number.parseFloat(message) || 0,
        }))
      })
    })

    // Subscribe to water level topics
    if (waterTopics.length > 0 && waterTopics[0]) {
      mqttClient.subscribe(waterTopics[0], (message) => {
        setWaterLevel(Number.parseFloat(message) || 0)
      })
    }

    // Subscribe to airflow topics
    if (airflowTopics.length > 0 && airflowTopics[0]) {
      mqttClient.subscribe(airflowTopics[0], (message) => {
        setAirflow(Number.parseFloat(message) || 0)
      })
    }

    // Clean up subscriptions when component unmounts or topics change
    return () => {
      mqttClient.disconnect()
    }
  }, [tempTopics, humTopics, waterTopics, airflowTopics])

  // Map room names
  const roomNames = ["Filter Room", "Mining Room", "RPI Room", "Exhaust Room"]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Environment Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temperature & Humidity */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Temperature & Humidity</h3>
          {roomNames.map((room, index) => {
            const tempTopic = tempTopics[index] || ""
            const humTopic = humTopics[index] || ""

            return (
              <div key={room} className="flex items-center p-2 bg-muted/30 rounded-lg">
                <ThermometerSnowflake className="h-4 w-4 text-blue-500 mr-2" />
                <div className="flex-1">
                  <p className="text-xs font-medium">{room}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-500">{tempValues[tempTopic] || 0}°C</span>
                    <span className="text-sm text-blue-500">{humValues[humTopic] || 0}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Water Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Water Level</h3>
            <Droplet className="h-4 w-4 text-blue-500" />
          </div>
          <Progress value={waterLevel || 0} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>{waterLevel || 0}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Airflow */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Airflow</h3>
            <Wind className="h-4 w-4 text-green-500" />
          </div>
          <Progress value={airflow || 0} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 m/s</span>
            <span>{airflow || 0} m/s</span>
            <span>10 m/s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

