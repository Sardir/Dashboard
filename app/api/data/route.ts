import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

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
  const tableName = searchParams.get("table_name")
  const columnName = searchParams.get("column_name")
  const startTime = searchParams.get("start_time")
  const endTime = searchParams.get("end_time")
  const limit = searchParams.get("limit") || "5000" // Increased default limit for longer date ranges

  // Log the received parameters for debugging
  console.log("Received parameters:", { tableName, columnName, startTime, endTime, limit })

  if (!tableName || !columnName || !startTime || !endTime) {
    return NextResponse.json(
      {
        error: "Missing required parameters",
        received: { tableName, columnName, startTime, endTime },
      },
      { status: 400 },
    )
  }

  try {
    // Create a MySQL connection
    const connection = await mysql.createConnection(dbConfig)

    // Process the column name - remove any backticks and then add them properly
    // This ensures we don't have empty column names
    const processedColumnName = columnName.replace(/`/g, "").trim()

    if (!processedColumnName) {
      return NextResponse.json(
        {
          error: "Empty column name after processing",
          original: columnName,
        },
        { status: 400 },
      )
    }

    // Format the column name for SQL
    const formattedColumnName = `\`${processedColumnName}\``

    // Calculate the date range in days
    const startDate = new Date(startTime)
    const endDate = new Date(endTime)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))

    // For large date ranges, use sampling to reduce data points
    let query = ""
    if (daysDiff > 30) {
      // For large date ranges, sample data (one point per day)
      query = `
        SELECT 
          DATE(timestamp) as day,
          AVG(${formattedColumnName}) as ${formattedColumnName}
        FROM ${tableName}
        WHERE timestamp BETWEEN ? AND ?
        GROUP BY DATE(timestamp)
        ORDER BY day ASC
        LIMIT ${limit}
      `
    } else if (daysDiff > 7) {
      // For medium date ranges, sample data (a few points per day)
      query = `
        SELECT 
          DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as timestamp,
          AVG(${formattedColumnName}) as ${formattedColumnName}
        FROM ${tableName}
        WHERE timestamp BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `
    } else {
      // For short date ranges, get all data points
      query = `
        SELECT timestamp, ${formattedColumnName}
        FROM ${tableName}
        WHERE timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
        LIMIT ${limit}
      `
    }

    console.log("Executing query:", query.replace(/\s+/g, " ").trim())
    console.log("With parameters:", [`${startTime} 00:00:00`, `${endTime} 23:59:59`])

    const [rows] = await connection.execute(query, [`${startTime} 00:00:00`, `${endTime} 23:59:59`])

    // Close connection
    await connection.end()

    // Return results
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Database error:", error)

    // Return a more detailed error response
    return NextResponse.json(
      {
        error: "Failed to fetch data from database",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query_params: { tableName, columnName, startTime, endTime },
      },
      { status: 500 },
    )
  }
}

