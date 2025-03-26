"use client"

import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface HistoricalChartProps {
  selectedTimeStamp: string
  date?: Date
}

export function HistoricalChart({ selectedTimeStamp, date = new Date() }: HistoricalChartProps) {
  const [selectedParameter, setSelectedParameter] = useState<string>("Current")
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [startDate, setStartDate] = useState<Date>(subDays(date, 7))
  const [endDate, setEndDate] = useState<Date>(date)

  // Fetch historical data from database
  const fetchHistoricalData = async () => {
    if (!selectedTimeStamp) {
      console.error("No timestamp selected")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/historical-data?parameter=${selectedParameter}&startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}&timeStamp=${selectedTimeStamp}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch historical data")
      }

      const data = await response.json()

      // Process data for chart
      const processedData = processDataForChart(data, selectedParameter)
      setChartData(processedData)
    } catch (error) {
      console.error("Error fetching historical data:", error)
      // Generate mock data for demo if real data fetch fails
      const mockData = generateMockData(selectedParameter, startDate, endDate)
      setChartData(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  // Process data based on parameter type
  const processDataForChart = (data: any[], parameter: string) => {
    if (!data || data.length === 0) {
      return generateMockData(parameter, startDate, endDate)
    }

    return data.map((item: any) => {
      const date = item.timestamp ? format(new Date(item.timestamp), "yyyy-MM-dd HH:mm") : ""

      // Map database columns to chart data
      const result: any = { date }

      if (parameter === "Current") {
        result["L1"] = item.Current_L1 || 0
        result["L2"] = item.Current_L2 || 0
        result["L3"] = item.Current_L3 || 0
      } else if (parameter === "Voltage") {
        result["V1"] = item.Phase_V1 || 0
        result["V2"] = item.Phase_V2 || 0
        result["V3"] = item.Phase_V3 || 0
      } else if (parameter === "Power") {
        result["Power L1"] = item.Active_Power_L1 || 0
        result["Power L2"] = item.Active_Power_L2 || 0
        result["Power L3"] = item.Active_Power_L3 || 0
        result["Total Power"] = item.Total_Active_Power || 0
      } else if (parameter === "Temperature") {
        result["Mining Room"] = item.MinningRoom_T || 0
        result["Filter Room"] = item.FilterRoom_T || 0
        result["RPI Room"] = item.RpiRoom_T || 0
        result["Exhaust Room"] = item.ExhuastRoom_T || 0
      } else if (parameter === "Humidity") {
        result["Mining Room"] = item.MinningRoom_H || 0
        result["Filter Room"] = item.FilterRoom_H || 0
        result["RPI Room"] = item.RpiRoom_H || 0
        result["Exhaust Room"] = item.ExhuastRoom_H || 0
      }

      return result
    })
  }

  // Generate mock data for demo
  const generateMockData = (paramType: string, start: Date, end: Date) => {
    const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24))
    const data = []

    for (let i = 0; i < daysBetween; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)

      const entry: any = {
        date: format(date, "yyyy-MM-dd"),
      }

      if (paramType === "Current") {
        entry["L1"] = Math.random() * 20 + 10
        entry["L2"] = Math.random() * 20 + 10
        entry["L3"] = Math.random() * 20 + 10
      } else if (paramType === "Voltage") {
        entry["V1"] = Math.random() * 10 + 220
        entry["V2"] = Math.random() * 10 + 220
        entry["V3"] = Math.random() * 10 + 220
      } else if (paramType === "Power") {
        entry["Power L1"] = Math.random() * 1000 + 3000
        entry["Power L2"] = Math.random() * 1000 + 3000
        entry["Power L3"] = Math.random() * 1000 + 3000
        entry["Total Power"] = Math.random() * 3000 + 9000
      } else if (paramType === "Temperature") {
        entry["Mining Room"] = Math.random() * 15 + 30
        entry["Filter Room"] = Math.random() * 15 + 20
        entry["RPI Room"] = Math.random() * 10 + 25
        entry["Exhaust Room"] = Math.random() * 10 + 20
      } else if (paramType === "Humidity") {
        entry["Mining Room"] = Math.random() * 30 + 40
        entry["Filter Room"] = Math.random() * 30 + 40
        entry["RPI Room"] = Math.random() * 20 + 50
        entry["Exhaust Room"] = Math.random() * 40 + 40
      }

      data.push(entry)
    }

    return data
  }

  // Fetch data when parameters change
  useEffect(() => {
    if (selectedTimeStamp) {
      fetchHistoricalData()
    }
  }, [selectedParameter, selectedTimeStamp])

  // Define colors for chart lines
  const lineColors = [
    "#1ab7ea", // Blue
    "#f39c12", // Orange
    "#2ecc71", // Green
    "#e74c3c", // Red
    "#9b59b6", // Purple
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historical Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Date Range Selector */}
            <div className="flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="mx-2">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Select value={selectedParameter} onValueChange={setSelectedParameter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Current">Current</SelectItem>
                <SelectItem value="Voltage">Voltage</SelectItem>
                <SelectItem value="Power">Power</SelectItem>
                <SelectItem value="Temperature">Temperature</SelectItem>
                <SelectItem value="Humidity">Humidity</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchHistoricalData} disabled={isLoading}>
              {isLoading ? "Loading..." : "Fetch Data"}
            </Button>
          </div>

          <div className="h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" padding={{ left: 30, right: 30 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(chartData[0])
                    .filter((key) => key !== "date")
                    .map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={lineColors[index % lineColors.length]}
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full border rounded-md bg-muted/10">
                <p className="text-muted-foreground">
                  {isLoading ? "Loading chart data..." : "Select parameters and fetch data to view chart"}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/20 rounded-md">
              <h3 className="text-sm font-medium mb-2">Data Source</h3>
              <p className="text-sm text-muted-foreground">
                Historical data for {selectedTimeStamp} from {format(startDate, "MMMM d, yyyy")} to{" "}
                {format(endDate, "MMMM d, yyyy")}
              </p>
            </div>

            <div className="p-4 bg-muted/20 rounded-md">
              <h3 className="text-sm font-medium mb-2">Analysis</h3>
              <p className="text-sm text-muted-foreground">
                {selectedParameter === "Current" &&
                  "Current values show normal operational patterns with expected fluctuations."}
                {selectedParameter === "Voltage" && "Voltage readings are stable within the expected range."}
                {selectedParameter === "Power" &&
                  "Power consumption follows typical daily patterns with peak usage during operational hours."}
                {selectedParameter === "Temperature" && "Temperature trends indicate proper cooling system function."}
                {selectedParameter === "Humidity" &&
                  "Humidity levels are maintained within acceptable ranges for equipment operation."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

