"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MqttClient } from "@/lib/mqtt-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PowerDetailsProps {
  topics: string[]
  subTopics: string[]
  siteName: string
}

export function PowerDetails({ topics, subTopics, siteName }: PowerDetailsProps) {
  const [powerData, setPowerData] = useState<Record<string, string>>({})
  const [powerDataSub, setPowerDataSub] = useState<Record<string, string>>({})
  const [hasDualPowerAnalyzer, setHasDualPowerAnalyzer] = useState<boolean>(false)

  useEffect(() => {
    // Reset data when topics change
    setPowerData({})
    setPowerDataSub({})

    // Check if this site has dual power analyzers
    setHasDualPowerAnalyzer(subTopics.length > 0)

    // Connect to MQTT and subscribe to power detail topics
    const mqttClient = new MqttClient("ws://64.227.163.97:8083/mqtt")

    // Subscribe to main power analyzer topics
    topics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        setPowerData((prev) => ({
          ...prev,
          [topic]: message,
        }))
      })
    })

    // Subscribe to secondary power analyzer topics if available
    subTopics.forEach((topic) => {
      mqttClient.subscribe(topic, (message) => {
        setPowerDataSub((prev) => ({
          ...prev,
          [topic]: message,
        }))
      })
    })

    // Clean up subscriptions
    return () => {
      mqttClient.disconnect()
    }
  }, [topics, subTopics])

  const renderPowerAnalyzer = (analyzerData: Record<string, string>, analyzer: string) => {
    if (Object.keys(analyzerData).length === 0) {
      return (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No data available for {analyzer}. Please check the MQTT connection.</AlertDescription>
        </Alert>
      )
    }

    // Sort topics for consistent display
    const sortedTopics = Object.keys(analyzerData).sort()

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parameter</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTopics.map((topic) => {
            const paramName = topic.split("/").pop() || topic

            // Format the value based on the parameter type
            const value = analyzerData[topic] || "0"
            let unit = ""

            if (paramName.includes("Current")) {
              unit = " A"
            } else if (paramName.includes("Voltage") || paramName.includes("V")) {
              unit = " V"
            } else if (paramName.includes("Power")) {
              unit = " W"
            } else if (paramName.includes("Frequency")) {
              unit = " Hz"
            }

            return (
              <TableRow key={topic}>
                <TableCell className="font-medium">{paramName}</TableCell>
                <TableCell className="text-right">
                  {value}
                  {unit}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-amber-500" />
          Power Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasDualPowerAnalyzer ? (
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Power Analyzer 1</h3>
              {renderPowerAnalyzer(powerData, "Power Analyzer 1")}
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Power Analyzer 2</h3>
              {renderPowerAnalyzer(powerDataSub, "Power Analyzer 2")}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium mb-2">Power Analyzer</h3>
            {renderPowerAnalyzer(powerData, "Power Analyzer")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

