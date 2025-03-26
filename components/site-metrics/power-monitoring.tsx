"use client"

import { useState, useEffect } from "react"
import { Zap, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SiteType } from "@/lib/sites-config"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { format, subDays } from "date-fns"

interface PowerMonitoringProps {
  siteData: SiteType
  mqttData: Record<string, string>
  expanded?: boolean
}

export function PowerMonitoring({ siteData, mqttData, expanded = false }: PowerMonitoringProps) {
  const [powerUtilization, setPowerUtilization] = useState<number>(0)
  const [consumption, setConsumption] = useState<number>(0)
  const [efficiency, setEfficiency] = useState<number>(0)
  const [status, setStatus] = useState<"Optimal" | "High" | "Critical">("Optimal")
  const [currentData, setCurrentData] = useState<any[]>([])
  const [voltageData, setVoltageData] = useState<any[]>([])
  const [powerData, setPowerData] = useState<any[]>([])
  const [totalPowerData, setTotalPowerData] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Get real-time data from MQTT
  useEffect(() => {
    // Get total power from MQTT data
    const totalPowerTopic = siteData.neutralTopics.find((t) => t.includes("Total Active Power"))
    if (totalPowerTopic && mqttData[totalPowerTopic]) {
      const totalPower = Number.parseFloat(mqttData[totalPowerTopic])

      // Calculate power utilization as a percentage of maximum capacity (assumed 100kW)
      const maxCapacity = 100 // kW
      const utilization = (totalPower / maxCapacity) * 100
      setPowerUtilization(Math.min(utilization, 100))
      setConsumption(totalPower / 1000) // Convert to kW

      // Calculate efficiency based on power factor (simulated)
      setEfficiency(Math.min(98, 85 + Math.random() * 10))
    }

    // Determine status based on power utilization
    if (powerUtilization > 95) {
      setStatus("Critical")
    } else if (powerUtilization > 85) {
      setStatus("High")
    } else {
      setStatus("Optimal")
    }
  }, [siteData, mqttData, powerUtilization])

  // Fetch historical data from database
  useEffect(() => {
    if (!expanded || !siteData.selectedTimeStamp) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const endDate = new Date()
        const startDate = subDays(endDate, 1) // Last 24 hours

        // Fetch current data
        const currentResponse = await fetchColumnData(
          siteData.selectedTimeStamp,
          ["Current_L1", "Current_L2", "Current_L3"],
          startDate,
          endDate,
        )

        // Fetch voltage data
        const voltageResponse = await fetchColumnData(
          siteData.selectedTimeStamp,
          ["Phase_L1_Phase_L2_Voltage", "Phase_L2_Phase_L3_Voltage", "Phase_L3_Phase_L1_Voltage"],
          startDate,
          endDate,
        )

        // Fetch power data
        const powerResponse = await fetchColumnData(
          siteData.selectedTimeStamp,
          ["Active_Power_L1", "Active_Power_L2", "Active_Power_L3"],
          startDate,
          endDate,
        )

        // Fetch total power data
        const totalPowerResponse = await fetchColumnData(
          siteData.selectedTimeStamp,
          ["Total_Active_Power", "Positive_Active_Energy"],
          startDate,
          endDate,
        )

        // Process data for charts
        setCurrentData(processDataForChart(currentResponse, "Current"))
        setVoltageData(processDataForChart(voltageResponse, "Voltage"))
        setPowerData(processDataForChart(powerResponse, "Power"))
        setTotalPowerData(processDataForChart(totalPowerResponse, "TotalPower"))

        // Create combined historical data
        const combinedData = createCombinedHistoricalData(currentResponse, voltageResponse, powerResponse)
        setHistoricalData(combinedData)
      } catch (err) {
        console.error("Error fetching power data:", err)
        setError("Failed to fetch power data. Using simulated data instead.")

        // Use simulated data as fallback
        generateSimulatedData()
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [expanded, siteData.selectedTimeStamp])

  // Helper function to fetch data for specific columns
  const fetchColumnData = async (tableName: string, columns: string[], startDate: Date, endDate: Date) => {
    const formattedStartDate = format(startDate, "yyyy-MM-dd")
    const formattedEndDate = format(endDate, "yyyy-MM-dd")

    const promises = columns.map((column) =>
      fetch(
        `/api/data?table_name=${tableName}&column_name=\`${column}\`&start_time=${formattedStartDate}&end_time=${formattedEndDate}`,
      ).then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${column} data`)
        return res.json()
      }),
    )

    return Promise.all(promises)
  }

  // Update the processDataForChart function in the PowerMonitoring component

  // Process data for charts
  const processDataForChart = (responses: any[][], type: string) => {
    if (!responses || responses.length === 0 || !responses[0] || responses[0].length === 0) {
      return []
    }

    // Create a map of timestamps to data points
    const dataMap = new Map()

    // Process each response (each column)
    responses.forEach((response, columnIndex) => {
      if (!Array.isArray(response)) {
        console.error("Invalid response format:", response)
        return
      }

      response.forEach((row) => {
        if (!row || !row.timestamp) {
          console.error("Invalid row format:", row)
          return
        }

        const timestamp = new Date(row.timestamp)
        const timeKey = format(timestamp, "HH:mm")

        if (!dataMap.has(timeKey)) {
          dataMap.set(timeKey, { time: timeKey })
        }

        const dataPoint = dataMap.get(timeKey)

        // Extract the value from the row using the column name
        let value = null
        for (const key in row) {
          if (key !== "timestamp") {
            value = Number.parseFloat(row[key])
            break
          }
        }

        if (value !== null && !isNaN(value)) {
          // Set the value based on the column and type
          if (type === "Current") {
            const keys = ["L1", "L2", "L3"]
            const columnKey = keys[columnIndex]
            dataPoint[columnKey] = value
          } else if (type === "Voltage") {
            const keys = ["V1", "V2", "V3"]
            const columnKey = keys[columnIndex]
            dataPoint[columnKey] = value
          } else if (type === "Power") {
            const keys = ["L1", "L2", "L3"]
            const columnKey = keys[columnIndex]
            dataPoint[columnKey] = value / 1000 // Convert to kW
          } else if (type === "TotalPower") {
            const keys = ["Total Active Power", "Positive Active Energy"]
            const columnKey = keys[columnIndex]
            dataPoint[columnKey] = value / 1000 // Convert to kW
          }
        }
      })
    })

    // Convert map to array and sort by time
    return Array.from(dataMap.values()).sort((a, b) => {
      const timeA = a.time.split(":").map(Number)
      const timeB = b.time.split(":").map(Number)
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
    })
  }

  // Create combined historical data
  const createCombinedHistoricalData = (currentData: any[][], voltageData: any[][], powerData: any[][]) => {
    const dataMap = new Map()

    // Process current data
    if (currentData && currentData.length > 0 && currentData[0].length > 0) {
      currentData[0].forEach((row) => {
        const timestamp = new Date(row.timestamp)
        const timeKey = format(timestamp, "HH:mm")

        if (!dataMap.has(timeKey)) {
          dataMap.set(timeKey, { time: timeKey })
        }

        const dataPoint = dataMap.get(timeKey)
        const currentL1 = row.Current_L1 || 0
        const currentL2 = currentData[1]?.find((r) => r.timestamp === row.timestamp)?.Current_L2 || 0
        const currentL3 = currentData[2]?.find((r) => r.timestamp === row.timestamp)?.Current_L3 || 0

        dataPoint["Current"] = (currentL1 + currentL2 + currentL3) / 3
      })
    }

    // Process voltage data
    if (voltageData && voltageData.length > 0 && voltageData[0].length > 0) {
      voltageData[0].forEach((row) => {
        const timestamp = new Date(row.timestamp)
        const timeKey = format(timestamp, "HH:mm")

        if (!dataMap.has(timeKey)) {
          dataMap.set(timeKey, { time: timeKey })
        }

        const dataPoint = dataMap.get(timeKey)
        const voltageKeys = ["Phase_L1_Phase_L2_Voltage", "Phase_L2_Phase_L3_Voltage", "Phase_L3_Phase_L1_Voltage"]
        const voltage1 = row[voltageKeys[0]] || 0
        const voltage2 = voltageData[1]?.find((r) => r.timestamp === row.timestamp)?.[voltageKeys[1]] || 0
        const voltage3 = voltageData[2]?.find((r) => r.timestamp === row.timestamp)?.[voltageKeys[2]] || 0

        dataPoint["Voltage"] = (voltage1 + voltage2 + voltage3) / 3
      })
    }

    // Process power data
    if (powerData && powerData.length > 0 && powerData[0].length > 0) {
      powerData[0].forEach((row) => {
        const timestamp = new Date(row.timestamp)
        const timeKey = format(timestamp, "HH:mm")

        if (!dataMap.has(timeKey)) {
          dataMap.set(timeKey, { time: timeKey })
        }

        const dataPoint = dataMap.get(timeKey)
        const powerKeys = ["Active_Power_L1", "Active_Power_L2", "Active_Power_L3"]
        const power1 = row[powerKeys[0]] / 1000 || 0
        const power2 = powerData[1]?.find((r) => r.timestamp === row.timestamp)?.[powerKeys[1]] / 1000 || 0
        const power3 = powerData[2]?.find((r) => r.timestamp === row.timestamp)?.[powerKeys[2]] / 1000 || 0

        dataPoint["Power"] = power1 + power2 + power3
      })
    }

    // Convert map to array and sort by time
    return Array.from(dataMap.values()).sort((a, b) => {
      const timeA = a.time.split(":").map(Number)
      const timeB = b.time.split(":").map(Number)
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
    })
  }

  // Generate simulated data as fallback
  const generateSimulatedData = () => {
    // Generate time points for the last 10 minutes
    const timePoints = Array.from({ length: 10 }, (_, i) => {
      const date = new Date()
      date.setMinutes(date.getMinutes() - (9 - i))
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    })

    // Get current data
    const currentL1 = siteData.currentTopics[0] ? Number.parseFloat(mqttData[siteData.currentTopics[0]] || "0") : 0
    const currentL2 = siteData.currentTopics[1] ? Number.parseFloat(mqttData[siteData.currentTopics[1]] || "0") : 0
    const currentL3 = siteData.currentTopics[2] ? Number.parseFloat(mqttData[siteData.currentTopics[2]] || "0") : 0

    // Get voltage data
    const voltageL1 = siteData.voltageTopics[0] ? Number.parseFloat(mqttData[siteData.voltageTopics[0]] || "0") : 0
    const voltageL2 = siteData.voltageTopics[1] ? Number.parseFloat(mqttData[siteData.voltageTopics[1]] || "0") : 0
    const voltageL3 = siteData.voltageTopics[2] ? Number.parseFloat(mqttData[siteData.voltageTopics[2]] || "0") : 0

    // Get power data
    const powerL1 = siteData.powerTopics[0] ? Number.parseFloat(mqttData[siteData.powerTopics[0]] || "0") / 1000 : 0
    const powerL2 = siteData.powerTopics[1] ? Number.parseFloat(mqttData[siteData.powerTopics[1]] || "0") / 1000 : 0
    const powerL3 = siteData.powerTopics[2] ? Number.parseFloat(mqttData[siteData.powerTopics[2]] || "0") / 1000 : 0

    // Get total power
    const totalPowerTopic = siteData.neutralTopics.find((t) => t.includes("Total Active Power"))
    const totalPower = totalPowerTopic ? Number.parseFloat(mqttData[totalPowerTopic] || "0") / 1000 : 0

    // Simulate positive active energy (cumulative)
    const positiveActiveEnergy = totalPower * 0.25 * (Math.random() * 0.2 + 0.9) // kWh for 15 minutes with some variation

    // Create historical data for charts
    const newCurrentData = timePoints.map((time, index) => {
      const factor = 0.8 + Math.sin(index / 3) * 0.2 // Create some variation
      return {
        time,
        L1: currentL1 * factor * (0.9 + Math.random() * 0.2),
        L2: currentL2 * factor * (0.9 + Math.random() * 0.2),
        L3: currentL3 * factor * (0.9 + Math.random() * 0.2),
      }
    })

    const newVoltageData = timePoints.map((time, index) => {
      const factor = 0.995 + Math.sin(index / 5) * 0.005 // Create minimal variation for voltage
      return {
        time,
        V1: voltageL1 * factor,
        V2: voltageL2 * factor,
        V3: voltageL3 * factor,
      }
    })

    const newPowerData = timePoints.map((time, index) => {
      const factor = 0.8 + Math.sin(index / 3) * 0.2 // Create some variation
      return {
        time,
        L1: powerL1 * factor * (0.9 + Math.random() * 0.2),
        L2: powerL2 * factor * (0.9 + Math.random() * 0.2),
        L3: powerL3 * factor * (0.9 + Math.random() * 0.2),
      }
    })

    const newTotalPowerData = timePoints.map((time, index) => {
      const factor = 0.8 + Math.sin(index / 3) * 0.2 // Create some variation
      const cumulativeFactor = 0.5 + index / 10 // Increasing factor for cumulative energy
      return {
        time,
        "Total Active Power": totalPower * factor * (0.9 + Math.random() * 0.2),
        "Positive Active Energy": positiveActiveEnergy * cumulativeFactor,
      }
    })

    setCurrentData(newCurrentData)
    setVoltageData(newVoltageData)
    setPowerData(newPowerData)
    setTotalPowerData(newTotalPowerData)

    // Generate historical data for the main chart
    const newHistoricalData = []
    for (let i = 0; i < 24; i++) {
      const hour = new Date()
      hour.setHours(hour.getHours() - 23 + i)

      const hourFactor = 0.7 + Math.sin((i / 8) * Math.PI) * 0.3 // Daily cycle

      newHistoricalData.push({
        time: hour.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        Power: totalPower * hourFactor * (0.9 + Math.random() * 0.2),
        Current: ((currentL1 + currentL2 + currentL3) / 3) * hourFactor * (0.9 + Math.random() * 0.2),
        Voltage: ((voltageL1 + voltageL2 + voltageL3) / 3) * (0.995 + Math.sin(i / 12) * 0.005),
      })
    }

    setHistoricalData(newHistoricalData)
  }

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

  // Define colors for chart lines
  const lineColors = {
    L1: "#1ab7ea", // Blue
    L2: "#f39c12", // Orange
    L3: "#2ecc71", // Green
    V1: "#3498db", // Light Blue
    V2: "#e67e22", // Dark Orange
    V3: "#27ae60", // Dark Green
    "Total Active Power": "#9b59b6", // Purple
    "Positive Active Energy": "#e74c3c", // Red
    Power: "#8e44ad", // Dark Purple
    Current: "#2980b9", // Dark Blue
    Voltage: "#d35400", // Burnt Orange
  }

  return (
    <Card className={expanded ? "col-span-full" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Power Monitoring</CardTitle>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {expanded ? (
          <div className="space-y-4">
            {error && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">{error}</div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Graphs</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold">{powerUtilization.toFixed(1)}%</span>
                  <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Power Utilization</p>
                  <Progress
                    value={powerUtilization}
                    className="h-2"
                    indicatorClassName={
                      powerUtilization > 90 ? "bg-red-500" : powerUtilization > 75 ? "bg-amber-500" : "bg-green-500"
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Consumption</p>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{consumption.toFixed(1)} kW</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{efficiency.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="h-[300px] mt-4 border rounded-md p-4 bg-white">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">Loading data...</p>
                    </div>
                  ) : historicalData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          domain={[0, "auto"]}
                          tick={{ fontSize: 12 }}
                          label={{ value: "Power (kW)", angle: -90, position: "insideLeft", fontSize: 12 }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[0, "auto"]}
                          tick={{ fontSize: 12 }}
                          label={{ value: "Current (A)", angle: 90, position: "insideRight", fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value, name) => [`${Number(value).toFixed(2)}`, name]}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            border: "1px solid #f0f0f0",
                            borderRadius: "4px",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Power"
                          stroke={lineColors.Power}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Current"
                          stroke={lineColors.Current}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No data available</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/20 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Phase L1</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current:</span>
                        <span>{Number.parseFloat(mqttData[siteData.currentTopics[0]] || "0").toFixed(1)} A</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Voltage:</span>
                        <span>{Number.parseFloat(mqttData[siteData.voltageTopics[0]] || "0").toFixed(1)} V</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Power:</span>
                        <span>
                          {(Number.parseFloat(mqttData[siteData.powerTopics[0]] || "0") / 1000).toFixed(1)} kW
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Phase L2</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current:</span>
                        <span>{Number.parseFloat(mqttData[siteData.currentTopics[1]] || "0").toFixed(1)} A</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Voltage:</span>
                        <span>{Number.parseFloat(mqttData[siteData.voltageTopics[1]] || "0").toFixed(1)} V</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Power:</span>
                        <span>
                          {(Number.parseFloat(mqttData[siteData.powerTopics[1]] || "0") / 1000).toFixed(1)} kW
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Phase L3</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current:</span>
                        <span>{Number.parseFloat(mqttData[siteData.currentTopics[2]] || "0").toFixed(1)} A</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Voltage:</span>
                        <span>{Number.parseFloat(mqttData[siteData.voltageTopics[2]] || "0").toFixed(1)} V</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Power:</span>
                        <span>
                          {(Number.parseFloat(mqttData[siteData.powerTopics[2]] || "0") / 1000).toFixed(1)} kW
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="detailed" className="space-y-6">
                {/* Current Graph */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <span className="mr-2">Current (A)</span>
                    {currentData.length > 0 &&
                      Math.max(...currentData.map((d) => Math.max(d.L1 || 0, d.L2 || 0, d.L3 || 0))) > 40 && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                  </h3>
                  <div className="h-[200px] border rounded-md p-4 bg-white">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Loading data...</p>
                      </div>
                    ) : currentData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={currentData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, "auto"]} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(2)} A`, ""]}
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              border: "1px solid #f0f0f0",
                              borderRadius: "4px",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          <ReferenceLine
                            y={40}
                            stroke="red"
                            strokeDasharray="3 3"
                            label={{ value: "Max Safe", position: "insideBottomRight", fontSize: 10 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="L1"
                            stroke={lineColors.L1}
                            strokeWidth={2}
                            dot={false}
                            name="L1 Current"
                          />
                          <Line
                            type="monotone"
                            dataKey="L2"
                            stroke={lineColors.L2}
                            strokeWidth={2}
                            dot={false}
                            name="L2 Current"
                          />
                          <Line
                            type="monotone"
                            dataKey="L3"
                            stroke={lineColors.L3}
                            strokeWidth={2}
                            dot={false}
                            name="L3 Current"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">No current data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Power Graph */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <span className="mr-2">Active Power (kW)</span>
                    {powerData.length > 0 &&
                      Math.max(...powerData.map((d) => Math.max(d.L1 || 0, d.L2 || 0, d.L3 || 0))) > 30 && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                  </h3>
                  <div className="h-[200px] border rounded-md p-4 bg-white">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Loading data...</p>
                      </div>
                    ) : powerData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={powerData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, "auto"]} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(2)} kW`, ""]}
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              border: "1px solid #f0f0f0",
                              borderRadius: "4px",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          <ReferenceLine
                            y={30}
                            stroke="red"
                            strokeDasharray="3 3"
                            label={{ value: "Max Safe", position: "insideBottomRight", fontSize: 10 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="L1"
                            stroke={lineColors.L1}
                            strokeWidth={2}
                            dot={false}
                            name="L1 Power"
                          />
                          <Line
                            type="monotone"
                            dataKey="L2"
                            stroke={lineColors.L2}
                            strokeWidth={2}
                            dot={false}
                            name="L2 Power"
                          />
                          <Line
                            type="monotone"
                            dataKey="L3"
                            stroke={lineColors.L3}
                            strokeWidth={2}
                            dot={false}
                            name="L3 Power"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">No power data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Voltage Graph */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <span className="mr-2">Voltage (V)</span>
                    {voltageData.length > 0 &&
                      voltageData.some(
                        (d) =>
                          (d.V1 && (d.V1 < 210 || d.V1 > 240)) ||
                          (d.V2 && (d.V2 < 210 || d.V2 > 240)) ||
                          (d.V3 && (d.V3 < 210 || d.V3 > 240)),
                      ) && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  </h3>
                  <div className="h-[200px] border rounded-md p-4 bg-white">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Loading data...</p>
                      </div>
                    ) : voltageData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={voltageData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis domain={[200, 250]} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(1)} V`, ""]}
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              border: "1px solid #f0f0f0",
                              borderRadius: "4px",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          <ReferenceLine
                            y={240}
                            stroke="red"
                            strokeDasharray="3 3"
                            label={{ value: "Max", position: "insideBottomRight", fontSize: 10 }}
                          />
                          <ReferenceLine
                            y={210}
                            stroke="red"
                            strokeDasharray="3 3"
                            label={{ value: "Min", position: "insideTopRight", fontSize: 10 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="V1"
                            stroke={lineColors.V1}
                            strokeWidth={2}
                            dot={false}
                            name="V1 Voltage"
                          />
                          <Line
                            type="monotone"
                            dataKey="V2"
                            stroke={lineColors.V2}
                            strokeWidth={2}
                            dot={false}
                            name="V2 Voltage"
                          />
                          <Line
                            type="monotone"
                            dataKey="V3"
                            stroke={lineColors.V3}
                            strokeWidth={2}
                            dot={false}
                            name="V3 Voltage"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">No voltage data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Power and Energy Graph */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Total Power & Energy</h3>
                  <div className="h-[200px] border rounded-md p-4 bg-white">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Loading data...</p>
                      </div>
                    ) : totalPowerData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={totalPowerData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            domain={[0, "auto"]}
                            tick={{ fontSize: 12 }}
                            label={{ value: "Power (kW)", angle: -90, position: "insideLeft", fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, "auto"]}
                            tick={{ fontSize: 12 }}
                            label={{ value: "Energy (kWh)", angle: 90, position: "insideRight", fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              `${Number(value).toFixed(2)} ${name === "Total Active Power" ? "kW" : "kWh"}`,
                              name,
                            ]}
                            contentStyle={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              border: "1px solid #f0f0f0",
                              borderRadius: "4px",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            }}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Total Active Power"
                            stroke={lineColors["Total Active Power"]}
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="Positive Active Energy"
                            stroke={lineColors["Positive Active Energy"]}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">No total power data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold">{powerUtilization.toFixed(1)}%</span>
              <span className={`font-medium ${getStatusColor(status)}`}>{status}</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Power Utilization</p>
              <Progress
                value={powerUtilization}
                className="h-2"
                indicatorClassName={
                  powerUtilization > 90 ? "bg-red-500" : powerUtilization > 75 ? "bg-amber-500" : "bg-green-500"
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Consumption</p>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{consumption.toFixed(1)} kW</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Efficiency</p>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{efficiency.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

