import { NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { getTableName } from "@/lib/table-name-mapping"

// Database configuration
const dbConfig = {
  host: "db-mysql-blr1-31793-do-user-14813500-0.j.db.ondigitalocean.com",
  user: "hamza",
  password: process.env.DB_PASSWORD || "AVNS_0MOOB8V7vDk-r7Wl4E6", // Use environment variable if available
  database: "hosting",
  port: 25060,
  ssl: {
    // Disable SSL certificate verification
    rejectUnauthorized: false,
  },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parameter = searchParams.get("parameter")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const timeStamp = searchParams.get("timeStamp")
  const limit = searchParams.get("limit") || "5000" // Increased default limit

  if (!parameter || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  try {
    // Create a MySQL connection
    const connection = await mysql.createConnection(dbConfig)

    // Get the exact table name
    const tableName = getTableName(timeStamp || "")

    // Map parameter to column names
    const columnNames = mapParameterToColumnNames(parameter, timeStamp || "")

    // Calculate the date range in days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24))

    // Safely format column names for SQL query
    const safeColumnNames = columnNames.map((col) => `\`${col.replace(/`/g, "``")}\``).join(", ")

    // Prepare and execute query with appropriate sampling based on date range
    let query = ""

    if (daysDiff > 30) {
      // For large date ranges, sample data (one point per day)
      const avgColumns = columnNames
        .map((col) => `AVG(\`${col.replace(/`/g, "``")}\`) as \`${col.replace(/`/g, "``")}\``)
        .join(", ")
      query = `
        SELECT 
          DATE(timestamp) as timestamp,
          ${avgColumns}
        FROM ${tableName}
        WHERE timestamp BETWEEN ? AND ?
        GROUP BY DATE(timestamp)
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `
    } else if (daysDiff > 7) {
      // For medium date ranges, sample data (a few points per day)
      const avgColumns = columnNames
        .map((col) => `AVG(\`${col.replace(/`/g, "``")}\`) as \`${col.replace(/`/g, "``")}\``)
        .join(", ")
      query = `
        SELECT 
          DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as timestamp,
          ${avgColumns}
        FROM ${tableName}
        WHERE timestamp BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `
    } else {
      // For short date ranges, get all data points
      query = `
        SELECT timestamp, ${safeColumnNames}
        FROM ${tableName}
        WHERE timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `
    }

    console.log("Executing query:", query.replace(/\s+/g, " ").trim())
    console.log("With parameters:", [`${startDate} 00:00:00`, `${endDate} 23:59:59`])

    const [rows] = await connection.execute(query, [`${startDate} 00:00:00`, `${endDate} 23:59:59`])

    // Close connection
    await connection.end()

    // Return results
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch data from database",
        details: error instanceof Error ? error.message : String(error),
        query_params: { parameter, startDate, endDate, timeStamp },
      },
      { status: 500 },
    )
  }
}

function mapParameterToColumnNames(parameter: string, timeStamp: string): string[] {
  // Get the exact table name
  const tableName = getTableName(timeStamp)

  // This function maps the selected parameter to the appropriate columns
  switch (parameter) {
    case "Current":
      if (tableName === "Al_Faqaa" || tableName === "Forest1") {
        return ["Current_L1", "Current_L2", "Current_L3", "Current_L1A", "Current_L2A", "Current_L3A"]
      }
      return ["Current_L1", "Current_L2", "Current_L3"]

    case "Voltage":
      if (tableName === "Al_Faqaa" || tableName === "Forest1") {
        return [
          "Phase_L1_Phase_L2_Voltage",
          "Phase_L2_Phase_L3_Voltage",
          "Phase_L3_Phase_L1_Voltage",
          "Phase_L1_Phase_L2_VoltageA",
          "Phase_L2_Phase_L3_VoltageA",
          "Phase_L3_Phase_L1_VoltageA",
        ]
      }
      return ["Phase_L1_Phase_L2_Voltage", "Phase_L2_Phase_L3_Voltage", "Phase_L3_Phase_L1_Voltage"]

    case "Power":
      if (tableName === "Al_Faqaa" || tableName === "Forest1") {
        return [
          "Active_Power_L1",
          "Active_Power_L2",
          "Active_Power_L3",
          "Total_Active_Power",
          "Active_Power_L1A",
          "Active_Power_L2A",
          "Active_Power_L3A",
        ]
      }
      return ["Active_Power_L1", "Active_Power_L2", "Active_Power_L3", "Total_Active_Power"]

    case "Temperature":
      return ["Ts1", "Ts2", "Ts3", "Ts4"]

    case "Humidity":
      return ["H1s1", "H2s2", "H3s3", "H4s4"]

    case "Temperature & Humidity":
      return ["Ts1", "Ts2", "Ts3", "Ts4", "H1s1", "H2s2", "H3s3", "H4s4"]

    default:
      return ["Current_L1", "Current_L2", "Current_L3"]
  }
}

