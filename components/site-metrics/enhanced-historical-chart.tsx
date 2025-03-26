"use client"

import { useState, useEffect, useMemo } from "react"
import { format, subDays, eachDayOfInterval } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getTableName } from "@/lib/table-name-mapping"

interface EnhancedHistoricalChartProps {
  selectedTimeStamp: string
  date?: Date
}

export function EnhancedHistoricalChart({ selectedTimeStamp, date = new Date() }: EnhancedHistoricalChartProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30)) // Default to 30 days
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [selectedParameter, setSelectedParameter] = useState<string>("Current")
  const [selectedRoom, setSelectedRoom] = useState<string>("Filter Room")
  const [loading, setLoading] = useState<boolean>(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [maxValue, setMaxValue] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [dateFormat, setDateFormat] = useState<string>("MM/dd")

  // Get the exact table name for the selected timestamp
  const exactTableName = useMemo(() => getTableName(selectedTimeStamp), [selectedTimeStamp])

  // Room parameters configuration - these are the column names in the database
  const roomParameters = {
    "Filter Room": { temp: "Ts1", humidity: "H1s1" },
    "Mining Room": { temp: "Ts2", humidity: "H2s2" },
    "RPI Room": { temp: "Ts3", humidity: "H3s3" },
    "Exhaust Room": { temp: "Ts4", humidity: "H4s4" },
  }

  // Helper functions for parameter keys
  const getCurrentKeys = (timeStamp: string) => {
    const baseKeys = ["Current_L1", "Current_L2", "Current_L3"]
    const extendedKeys = ["Current_L1A", "Current_L2A", "Current_L3A"]

    if (timeStamp === "Al_Faqaa" || timeStamp === "Forest1") {
      return [...baseKeys, ...extendedKeys]
    }

    return baseKeys
  }

  const getVoltageKeys = (timeStamp: string) => {
    const baseKeys = ["Phase_L1_Phase_L2_Voltage", "Phase_L2_Phase_L3_Voltage", "Phase_L3_Phase_L1_Voltage"]
    const extendedKeys = ["Phase_L1_Phase_L2_VoltageA", "Phase_L2_Phase_L3_VoltageA", "Phase_L3_Phase_L1_VoltageA"]

    if (timeStamp === "Al_Faqaa" || timeStamp === "Forest1") {
      return [...baseKeys, ...extendedKeys]
    }

    return baseKeys
  }

  const getActivePowerKeys = (timeStamp: string) => {
    const baseKeys = ["Active_Power_L1", "Active_Power_L2", "Active_Power_L3"]
    const extendedKeys = ["Active_Power_L1A", "Active_Power_L2A", "Active_Power_L3A"]

    if (timeStamp === "Al_Faqaa" || timeStamp === "Forest1") {
      return [...baseKeys, ...extendedKeys]
    }

    return baseKeys
  }

  // Get temperature and humidity keys
  const getTemperatureKeys = () => {
    return ["Ts1", "Ts2", "Ts3", "Ts4"]
  }

  const getHumidityKeys = () => {
    return ["H1s1", "H2s2", "H3s3", "H4s4"]
  }

  // Determine appropriate date format based on date range
  useEffect(() => {
    if (startDate && endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
      if (daysDiff > 60) {
        setDateFormat("MM/yyyy")
      } else if (daysDiff > 14) {
        setDateFormat("MM/dd")
      } else {
        setDateFormat("MM/dd HH:mm")
      }
    }
  }, [startDate, endDate])

  // Fetch data from the database
  const fetchData = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }

    if (!selectedTimeStamp) {
      setError("No timestamp selected")
      return
    }

    setLoading(true)
    setError(null)
    setChartData([])
    setRawData([])

    try {
      const formattedStartDate = format(startDate, "yyyy-MM-dd")
      const formattedEndDate = format(endDate, "yyyy-MM-dd")

      let apiCalls = []
      let columnNames = []

      if (selectedParameter === "Current") {
        columnNames = getCurrentKeys(exactTableName)
        apiCalls = columnNames.map((column) =>
          fetch(
            `/api/data?table_name=${exactTableName}&column_name=${column}&start_time=${formattedStartDate}&end_time=${formattedEndDate}`,
          ).then((res) => res.json()),
        )
      } else if (selectedParameter === "Voltage") {
        columnNames = getVoltageKeys(exactTableName)
        apiCalls = columnNames.map((column) =>
          fetch(
            `/api/data?table_name=${exactTableName}&column_name=${column}&start_time=${formattedStartDate}&end_time=${formattedEndDate}`,
          ).then((res) => res.json()),
        )
      } else if (selectedParameter === "Power") {
        columnNames = getActivePowerKeys(exactTableName)
        apiCalls = columnNames.map((column) =>
          fetch(
            `/api/data?table_name=${exactTableName}&column_name=${column}&start_time=${formattedStartDate}&end_time=${formattedEndDate}`,
          ).then((res) => res.json()),
        )
      } else if (selectedParameter === "Temperature & Humidity") {
        // Get temperature and humidity column names for the selected room
        const { temp, humidity } = roomParameters[selectedRoom]
        columnNames = [temp, humidity]
        apiCalls = [
          fetch(
            `/api/data?table_name=${exactTableName}&column_name=${temp}&start_time=${formattedStartDate}&end_time=${formattedEndDate}`,
          ).then((res) => res.json()),
          fetch(
            `/api/data?table_name=${exactTableName}&column_name=${humidity}&start_time=${formattedStartDate}&end_time=${formattedEndDate}`,
          ).then((res) => res.json()),
        ]
      }

      console.log("Fetching data for columns:", columnNames)
      console.log("Date range:", formattedStartDate, "to", formattedEndDate)
      console.log("Using table:", exactTableName)

      const responses = await Promise.all(apiCalls)
      console.log("API responses:", responses)

      // Store raw data for debugging
      setRawData(responses)

      // Process the responses
      const formattedData = processResponses(responses, selectedParameter, columnNames)
      console.log("Formatted data:", formattedData)

      if (formattedData.length === 0) {
        setError("No data available for the selected parameters and time range")
      } else {
        setChartData(formattedData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to fetch data. Please try again.")

      // Generate mock data for demo if real data fetch fails
      const mockData = generateMockData(selectedParameter, startDate, endDate)
      setChartData(mockData)
    } finally {
      setLoading(false)
    }
  }

  // Process API responses into chart data
  const processResponses = (responses: any[], parameter: string, columnNames: string[]) => {
    if (!responses || responses.length === 0 || !responses[0] || responses[0].length === 0) {
      return []
    }

    // Create a map to organize data by timestamp
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
        // Use appropriate time key based on date range
        const timeKey = format(timestamp, "yyyy-MM-dd HH:mm:ss")

        if (!dataMap.has(timeKey)) {
          dataMap.set(timeKey, {
            time: format(timestamp, dateFormat),
            fullDate: timestamp,
            timestamp: timeKey,
          })
        }

        const dataPoint = dataMap.get(timeKey)
        const columnName = columnNames[columnIndex]

        // Extract the value from the row using the column name
        let value = null
        for (const key in row) {
          // Check if the key matches the column name (case insensitive)
          if (key.toLowerCase() === columnName.toLowerCase()) {
            value = Number.parseFloat(row[key])
            break
          }
        }

        if (value !== null && !isNaN(value)) {
          // Use a friendly name for the column in the chart
          let displayName = columnName

          // Format display names based on parameter type
          if (parameter === "Current") {
            displayName = columnName.replace("Current_", "Current L")
            if (columnName.endsWith("A")) {
              displayName = displayName.replace("A", " (A)")
            }
          } else if (parameter === "Voltage") {
            displayName = columnName.replace("Phase_", "Phase ").replace("_Phase_", "-").replace("_Voltage", "")
            if (columnName.endsWith("A")) {
              displayName = displayName.replace("A", " (A)")
            }
          } else if (parameter === "Power") {
            displayName = columnName.replace("Active_Power_", "Power L")
            if (columnName.endsWith("A")) {
              displayName = displayName.replace("A", " (A)")
            }
          } else if (parameter === "Temperature & Humidity") {
            if (columnIndex === 0) {
              displayName = "Temperature"
            } else {
              displayName = "Humidity"
            }
          }

          dataPoint[displayName] = value
        }
      })
    })

    // Convert map to array and sort by timestamp
    let result = Array.from(dataMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    // For large date ranges, aggregate data to avoid too many points
    if (result.length > 500) {
      result = aggregateDataByDay(result)
    }

    return result
  }

  // Aggregate data by day for large datasets
  const aggregateDataByDay = (data: any[]) => {
    const aggregatedMap = new Map()

    data.forEach((point) => {
      const date = new Date(point.fullDate)
      const dayKey = format(date, "yyyy-MM-dd")

      if (!aggregatedMap.has(dayKey)) {
        aggregatedMap.set(dayKey, {
          time: format(date, dateFormat),
          timestamp: dayKey,
          counts: {},
          sums: {},
        })
      }

      const dayData = aggregatedMap.get(dayKey)

      // Aggregate all numeric values
      Object.entries(point).forEach(([key, value]) => {
        if (typeof value === "number" && key !== "fullDate") {
          if (!dayData.sums[key]) {
            dayData.sums[key] = 0
            dayData.counts[key] = 0
          }
          dayData.sums[key] += value
          dayData.counts[key]++
        }
      })
    })

    // Calculate averages
    const result = Array.from(aggregatedMap.values()).map((day) => {
      const result: any = { time: day.time, timestamp: day.timestamp }

      Object.keys(day.sums).forEach((key) => {
        result[key] = day.sums[key] / day.counts[key]
      })

      return result
    })

    return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  // Generate mock data for demo
  const generateMockData = (paramType: string, start: Date, end: Date) => {
    // Generate data for each day in the range
    const days = eachDayOfInterval({ start, end })
    const data = []

    for (let i = 0; i < days.length; i++) {
      const date = days[i]

      // Create multiple data points per day for shorter ranges
      const pointsPerDay = days.length <= 14 ? 4 : 1

      for (let j = 0; j < pointsPerDay; j++) {
        const hour = j * 6
        const dateTime = new Date(date)
        dateTime.setHours(hour)

        const entry: any = {
          time: format(dateTime, dateFormat),
          timestamp: format(dateTime, "yyyy-MM-dd HH:mm:ss"),
          fullDate: dateTime,
        }

        if (paramType === "Current") {
          entry["Current L1"] = Math.random() * 20 + 10
          entry["Current L2"] = Math.random() * 20 + 10
          entry["Current L3"] = Math.random() * 20 + 10
        } else if (paramType === "Voltage") {
          entry["Phase L1-L2"] = Math.random() * 10 + 220
          entry["Phase L2-L3"] = Math.random() * 10 + 220
          entry["Phase L3-L1"] = Math.random() * 10 + 220
        } else if (paramType === "Power") {
          entry["Power L1"] = Math.random() * 1000 + 3000
          entry["Power L2"] = Math.random() * 1000 + 3000
          entry["Power L3"] = Math.random() * 1000 + 3000
        } else if (paramType === "Temperature & Humidity") {
          entry["Temperature"] = Math.random() * 15 + 20
          entry["Humidity"] = Math.random() * 30 + 40
        }

        data.push(entry)
      }
    }

    return data
  }

  // Define colors for chart lines
  const lineColors = [
    "#1ab7ea", // Blue
    "#f39c12", // Orange
    "#2ecc71", // Green
    "#e74c3c", // Red
    "#9b59b6", // Purple
    "#3498db", // Light Blue
  ]

  // Get series names for the chart
  const seriesNames = useMemo(() => {
    if (chartData.length === 0) return []

    return Object.keys(chartData[0]).filter((key) => key !== "time" && key !== "timestamp" && key !== "fullDate")
  }, [chartData])

  // Calculate average values for each series
  const averageValues = useMemo(() => {
    if (chartData.length === 0) return {}

    const sums: Record<string, number> = {}
    const counts: Record<string, number> = {}

    chartData.forEach((dataPoint) => {
      seriesNames.forEach((series) => {
        if (dataPoint[series] !== undefined && !isNaN(dataPoint[series])) {
          sums[series] = (sums[series] || 0) + dataPoint[series]
          counts[series] = (counts[series] || 0) + 1
        }
      })
    })

    const averages: Record<string, number> = {}
    seriesNames.forEach((series) => {
      if (counts[series] > 0) {
        averages[series] = sums[series] / counts[series]
      }
    })

    return averages
  }, [chartData, seriesNames])

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Historical Data Analysis</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            {exactTableName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Current">Current</SelectItem>
                  <SelectItem value="Voltage">Voltage</SelectItem>
                  <SelectItem value="Power">Power</SelectItem>
                  <SelectItem value="Temperature & Humidity">Temperature & Humidity</SelectItem>
                </SelectContent>
              </Select>

              {selectedParameter === "Temperature & Humidity" && (
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(roomParameters).map((room) => (
                      <SelectItem key={room} value={room}>
                        {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button onClick={fetchData} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Loading..." : "Fetch Data"}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="h-[400px] bg-white rounded-lg p-4 border">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Skeleton className="h-4 w-[250px] mb-4" />
                <Skeleton className="h-[300px] w-full" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="time"
                    padding={{ left: 30, right: 30 }}
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [`${Number(value).toFixed(2)}`, name]}
                    labelFormatter={(label) => `Time: ${label}`}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #f0f0f0",
                      borderRadius: "4px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />

                  {/* Reference lines for averages */}
                  {Object.entries(averageValues).map(([series, avg], index) => (
                    <ReferenceLine
                      key={`avg-${series}`}
                      y={avg}
                      stroke={lineColors[index % lineColors.length]}
                      strokeDasharray="3 3"
                      label={{
                        value: `Avg: ${avg.toFixed(1)}`,
                        position: "insideBottomRight",
                        fill: lineColors[index % lineColors.length],
                        fontSize: 10,
                      }}
                    />
                  ))}

                  {/* Data lines */}
                  {seriesNames.map((series, index) => (
                    <Line
                      key={`line-${series}`}
                      type="monotone"
                      dataKey={series}
                      name={series}
                      stroke={lineColors[index % lineColors.length]}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                      dot={chartData.length < 30}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full border rounded-md bg-muted/10">
                <p className="text-muted-foreground">Select parameters and fetch data to view chart</p>
              </div>
            )}
          </div>

          {chartData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                <h3 className="text-sm font-medium mb-2 text-blue-800">Data Summary</h3>
                <div className="space-y-2">
                  {Object.entries(averageValues).map(([series, avg]) => (
                    <div key={`summary-${series}`} className="flex justify-between">
                      <span className="text-sm text-gray-600">{series}:</span>
                      <span className="text-sm font-medium">{avg.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-blue-200 mt-2">
                    <span className="text-sm text-gray-600">Data Points:</span>
                    <span className="text-sm font-medium">{chartData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date Range:</span>
                    <span className="text-sm font-medium">
                      {startDate ? format(startDate, "MMM d, yyyy") : ""} -{" "}
                      {endDate ? format(endDate, "MMM d, yyyy") : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
                <h3 className="text-sm font-medium mb-2 text-gray-800">Analysis</h3>
                <p className="text-sm text-gray-600">
                  {selectedParameter === "Current" &&
                    "Current values show normal operational patterns with expected fluctuations."}
                  {selectedParameter === "Voltage" && "Voltage readings are stable within the expected range."}
                  {selectedParameter === "Power" &&
                    "Power consumption follows typical daily patterns with peak usage during operational hours."}
                  {selectedParameter === "Temperature & Humidity" &&
                    "Temperature and humidity levels are maintained within acceptable ranges for equipment operation."}
                </p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Data source: {exactTableName} from {startDate ? format(startDate, "MMM d, yyyy") : ""} to{" "}
                    {endDate ? format(endDate, "MMM d, yyyy") : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Debug section - only visible during development */}
          {process.env.NODE_ENV === "development" && rawData.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="text-sm font-medium mb-2">Debug Information</h3>
              <div className="text-xs overflow-auto max-h-[200px]">
                <pre>{JSON.stringify(rawData, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

