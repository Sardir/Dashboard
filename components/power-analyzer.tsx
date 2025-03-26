"use client"

import { useEffect, useState } from "react"
import type { SiteType } from "@/lib/sites-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MqttClient } from "@/lib/mqtt-client"

interface PowerAnalyzerProps {
  siteData: SiteType
}

export function PowerAnalyzer({ siteData }: PowerAnalyzerProps) {
  const [currentValues, setCurrentValues] = useState<Record<string, string>>({})
  const [voltageValues, setVoltageValues] = useState<Record<string, string>>({})
  const [powerValues, setPowerValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!siteData) return

    // Reset values when site changes
    setCurrentValues({})
    setVoltageValues({})
    setPowerValues({})

    // Connect to MQTT and subscribe to topics
    const mqttClient = new MqttClient("ws://64.227.163.97:8083/mqtt")

    // Subscribe to current topics
    siteData.currentTopics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        setCurrentValues((prev) => ({
          ...prev,
          [topic]: message,
        }))
      })
    })

    // Subscribe to voltage topics
    siteData.voltageTopics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        setVoltageValues((prev) => ({
          ...prev,
          [topic]: message,
        }))
      })
    })

    // Subscribe to power topics
    siteData.powerTopics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        setPowerValues((prev) => ({
          ...prev,
          [topic]: message,
        }))
      })
    })

    // Clean up subscriptions when component unmounts or site changes
    return () => {
      mqttClient.disconnect()
    }
  }, [siteData])

  return (
    <div className="grid gap-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Power Analyzer 1 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Power Analyzer - 1</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Current Metrics */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-700">Current</h3>
                <div className="space-y-2">
                  {siteData.currentTopics.map((topic, index) => (
                    <div key={topic} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{`L${index + 1}`}</span>
                      <span className="font-medium">{currentValues[topic] || "0"} A</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voltage Metrics */}
              <div className="p-4 bg-amber-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-amber-700">Voltage</h3>
                <div className="space-y-2">
                  {siteData.voltageTopics.map((topic, index) => (
                    <div key={topic} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{`V${index + 1}`}</span>
                      <span className="font-medium">{voltageValues[topic] || "0"} V</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Power Metrics */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-green-700">Active Power</h3>
                <div className="space-y-2">
                  {siteData.powerTopics.map((topic, index) => (
                    <div key={topic} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{`L${index + 1}`}</span>
                      <span className="font-medium">{powerValues[topic] || "0"} W</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Power Analyzer 2 - Only show for sites that have sub topics */}
        {siteData.subTopics.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Power Analyzer - 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Current Metrics */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-700">Current</h3>
                  <div className="space-y-2">
                    {siteData.subTopics.map((topic, index) => (
                      <div key={topic} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{`L${index + 1}`}</span>
                        <span className="font-medium">{currentValues[topic] || "0"} A</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voltage Metrics */}
                <div className="p-4 bg-amber-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-amber-700">Voltage</h3>
                  <div className="space-y-2">
                    {siteData.voltageSubTopics.map((topic, index) => (
                      <div key={topic} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{`V${index + 1}`}</span>
                        <span className="font-medium">{voltageValues[topic] || "0"} V</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Power Metrics */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-700">Active Power</h3>
                  <div className="space-y-2">
                    {siteData.powerSubTopics.map((topic, index) => (
                      <div key={topic} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{`L${index + 1}`}</span>
                        <span className="font-medium">{powerValues[topic] || "0"} W</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

