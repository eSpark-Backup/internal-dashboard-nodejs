import pool from "../../../config/db.js"
import { logger } from "../../../helpers/logger.js"
import PdfPrinter from "pdfmake"
import { fonts } from "../../../constants/index.js"

const getClientTimeTrackingReport = async (req, res) => {
  const { email: clientEmail } = req.user
  const { year, month, e_email: employeeEmail } = req.query
  let client

  try {
    client = await pool.connect()

    const clientResult = await client.query(`SELECT id FROM eSparkTalentAPI_client WHERE email = $1`, [clientEmail])

    if (clientResult.rowCount === 0) {
      return res.status(404).json({ message: "Client not found" })
    }

    const clientId = clientResult.rows[0]?.id

    const empResult = await client.query(`SELECT id FROM eSparkTalentAPI_employee WHERE email = $1`, [employeeEmail])

    if (empResult.rowCount === 0) {
      return res.status(404).json({ message: "Employee not found" })
    }

    const employeeId = empResult.rows[0]?.id

    let query = `
      SELECT record FROM eSparkTalentAPI_time_sheet
      WHERE employee_id = $1 AND client_id = $2
    `
    const queryParams = [employeeId, clientId]

    if (year && month) {
      query += ` AND month = $3 AND year = $4`
      queryParams.push(month, year)
    } else if (year) {
      query += ` AND year = $3`
      queryParams.push(year)
    }

    const result = await client.query(query, queryParams)

    const timeSheet = []
    for (const row of result.rows) {
      const record = row?.record || {}
      for (const date in record) {
        timeSheet.push({
          date,
          ...record[date],
        })
      }
    }

    const empDetailsResult = await client.query(
      `SELECT employee_id, first_name, last_name, job_title, email FROM eSparkTalentAPI_employee WHERE id = $1`,
      [employeeId],
    )

    const empDetails = empDetailsResult.rows[0] || {}
    const employeeName = `${empDetails.first_name || ""} ${empDetails.last_name || ""}`.trim()
    const employeeIdStr = empDetails.employee_id || ""
    const designation = empDetails.job_title || ""
    const empEmailDb = empDetails.email || ""

    const monthStr = month || ""
    const yearStr = year || ""

    const docDefinition = buildAttendanceReportPdfmake({
      employeeName,
      employeeId: employeeIdStr,
      designation,
      email: empEmailDb,
      month: monthStr,
      year: yearStr,
      timeSheet,
      pageOrientation: "landscape",
    })

    const printer = new PdfPrinter(fonts)
    const pdfDoc = printer.createPdfKitDocument(docDefinition)

    const chunks = []
    pdfDoc.on("data", (chunk) => chunks.push(chunk))
    pdfDoc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks)
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", "attachment; filename=attendance_report.pdf")
      res.send(pdfBuffer)
    })

    pdfDoc.end()
    return
  } catch (err) {
    logger.error("Error in getClientTimeTracking:", err)
    return res.status(500).json({ message: "Internal server error" })
  } finally {
    if (client) client.release()
  }
}


