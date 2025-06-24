import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { getSignedUrl } from "../../../helpers/s3.js";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isWeekend,
    parse,
    differenceInMinutes,
    differenceInSeconds,
    isAfter,
    isBefore,
    addDays,
    startOfWeek,
    endOfWeek,
} from "date-fns"


const getTodayActivity = async (employeeId, workspaceClientId) => {
    const now = new Date();
    const today = format(now, 'dd-MM-yyyy');
    const currentMonth = format(now, 'LLLL');
    const currentYear = now.getFullYear();

    let todayActivity = {
        check_in: '-',
        check_out: '-',
        break: '-',
        resume: '-',
    };

    try {
        const timeSheetResult = await pool.query(
            `SELECT record FROM eSparkTalentAPI_time_sheet WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
            [employeeId, workspaceClientId, currentMonth, currentYear]
        );


        if (timeSheetResult.rowCount > 0) {
            const record = timeSheetResult.rows[0].record;

            if (record && record[today]) {
                const entry = record[today];
                todayActivity.check_in = entry.check_in || '-';
                todayActivity.check_out = entry.check_out || '-';
                todayActivity.break = entry.break || '-';
                todayActivity.resume = entry.resume || '-';
            }
        }

        return todayActivity;
    } catch (error) {
        logger.error(`Error fetching today's activity: ${error.message}`);
        return todayActivity;
    }
};

const getStatistics = async (employeeId, workspace) => {
    const now = new Date()
    const todayStr = format(now, "dd-MM-yyyy")
    const currentMonth = format(now, "LLLL") // "June"
    const currentYear = now.getFullYear()
    const currentTime = now
    const currentDay = now.getDate()
    const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate()

    let totalWeekdays = 0
    let weekdaysUpToToday = 0

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, now.getMonth(), day)
        const isWeekday = date.getDay() >= 1 && date.getDay() <= 5
        if (isWeekday) {
            totalWeekdays++
            if (day <= currentDay) weekdaysUpToToday++
        }
    }

    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    let workingHours = 9 // default

    try {
        const empRes = await pool.query(`SELECT punch_timings FROM eSparkTalentAPI_employee WHERE email = $1`, [employeeId])

        const punch = empRes.rows?.[0]?.punch_timings

        if (punch?.check_in && punch?.check_out) {
            const checkIn = parse(punch.check_in, "hh:mm a", new Date())
            let checkOut = parse(punch.check_out, "hh:mm a", new Date())
            if (isBefore(checkOut, checkIn)) checkOut = addDays(checkOut, 1)

            workingHours = Math.floor((checkOut - checkIn) / (1000 * 60 * 60))
        }
    } catch (err) {
        console.warn("Using default working hours due to error:", err.message)
    }

    const stats = {
        today: `0/${workingHours} hrs`,
        this_week: `0/${workingHours * 5} hrs`,
        this_month: `0/${workingHours * totalWeekdays} hrs`,
        remaining: `${workingHours * totalWeekdays}/${workingHours * totalWeekdays} hrs`,
        overtime: "0 hrs",
    }

    try {
        const tsRes = await pool.query(
            `SELECT record FROM eSparkTalentAPI_time_sheet WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
            [employeeId, workspace, currentMonth, currentYear],
        )

        if (!tsRes.rows.length) return stats

        const records = tsRes.rows[0].record
        let totalMinutes = 0
        let weeklyHours = 0
        let todayHours = 0
        let actualDaysWorked = 0
        let totalOvertimeMinutes = 0

        for (const date in records) {
            const r = records[date]
            const dateObj = parse(date, "dd-MM-yyyy", new Date())

            if (r.check_in && r.check_in !== "-") {
                const checkIn = parse(r.check_in, "hh:mm:ss a", new Date())
                let endTime = r.check_out && r.check_out !== "-" ? parse(r.check_out, "hh:mm:ss a", new Date()) : currentTime

                if (isBefore(endTime, checkIn)) endTime = addDays(endTime, 1)

                const diffMin = differenceInMinutes(endTime, checkIn)
                totalMinutes += diffMin

                // Count actual days worked (only if checked out or it's today)
                if ((r.check_out && r.check_out !== "-") || date === todayStr) {
                    actualDaysWorked++

                    // Calculate daily overtime
                    const dailyHours = diffMin / 60
                    if (dailyHours > workingHours) {
                        totalOvertimeMinutes += (dailyHours - workingHours) * 60
                    }
                }

                if (date === todayStr) todayHours = +(diffMin / 60).toFixed(2)
                if (dateObj >= weekStart && dateObj <= weekEnd && r.check_out && r.check_out !== "-") {
                    weeklyHours += diffMin / 60
                }
            }
        }

        const totalHours = +(totalMinutes / 60).toFixed(2)
        const expectedHoursForWorkedDays = actualDaysWorked * workingHours
        const remaining = +(totalWeekdays * workingHours - totalHours).toFixed(2)

        // Fixed overtime calculation - based on actual days worked
        const overtime = +(totalOvertimeMinutes / 60).toFixed(2)

        stats.today = `${todayHours.toFixed(2)}/${workingHours} hrs`
        stats.this_week = `${weeklyHours.toFixed(2)}/${workingHours * 5} hrs`
        stats.this_month = `${totalHours.toFixed(2)}/${workingHours * totalWeekdays} hrs`
        stats.remaining = `${remaining.toFixed(2)}/${workingHours * totalWeekdays} hrs`
        stats.overtime = `${overtime} hrs`
    } catch (err) {
        console.error("Error generating stats:", err.message)
    }

    return stats
}

const getAttendanceSummary = async (employeeId, workspace) => {
    const now = new Date()
    const currentMonth = format(now, "LLLL") // "June"
    const currentYear = now.getFullYear()

    const startOfCurrentMonth = startOfMonth(now)
    const endOfCurrentMonth = endOfMonth(now)
    const allDaysInMonth = eachDayOfInterval({
        start: startOfCurrentMonth,
        end: endOfCurrentMonth,
    })

    const totalWeekdays = allDaysInMonth.filter((day) => !isWeekend(day)).length

    // Calculate weekdays up to today
    const daysUpToToday = eachDayOfInterval({
        start: startOfCurrentMonth,
        end: now,
    })
    const weekdaysUpToToday = daysUpToToday.filter((day) => !isWeekend(day)).length

    let workingHours = 9 // default

    try {
        // Get employee punch timings
        const empResult = await pool.query(`SELECT punch_timings FROM eSparkTalentAPI_employee WHERE email = $1`, [
            employeeId,
        ])

        if (empResult.rows.length > 0) {
            const punchTimings = empResult.rows[0].punch_timings

            if (punchTimings?.check_in && punchTimings?.check_out) {
                const checkIn = parse(punchTimings.check_in, "h:mm a", new Date())
                let checkOut = parse(punchTimings.check_out, "h:mm a", new Date())

                if (isBefore(checkOut, checkIn)) {
                    checkOut = addDays(checkOut, 1)
                }

                const reqTime = differenceInSeconds(checkOut, checkIn)
                workingHours = Math.floor(reqTime / 3600)
            }
        }
    } catch (error) {
        console.warn("Error fetching employee data, using default working hours:", error.message)
    }

    let attendanceSummary = {
        shifts: 0,
        expected_minutes: 0,
        worked_minutes: 0,
        short_minutes: 0,
        leaves: 0,
        absents: 0,
        presents: 0,
        missings: 0,
        days_off: 0,
        overtimes: 0,
        short_durations: 0,
        late_arrivals: 0,
        break_minutes: 0,
    }

    try {
        // Get time sheet record
        const timeSheetResult = await pool.query(
            `SELECT record FROM eSparkTalentAPI_time_sheet 
         WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
            [employeeId, workspace, currentMonth, currentYear],
        )

        if (timeSheetResult.rows.length === 0) {
            return attendanceSummary
        }

        const timeSheetRecord = timeSheetResult.rows[0].record


        const empResult = await pool.query(`SELECT punch_timings FROM eSparkTalentAPI_employee WHERE id = $1`, [
            employeeId,
        ])

        const punchTimings = empResult.rows[0]?.punch_timings || {}

        // Initialize counters
        let absents = 0
        let presents = 0
        let missings = 0
        let daysOff = 0
        let overtimes = 0
        let breakMinutes = 0
        let lateArrivals = 0
        let shortDurations = 0
        let minutesWorked = 0
        let leaves = 0

        // Process each day in the record
        for (const dateKey in timeSheetRecord) {
            const dayRecord = timeSheetRecord[dateKey]

            // Check for overtime
            if (dayRecord.check_in !== "-" && dayRecord.check_out !== "-") {
                const checkInTime = parse(dayRecord.check_in, "h:mm:ss a", new Date())
                const checkOutTime = parse(dayRecord.check_out, "h:mm:ss a", new Date())

                let timeDifference = differenceInSeconds(checkOutTime, checkInTime)

                // Handle overnight shifts
                if (timeDifference < 0) {
                    timeDifference += 24 * 3600 // Add 24 hours in seconds
                }

                const hoursWorked = Math.round(timeDifference / 3600)
                if (hoursWorked > workingHours) {
                    overtimes += 1
                }

                // Calculate total minutes worked
                minutesWorked += Math.floor(timeDifference / 60)
            }

            // Check for break time
            if (dayRecord.break && dayRecord.resume && dayRecord.break !== "-" && dayRecord.resume !== "-") {
                const breakTime = parse(dayRecord.break, "h:mm:ss a", new Date())
                const resumeTime = parse(dayRecord.resume, "h:mm:ss a", new Date())

                let breakDuration = differenceInMinutes(resumeTime, breakTime)
                if (breakDuration < 0) {
                    breakDuration += 24 * 60 // Add 24 hours in minutes
                }

                breakMinutes += breakDuration
            }

            // Check for late arrivals
            if (dayRecord.check_in !== "-" && punchTimings.check_in) {
                const actualCheckIn = parse(dayRecord.check_in, "h:mm:ss a", new Date())
                const expectedCheckIn = parse(punchTimings.check_in, "h:mm a", new Date())

                if (isAfter(actualCheckIn, expectedCheckIn)) {
                    lateArrivals += 1
                }
            }

            // Count status types
            if (dayRecord.status) {
                if (dayRecord.status.Present === true) presents += 1
                if (dayRecord.status.Absent === true) absents += 1
                if (dayRecord.status.Missing === true) missings += 1
                if (dayRecord.status["Day Off"] === true) daysOff += 1
                if (dayRecord.status["Short Duration"] === true) shortDurations += 1
                if (dayRecord.status["Full Leave"] === true) leaves += 1
            }
        }

        // Calculate expected vs worked minutes
        const workableMinutes = weekdaysUpToToday * workingHours * 60
        const workedMinutes = minutesWorked
        const shortMinutes = workableMinutes > workedMinutes ? workableMinutes - workedMinutes : 0

        attendanceSummary = {
            shifts: weekdaysUpToToday,
            expected_minutes: workableMinutes,
            worked_minutes: workedMinutes,
            short_minutes: shortMinutes,
            leaves: leaves,
            absents: absents,
            presents: presents,
            missings: missings,
            days_off: daysOff,
            overtimes: overtimes,
            short_durations: shortDurations,
            late_arrivals: lateArrivals,
            break_minutes: Math.round(breakMinutes * 100) / 100, // Round to 2 decimal places
        }
    } catch (error) {
        console.error("Error calculating attendance summary:", error.message)
    }

    return attendanceSummary
}

