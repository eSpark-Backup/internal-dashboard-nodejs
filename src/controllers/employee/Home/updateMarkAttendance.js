import { format, parse } from 'date-fns';
import pool from "../../../config/db.js";
import { logger } from '../../../helpers/logger.js';
import { validateAndCleanTime, parseTimeToMinutes } from '../../../helpers/utils.js';

const calculateWorkHours = (checkInMinutes, checkOutMinutes, requiredHours = 9) => {
    let totalWorkedMinutes = checkOutMinutes - checkInMinutes;

    if (totalWorkedMinutes < 0) {
        totalWorkedMinutes += 24 * 60; // Next day checkout
    }

    if (totalWorkedMinutes > 24 * 60) {
        throw new Error("Worked time exceeds 24 hours");
    }

    const hoursWorked = Math.floor(totalWorkedMinutes / 60);
    const minutesWorked = totalWorkedMinutes % 60;
    const requiredMinutes = requiredHours * 60;
    const overtimeMinutes = Math.max(0, totalWorkedMinutes - requiredMinutes);

    let overtime = "0h";
    if (overtimeMinutes > 0) {
        const overtimeH = Math.floor(overtimeMinutes / 60);
        const overtimeM = overtimeMinutes % 60;

        if (overtimeH > 0 && overtimeM > 0) {
            overtime = `${overtimeH}h ${overtimeM}m`;
        } else if (overtimeH > 0) {
            overtime = `${overtimeH}h`;
        } else if (overtimeM > 0) {
            overtime = `${overtimeM}m`;
        }
    }

    const hoursWorkedStr = minutesWorked > 0 ? `${hoursWorked}h ${minutesWorked}m` : `${hoursWorked}h`;

    return {
        hoursWorkedStr,
        overtime,
        totalWorkedMinutes,
        isShortDuration: totalWorkedMinutes < requiredMinutes
    };
};

const handleCheckIn = async (employee, client, checkIn, now, todayKey, currentMonth, currentYear) => {
    const validatedCheckIn = validateAndCleanTime(checkIn);

    const wfhResult = await pool.query(
        `SELECT 1 FROM eSparkTalentAPI_wfh_request 
         WHERE employee_id = $1 AND status = 'completed' 
         AND start_date <= $2 AND end_date >= $2`,
        [employee.id, now]
    );

    const statusObj = {
        Present: true,
        Missing: false,
        Absent: false,
        Day_Off: false,
        Full_Leave: false,
        Short_Duration: false,
        WFH: wfhResult.rowCount > 0,
    };

    const timesheetResult = await pool.query(
        `SELECT id, record FROM eSparkTalentAPI_time_sheet 
         WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
        [employee.id, client.id, currentMonth, currentYear]
    );

    if (timesheetResult.rowCount > 0) {
        const { id, record } = timesheetResult.rows[0];
        const todayRecord = record[todayKey] || {};

        if (todayRecord.check_in && todayRecord.check_in !== '-') {
            return { status: 200, message: 'Check in is already punched' };
        }

        const updatedRecord = {
            ...record,
            [todayKey]: {
                ...todayRecord,
                check_in: validatedCheckIn,
                check_out: todayRecord.check_out || '-',
                hours_worked: todayRecord.hours_worked || '-',
                overtime: todayRecord.overtime || '-',
                status: statusObj,
            },
        };

        await pool.query(
            `UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2`,
            [updatedRecord, id]
        );
    } else {
        const newRecord = {
            [todayKey]: {
                check_in: validatedCheckIn,
                check_out: '-',
                hours_worked: '-',
                overtime: '-',
                status: statusObj,
            },
        };

        await pool.query(
            `INSERT INTO eSparkTalentAPI_time_sheet (employee_id, client_id, month, year, record)
             VALUES ($1, $2, $3, $4, $5)`,
            [employee.id, client.id, currentMonth, currentYear, newRecord]
        );
    }

    return { status: 200, message: 'Check in punched' };
};

const handleCheckOut = async (employee, client, checkOut, todayKey, currentMonth, currentYear) => {
    const validatedCheckOut = validateAndCleanTime(checkOut);

    const timesheetResult = await pool.query(
        `SELECT id, record FROM eSparkTalentAPI_time_sheet 
         WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
        [employee.id, client.id, currentMonth, currentYear]
    );

    if (!timesheetResult.rowCount) {
        return { status: 400, message: "No timesheet found for check-out" };
    }

    const { id, record } = timesheetResult.rows[0];
    const todayRecord = record[todayKey];

    if (!todayRecord || todayRecord.check_out !== "-" || todayRecord.check_in === "-") {
        return { status: 200, message: "Check out already punched or check-in missing" };
    }

    // Get required working hours
    let workingHours = 9;
    try {
        const punchQuery = await pool.query(
            `SELECT punch_timings FROM eSparkTalentAPI_employee WHERE id = $1`,
            [employee.id]
        );
        const punchTimings = punchQuery.rows[0]?.punch_timings;

        if (punchTimings?.check_in && punchTimings?.check_out) {
            const checkInParsed = parse(punchTimings.check_in, 'hh:mm a', new Date());
            const checkOutParsed = parse(punchTimings.check_out, 'hh:mm a', new Date());

            let checkInMinutes = checkInParsed.getHours() * 60 + checkInParsed.getMinutes();
            let checkOutMinutes = checkOutParsed.getHours() * 60 + checkOutParsed.getMinutes();

            if (checkOutMinutes < checkInMinutes) {
                checkOutMinutes += 24 * 60;
            }

            workingHours = (checkOutMinutes - checkInMinutes) / 60;
        }
    } catch (err) {
        logger.warn("Could not fetch punch timings, using default working hours");
    }

    const checkInTime = decodeURIComponent(todayRecord.check_in);
    const checkOutTime = decodeURIComponent(validatedCheckOut);

    const checkInMinutes = parseTimeToMinutes(checkInTime);
    const checkOutMinutes = parseTimeToMinutes(checkOutTime);

    const { hoursWorkedStr, overtime, isShortDuration } = calculateWorkHours(
        checkInMinutes,
        checkOutMinutes,
        workingHours
    );

    const updatedTodayRecord = {
        ...todayRecord,
        check_out: validatedCheckOut,
        hours_worked: hoursWorkedStr,
        overtime: overtime,
        status: {
            ...todayRecord.status,
            "Short Duration": isShortDuration,
            "Missing": false,
        },
    };

    const updatedRecord = {
        ...record,
        [todayKey]: updatedTodayRecord,
    };

    await pool.query(
        `UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2`,
        [updatedRecord, id]
    );

    return {
        status: 200,
        message: "Check out punched"
    };
};