function buildAttendanceReportPdfmake({
  employeeName,
  employeeId,
  designation,
  email,
  month,
  year,
  timeSheet,
  pageOrientation,
}) {
  // Status legend with exact colors from the image
  const statusLegend = [
    { label: "Present", code: "P", color: "#4CAF50" },
    { label: "Missing", code: "M", color: "#F44336" },
    { label: "Absent", code: "A", color: "#D32F2F" },
    { label: "Short Duration", code: "S", color: "#FF9800" },
    { label: "Day Off", code: "D", color: "#00BCD4" },
    { label: "Full Leave", code: "L", color: "#4CAF50" },
  ]

  // Status mapping based on Python code logic
  const statusMap = {
    Present: "P",
    Missing: "M",
    Absent: "A",
    "Short Duration": "S",
    "Day Off": "D",
    "Full Leave": "L",
  }


  function extractStatusCodes(statusObj) {
    if (!statusObj || typeof statusObj !== "object") {
      return ["-"]
    }

    const activeCodes = []
    const statusFlags = ["Present", "Missing", "Absent", "Short Duration", "Day Off", "Full Leave"]

    for (const flag of statusFlags) {
      if (statusObj[flag] === true || statusObj[flag] === 1) {
        activeCodes.push(statusMap[flag])
      }
    }

    return activeCodes.length > 0 ? activeCodes : ["-"]
  }

 
  function getDayOfWeek(dateStr) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    let d
    if (dateStr.includes("-")) {
      const parts = dateStr.split("-")
      if (parts[0].length === 4) {
        d = new Date(dateStr)
      } else {
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      }
    } else {
      d = new Date(dateStr)
    }
    return days[d.getDay()] || "Unknown"
  }


  function createStatusCircle(color, letter) {
    return {
      stack: [
        {
          canvas: [{ type: "ellipse", x: 8, y: 8, color: color, r1: 8, r2: 8 }],
          width: 16,
          height: 16,
        },
        {
          text: letter,
          bold: true,
          color: "white",
          fontSize: 10,
          alignment: "center",
          margin: [0, -14, 0, 0],
        },
      ],
      width: 16,
      height: 16,
    }
  }

 
  function createTableStatusCircle(color, letter) {
    return {
      stack: [
        {
          canvas: [{ type: "ellipse", x: 10, y: 10, color: color, r1: 10, r2: 10 }],
          width: 20,
          height: 20,
          alignment: "center",
        },
        {
          text: letter,
          alignment: "center",
          color: "white",
          bold: true,
          fontSize: 10,
          margin: [0, -16, 0, 0],
        },
      ],
      alignment: "center",
    }
  }


  const tableHeaders = [
    { text: "Date", style: "tableHeader" },
    { text: "Day", style: "tableHeader" },
    { text: "Check-in", style: "tableHeader" },
    { text: "Check-out", style: "tableHeader" },
    { text: "Hours worked", style: "tableHeader" },
    { text: "Overtime", style: "tableHeader" },
    { text: "Status", style: "tableHeader" },
  ]

 
  const tableBody = [tableHeaders]

  for (const row of timeSheet) {
    const statusCodes = extractStatusCodes(row.status)

    let statusCell
    if (statusCodes[0] === "-") {
      statusCell = { text: "-", alignment: "center", color: "#666666" }
    } else {
      const statusObj = statusLegend.find((s) => s.code === statusCodes[0])
      const statusColor = statusObj ? statusObj.color : "#666666"
      statusCell = createTableStatusCircle(statusColor, statusCodes[0])
    }

    tableBody.push([
      { text: row.date || "-", alignment: "center" },
      { text: getDayOfWeek(row.date) || "-", alignment: "center" },
      { text: row.check_in || "-", alignment: "center" },
      { text: row.check_out || "-", alignment: "center" },
      { text: row.hours_worked || "-", alignment: "center" },
      { text: row.overtime || "-", alignment: "center" },
      statusCell,
    ])
  }

  return {
    pageSize: "A4",
    pageOrientation: pageOrientation || "landscape",
    pageMargins: [40, 40, 40, 40],
    content: [
      // Title exactly like in the image
      {
        text: "Attendance Report",
        fontSize: 20,
        bold: true,
        alignment: "center",
        color: "#333333",
        margin: [0, 20, 0, 30],
      },

      // Employee info section exactly like in the image
      {
        columns: [
          {
            stack: [
              {
                text: `Employee Name: ${employeeName}`,
                fontSize: 12,
                color: "#333333",
                margin: [0, 0, 0, 8],
              },
              {
                text: `Email: ${email}`,
                fontSize: 12,
                color: "#333333",
                margin: [0, 0, 0, 8],
              },
              {
                text: `Month: ${month}`,
                fontSize: 12,
                color: "#333333",
                margin: [0, 0, 0, 8],
              },
            ],
            width: "50%",
          },
          {
            stack: [
              {
                text: `Employee ID: ${employeeId}`,
                fontSize: 12,
                color: "#333333",
                margin: [0, 0, 0, 8],
              },
              {
                text: `Designation: ${designation}`,
                fontSize: 12,
                color: "#333333",
                margin: [0, 0, 0, 8],
              },
              {
                text: `Year: ${year}`,
                fontSize: 12,
                color: "#333333",
                margin: [0, 0, 0, 8],
              },
            ],
            width: "50%",
          },
        ],
        columnGap: 40,
        margin: [0, 0, 0, 25],
      },

    
      {
        columns: [
          createStatusCircle("#4CAF50", "P"),
          { text: "Present", fontSize: 11, margin: [4, 2, 12, 0] },
          createStatusCircle("#F44336", "M"),
          { text: "Missing", fontSize: 11, margin: [4, 2, 12, 0] },
          createStatusCircle("#D32F2F", "A"),
          { text: "Absent", fontSize: 11, margin: [4, 2, 12, 0] },
          createStatusCircle("#FF9800", "S"),
          { text: "Short Duration", fontSize: 11, margin: [4, 2, 12, 0] },
          createStatusCircle("#00BCD4", "D"),
          { text: "Day Off", fontSize: 11, margin: [4, 2, 12, 0] },
          createStatusCircle("#4CAF50", "L"),
          { text: "Full Leave", fontSize: 11, margin: [4, 2, 0, 0] },
        ],
        columnGap: 0,
        margin: [0, 0, 0, 20],
      },

      {
        table: {
          headerRows: 1,
          widths: [75, 75, 75, 75, 85, 75, 75], 
          body: tableBody,
          dontBreakRows: true, 
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return "#808080" 
            return null
          },
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 0, 0, 20],
        alignment: "center", 
      },
    ],
    styles: {
      tableHeader: {
        alignment: "center",
        bold: true,
        color: "white",
        fontSize: 11,
      },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      color: "#333333",
    },
  }
}

export default getClientTimeTrackingReport