const getHomeDetails = async (req, res) => {
    const talentEmail = process.env.TALENT_EMAIL;
    const { email } = req.user;
    const { workspace } = req.query;

    try {
        const employeeResult = await pool.query(
            `SELECT * FROM eSparkTalentAPI_employee WHERE email = $1`,
            [email]
        );

        const [employee] = employeeResult.rows;

        if (!employee) {
            logger.error(`Employee with email ${email} not found`);
            return res.status(404).json({ message: "Employee not found" });
        }

        let signedImageUrl = null;
        if (employee.image) {
            try {
                signedImageUrl = await getSignedUrl(employee.image);
            } catch (err) {
                logger.error(`Error fetching signed image URL: ${err.message}`);
            }
        }

        const employeeDetails = {
            employee_id: employee.id,
            employee_name: `${employee.first_name} ${employee.last_name}`,
            employee_email: employee.email,
            image: signedImageUrl,
        };

        const companyResult = await pool.query(
            `SELECT * FROM eSparkTalentAPI_company_data LIMIT 1`,
        );

        const company = companyResult.rows[0];

        let talentCompany = null;

        if (company) {
            talentCompany = company.company_name;
        }
        else {
            talentCompany = "eSpark";
        }

        let workspaces = [];
        workspaces.push({
            email: talentEmail,
            client_name: "eSpark Talent",
            company_name: talentCompany,
        });

        const activeClients = await pool.query(`SELECT 
            c.email,
            c.first_name || ' ' || c.last_name as client_name, 
            c.company_name
          FROM 
            eSparkTalentAPI_outsource_employees oe
          JOIN 
            eSparkTalentAPI_client c ON oe.client_id = c.id
          JOIN 
            eSparkTalentAPI_end_user ee ON ee.email = c.email
          WHERE 
            oe.employee_id = $1
            AND oe.status = 'active'
            AND ee.is_active = true`,
            [employee.id]
        );

        workspaces.push(...activeClients.rows);


        let workspaceClientId = null;

        if (workspace) {
            const clientResult = await pool.query(
                `SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1`,
                [workspace],
            )

            if (!clientResult.rows[0]) {
                logger.error(`Client with email ${workspace} not found`)
                return res.status(404).json({ message: "Workspace not found" })
            }

            workspaceClientId = clientResult.rows[0].id
        }

        const PendingLeavesResult = await pool.query(`SELECT 
            COUNT(*) FILTER (WHERE leave_type = 'annual' AND status = 'pending') AS annual_pending,
            COUNT(*) FILTER (WHERE leave_type = 'casual' AND status = 'pending') AS casual_pending,
            COUNT(*) FILTER (WHERE leave_type = 'sick' AND status = 'pending') AS sick_pending,
            COUNT(*) FILTER (WHERE leave_type = 'paid' AND status = 'pending') AS paid_pending,
            COUNT(*) FILTER (WHERE leave_type = 'unpaid' AND status = 'pending') AS unpaid_pending,
            COUNT(*) FILTER (WHERE leave_type = 'hajj' AND status = 'pending') AS hajj_pending
          FROM 
            eSparkTalentAPI_leave_request
          WHERE 
            employee_id = $1 AND client_id = $2`, [employee.id, workspaceClientId]);

        const PendingLeaves = PendingLeavesResult.rows[0];


        const leavesBalanceResult = await pool.query(`SELECT * FROM eSparkTalentAPI_leave_balance WHERE employee_id = $1`, [employee.id]);
        const leavesBalance = leavesBalanceResult.rows[0];

        leavesBalance.annual_leaves["pending"] = PendingLeaves.annual_pending;
        leavesBalance.casual_leaves["pending"] = PendingLeaves.casual_pending;
        leavesBalance.sick_leaves["pending"] = PendingLeaves.sick_pending;
        leavesBalance.paid_leaves["pending"] = PendingLeaves.paid_pending;
        leavesBalance.unpaid_leaves["pending"] = PendingLeaves.unpaid_pending;
        leavesBalance.hajj_leaves["pending"] = PendingLeaves.hajj_pending;


        let leave_summary = {
            id: leavesBalance.id,
            casual_leaves: leavesBalance.casual_leaves,
            sick_leaves: leavesBalance.sick_leaves,
            annual_leaves: leavesBalance.annual_leaves,
            unpaid_leaves: leavesBalance.unpaid_leaves,
            hajj_leaves: leavesBalance.hajj_leaves,
            paid_leaves: leavesBalance.paid_leaves,
        }

        const todayActivity = await getTodayActivity(employee.id, workspaceClientId);
        const statistics = await getStatistics(employee.id, workspaceClientId);
        const attendanceSummary = await getAttendanceSummary(employee.id, workspaceClientId);

        const punchTimings = employee.punch_timings;

        const currentCompany = await pool.query(`SELECT * FROM eSparkTalentAPI_outsource_employees WHERE employee_id = $1 AND client_id = $2`, [employee.id, workspaceClientId]);

        employeeDetails["job_title"] = currentCompany.rows[0]?.job_title || employee?.job_title;

        return res.status(200).json({
            employee_details: employeeDetails,
            company_image: company?.image || "",
            workspaces: workspaces,
            attendance_summary: attendanceSummary,
            punch_timings: punchTimings,
            leave_summary: leave_summary,
            statistics: statistics,
            today_activity: todayActivity,
        });

    } catch (error) {
        logger.error(`Error fetching home details: ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export default getHomeDetails;
