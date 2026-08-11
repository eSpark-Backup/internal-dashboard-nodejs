import pool from "../../../config/db.js"
import { format, parse, isWeekend } from "date-fns"

class UpdateTimeSheet {
  async updateTimeSheet() {
    while (true) {
      try {
        const now = new Date()
        const isWeekendDay = isWeekend(now)
        const currentDate = format(now, "dd-MM-yyyy")
        const currentMonth = format(now, "LLLL")
        const currentYear = now.getFullYear().toString()

        // Get all active employees
        const employeesResult = await pool.query(`
          SELECT oe.employee_id, oe.client_id 
          FROM eSparkTalentAPI_outsource_employees oe
          WHERE oe.status = 'active'
        `)

        for (const emp of employeesResult.rows) {
          const client = await pool.connect()

          try {
            await client.query("BEGIN")

            // Get employee punch timings
            const employeeResult = await client.query(
              `SELECT punch_timings FROM eSparkTalentAPI_employee WHERE id = $1`,
              [emp.employee_id],
            )

            const pTime = employeeResult.rows[0]?.punch_timings

            if (pTime) {
              if (isWeekendDay) {
                // Handle weekend
                const timeRecordResult = await client.query(
                  `SELECT * FROM eSparkTalentAPI_time_sheet 
                     WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
                  [emp.employee_id, emp.client_id, currentMonth, currentYear],
                )

                if (timeRecordResult.rows.length > 0) {
                  for (const rec of timeRecordResult.rows) {
                    const record = rec.record || {}
                    if (!record[currentDate]) {
                      record[currentDate] = {
                        check_in: "-",
                        check_out: "-",
                        hours_worked: "-",
                        overtime: "-",
                        status: {
                          Present: false,
                          Missing: false,
                          Absent: false,
                          "Day Off": true,
                          "Full Leave": false,
                          "Short Duration": false,
                          WFH: false,
                        },
                      }
                      await client.query(`UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2`, [
                        JSON.stringify(record),
                        rec.id,
                      ])
                    }
                  }
                } else {
                  await client.query(
                    `INSERT INTO eSparkTalentAPI_time_sheet (employee_id, client_id, month, year, record)
                         VALUES ($1, $2, $3, $4, $5)`,
                    [
                      emp.employee_id,
                      emp.client_id,
                      currentMonth,
                      currentYear,
                      JSON.stringify({
                        [currentDate]: {
                          check_in: "-",
                          check_out: "-",
                          hours_worked: "-",
                          overtime: "-",
                          status: {
                            Present: false,
                            Missing: false,
                            Absent: false,
                            "Day Off": true,
                            "Full Leave": false,
                            "Short Duration": false,
                            WFH: false,
                          },
                        },
                      }),
                    ],
                  )
                }
              } else {
                // Handle workday - replace all pool.query with client.query
                const checkInTime = parse(pTime.check_in, "h:mm a", new Date())
                const checkOutTime = parse(pTime.check_out, "h:mm a", new Date())

                checkInTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate())
                checkOutTime.setFullYear(now.getFullYear(), now.getMonth(), now.getDate())

                if (now >= checkInTime && now < checkOutTime) {
                  // During working hours - replace all pool.query with client.query
                  const leaveRecords = await client.query(
                    `SELECT * FROM eSparkTalentAPI_leave_request 
                         WHERE employee_id = $1 AND client_id = $2 AND status = 'completed'
                         AND start_date <= $3 AND end_date >= $3`,
                    [emp.employee_id, emp.client_id, now],
                  )

                  const wfhRecords = await client.query(
                    `SELECT * FROM eSparkTalentAPI_wfh_request 
                         WHERE employee_id = $1 AND status = 'completed'
                         AND start_date <= $2 AND end_date >= $2`,
                    [emp.employee_id, now],
                  )

                  const timeRecordResult = await client.query(
                    `SELECT * FROM eSparkTalentAPI_time_sheet 
                         WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
                    [emp.employee_id, emp.client_id, currentMonth, currentYear],
                  )

                  if (timeRecordResult.rows.length > 0) {
                    for (const rec of timeRecordResult.rows) {
                      const record = rec.record || {}

                      if (!record[currentDate] && leaveRecords.rows.length > 0) {
                        record[currentDate] = {
                          check_in: "-",
                          check_out: "-",
                          hours_worked: "-",
                          overtime: "-",
                          status: {
                            Present: false,
                            Missing: false,
                            Absent: false,
                            "Day Off": false,
                            "Full Leave": true,
                            "Short Duration": false,
                            WFH: false,
                          },
                        }
                        await client.query(
                          `
                        UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2
                      `,
                          [JSON.stringify(record), rec.id],
                        )
                      } else if (!record[currentDate] && wfhRecords.rows.length > 0) {
                        record[currentDate] = {
                          check_in: "-",
                          check_out: "-",
                          hours_worked: "-",
                          overtime: "-",
                          status: {
                            Present: false,
                            Missing: false,
                            Absent: false,
                            "Day Off": false,
                            "Full Leave": false,
                            "Short Duration": false,
                            WFH: true,
                          },
                        }
                        await client.query(
                          `
                        UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2
                      `,
                          [JSON.stringify(record), rec.id],
                        )
                      } else if (!record[currentDate]) {
                        record[currentDate] = {
                          check_in: "-",
                          check_out: "-",
                          hours_worked: "-",
                          overtime: "-",
                          status: {
                            Present: false,
                            Missing: true,
                            Absent: false,
                            "Day Off": false,
                            "Full Leave": false,
                            "Short Duration": false,
                            WFH: false,
                          },
                        }
                        await client.query(
                          `
                        UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2
                      `,
                          [JSON.stringify(record), rec.id],
                        )
                      }
                    }
                  } else {
                    // Create new time sheet record
                    let newRecord
                    if (leaveRecords.rows.length > 0) {
                      newRecord = {
                        [currentDate]: {
                          check_in: "-",
                          check_out: "-",
                          hours_worked: "-",
                          overtime: "-",
                          status: {
                            Present: false,
                            Missing: false,
                            Absent: false,
                            "Day Off": false,
                            "Full Leave": true,
                            "Short Duration": false,
                            WFH: false,
                          },
                        },
                      }
                    } else if (wfhRecords.rows.length > 0) {
                      newRecord = {
                        [currentDate]: {
                          check_in: "-",
                          check_out: "-",
                          hours_worked: "-",
                          overtime: "-",
                          status: {
                            Present: false,
                            Missing: false,
                            Absent: false,
                            "Day Off": false,
                            "Full Leave": false,
                            "Short Duration": false,
                            WFH: true,
                          },
                        },
                      }
                    } else {
                      newRecord = {
                        [currentDate]: {
                          check_in: "-",
                          check_out: "-",
                          hours_worked: "-",
                          overtime: "-",
                          status: {
                            Present: false,
                            Missing: true,
                            Absent: false,
                            "Day Off": false,
                            "Full Leave": false,
                            "Short Duration": false,
                            WFH: false,
                          },
                        },
                      }
                    }

                    await client.query(
                      `
                    INSERT INTO eSparkTalentAPI_time_sheet (employee_id, client_id, month, year, record)
                    VALUES ($1, $2, $3, $4, $5)
                  `,
                      [emp.employee_id, emp.client_id, currentMonth, currentYear, JSON.stringify(newRecord)],
                    )
                  }
                } else if (now >= checkOutTime) {
                  // After working hours - replace all pool.query with client.query
                  const timeRecordResult = await client.query(
                    `
                  SELECT * FROM eSparkTalentAPI_time_sheet 
                  WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4
                `,
                    [emp.employee_id, emp.client_id, currentMonth, currentYear],
                  )

                  if (timeRecordResult.rows.length > 0) {
                    const timeRecord = timeRecordResult.rows[0]
                    const record = timeRecord.record || {}

                    if (
                      record[currentDate] &&
                      record[currentDate].check_in !== "-" &&
                      record[currentDate].check_out === "-" &&
                      !record[currentDate].status["Full Leave"]
                    ) {
                      // Employee checked in but didn't check out
                      record[currentDate].check_out = "-"
                      record[currentDate].hours_worked = "-"
                      record[currentDate].overtime = "-"
                      record[currentDate].status.Missing = true
                      record[currentDate].status["Short Duration"] = false

                      await client.query(
                        `
                      UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2
                    `,
                        [JSON.stringify(record), timeRecord.id],
                      )
                    } else if (
                      record[currentDate] &&
                      record[currentDate].check_in === "-" &&
                      record[currentDate].check_out === "-" &&
                      !record[currentDate].status["Full Leave"]
                    ) {
                      // Employee didn't check in or out
                      record[currentDate].check_out = "-"
                      record[currentDate].hours_worked = "-"
                      record[currentDate].overtime = "-"
                      record[currentDate].status.Present = false
                      record[currentDate].status.Absent = true
                      record[currentDate].status.Missing = false
                      record[currentDate].status["Short Duration"] = false

                      await client.query(
                        `
                      UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2
                    `,
                        [JSON.stringify(record), timeRecord.id],
                      )
                    } else if (!record[currentDate]) {
                      // No record for today, mark as absent
                      record[currentDate] = {
                        check_in: "-",
                        check_out: "-",
                        hours_worked: "-",
                        overtime: "-",
                        status: {
                          Present: false,
                          Missing: false,
                          Absent: true,
                          "Day Off": false,
                          "Full Leave": false,
                          "Short Duration": false,
                          WFH: false,
                        },
                      }

                      await client.query(
                        `
                      UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2
                    `,
                        [JSON.stringify(record), timeRecord.id],
                      )
                    }
                  } else {
                    // No time sheet record exists, create one with absent status
                    await client.query(
                      `
                    INSERT INTO eSparkTalentAPI_time_sheet (employee_id, client_id, month, year, record)
                    VALUES ($1, $2, $3, $4, $5)
                  `,
                      [
                        emp.employee_id,
                        emp.client_id,
                        currentMonth,
                        currentYear,
                        JSON.stringify({
                          [currentDate]: {
                            check_in: "-",
                            check_out: "-",
                            hours_worked: "-",
                            overtime: "-",
                            status: {
                              Present: false,
                              Missing: false,
                              Absent: true,
                              "Day Off": false,
                              "Full Leave": false,
                              "Short Duration": false,
                              WFH: false,
                            },
                          },
                        }),
                      ],
                    )
                  }
                }
              }
            }

            await client.query("COMMIT")
            console.log(`Successfully processed employee ${emp.employee_id}`)
          } catch (error) {
            await client.query("ROLLBACK")
            console.error(`Error processing employee ${emp.employee_id}: ${error.message}`)
            // Continue with next employee instead of breaking the entire process
          } finally {
            if (client) client.release()
          }
        }

        console.log(`Punch check completed at ${new Date().toISOString()}`)

        // Sleep for 30 minutes (30 * 60 * 1000 milliseconds)
        await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000))
      } catch (error) {
        console.error(`Error in updateTimeSheet: ${error.message}`)
        console.error(`Stack trace: ${error.stack}`)
        // Sleep for 5 minutes before retrying on error
        await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000))
      }
    }
  }
}

export default UpdateTimeSheet