const handleBreakResume = async (employee, client, action, time, todayKey, currentMonth, currentYear) => {
    const timesheetResult = await pool.query(
        `SELECT id, record FROM eSparkTalentAPI_time_sheet 
         WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
        [employee.id, client.id, currentMonth, currentYear]
    );

    if (!timesheetResult.rowCount) {
        return { status: 404, message: "Timesheet not found for today" };
    }

    const { id, record } = timesheetResult.rows[0];
    const todayRecord = record[todayKey] || {};

    const hasCheckIn = todayRecord.check_in && todayRecord.check_in !== "-";
    const hasBreak = "break" in todayRecord;
    const hasResume = "resume" in todayRecord;

    if (action === 'break') {
        if (!hasCheckIn || hasBreak) {
            return { status: 200, message: "Break is already punched or check-in is missing" };
        }
    } else if (action === 'resume') {
        if (!hasCheckIn || !hasBreak || hasResume) {
            return { status: 200, message: "Resume is already punched or prerequisites missing" };
        }
    }

    const updatedRecord = {
        ...record,
        [todayKey]: {
            ...todayRecord,
            [action]: time,
        },
    };

    await pool.query(
        `UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2`,
        [updatedRecord, id]
    );

    return {
        status: 200,
        message: action === 'break' ? "Break punched" : "Resume punched"
    };
};


const updateMarkAttendance = async (req, res) => {
    const { email } = req.user;
    const { workspace, check_in, check_out, break: break_in, resume } = req.query;

    const now = new Date();
    const todayKey = format(now, 'dd-MM-yyyy');
    const currentMonth = format(now, 'LLLL');
    const currentYear = now.getFullYear();

    try {
        // Validate employee and workspace
        const [employeeResult, workspaceResult] = await Promise.all([
            pool.query(`SELECT id, email FROM eSparkTalentAPI_employee WHERE email = $1`, [email]),
            pool.query(`SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1`, [workspace])
        ]);

        if (!employeeResult.rows[0]) {
            return res.status(404).json({ message: "Employee not found" });
        }

        if (!workspaceResult.rows[0]) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const employee = employeeResult.rows[0];
        const client = workspaceResult.rows[0];

        let result;

        if (check_in) {
            result = await handleCheckIn(employee, client, check_in, now, todayKey, currentMonth, currentYear);
        } else if (check_out) {
            result = await handleCheckOut(employee, client, check_out, todayKey, currentMonth, currentYear);
        } else if (break_in) {
            result = await handleBreakResume(employee, client, 'break', break_in, todayKey, currentMonth, currentYear);
        } else if (resume) {
            result = await handleBreakResume(employee, client, 'resume', resume, todayKey, currentMonth, currentYear);
        } else {
            return res.status(400).json({ message: "No valid action specified" });
        }

        const { message, status } = result;
        return res.status(status).json({ message });

    } catch (err) {
        logger.error("Error in updateMarkAttendance", err);

        if (err.message.includes('Time must include') || err.message.includes('Invalid time format')) {
            return res.status(400).json({ message: 'Invalid time format', error: err.message });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
};

export default updateMarkAttendance;