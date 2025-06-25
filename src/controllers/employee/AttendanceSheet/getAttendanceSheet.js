import {
    format,
    parseISO,
    differenceInHours,
    isWithinInterval,
    getYear,
    parse,
    differenceInMinutes,
    isBefore,
    addDays,
    startOfMonth,
    endOfDay,
    startOfDay
} from "date-fns";

import { getWeekdaysCount } from "../../../helpers/utils.js";


import pool from "../../../config/db.js";

const getTimeSheetDetails = async (req, res) => {
    const { email } = req.user;
    const { workspace, from, to } = req.query;

    const today = new Date();
    const fromDate = from ? parseISO(from) : startOfMonth(today);
    const toDate = to ? parseISO(to) : endOfDay(today);

    try {

        let employeeResult = await pool.query('SELECT * FROM eSparkTalentAPI_employee WHERE email = $1', [email]);


        const [employee] = employeeResult.rows;

        if (!employee) {
            logger.error(`Employee with email ${email} not found`);
            return res.status(404).json({ message: "Employee not found" });
        }
        const clientResult = await pool.query(
            `SELECT id, email FROM eSparkTalentAPI_client WHERE email = $1`,
            [workspace],

        )

        if (!clientResult.rows[0]) {
            logger.error(`Client with email ${workspace} not found`)
            return res.status(404).json({ message: "Workspace not found" })
        }
        const workspaceClientId = clientResult.rows[0].id

        const fromMonth = format(fromDate, 'MMMM');
        const fromYear = getYear(fromDate);
        const toMonth = format(toDate, 'MMMM');
        const toYear = getYear(toDate);

        const monthMapping = [
            '', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ].reduce((acc, m, i) => { if (m) acc[m] = i; return acc; }, {});
        const fromMonthNum = monthMapping[fromMonth];
        const toMonthNum = monthMapping[toMonth];

        const timeSheetResult = await pool.query(`
  SELECT * FROM eSparkTalentAPI_time_sheet
  WHERE employee_id = $1 AND client_id = $2
  AND (
    (year > $3)
    OR (year = $3 AND month IN (${Object.keys(monthMapping).slice(fromMonthNum - 1).map(m => `'${m}'`).join(', ')}))
  )
  AND (
    (year < $4)
    OR (year = $4 AND month IN (${Object.keys(monthMapping).slice(0, toMonthNum).map(m => `'${m}'`).join(', ')}))
  )
`, [employee.id, workspaceClientId, fromYear, toYear]);

        const timeSheets = timeSheetResult.rows;
        let filteredRecord = {};

        for (const sheet of timeSheets) {
            const record = sheet.record;
            for (const [key, val] of Object.entries(record)) {
                const date = parse(key, 'dd-MM-yyyy', new Date());
                if (isWithinInterval(date, { start: startOfDay(fromDate), end: toDate })) {
                    filteredRecord[key] = val;
                }
            }
        }

        if (Object.keys(filteredRecord).length === 0) return res.status(204).send();

        const emp = employeeResult.rows[0];

        let checkIn = parse(emp.punch_timings.check_in, 'hh:mm a', new Date());
        let checkOut = parse(emp.punch_timings.check_out, 'hh:mm a', new Date());
        if (isBefore(checkOut, checkIn)) checkOut = addDays(checkOut, 1);

        const workingHours = differenceInHours(checkOut, checkIn);

        let hoursWorked = 0, minutesWorked = 0, shortDuration = 0, present = 0, missingPunch = 0, leaves = 0, dayOff = 0, absent = 0, actualShifts = 0;

        for (const rec of Object.values(filteredRecord)) {
            if (rec.check_in !== '-' && rec.check_out !== '-') {
                let inTime = parse(rec.check_in, 'hh:mm:ss a', new Date());
                let outTime = parse(rec.check_out, 'hh:mm:ss a', new Date());
                if (isBefore(outTime, inTime)) outTime = addDays(outTime, 1);
                let diffMins = differenceInMinutes(outTime, inTime);
                hoursWorked += Math.floor(diffMins / 60);
                minutesWorked += diffMins % 60;
            }

            if (rec.status['Short Duration']) shortDuration++;
            if (rec.status['Present']) present++;
            if (rec.status['Missing']) missingPunch++;
            if (rec.status['Full Leave']) leaves++;
            if (rec.status['Day Off']) dayOff++;
            if (rec.status['Absent']) absent++;
            // if (!rec.status['Day Off'] && !rec.status['Full Leave']) actualShifts++;
        }
        actualShifts = getWeekdaysCount(startOfDay(fromDate), startOfDay(toDate));


        let workedHours = hoursWorked || minutesWorked ? `${hoursWorked}h ${minutesWorked}m` : '0h';
        const workableMinutes = actualShifts * workingHours * 60;
        const workedMinutes = hoursWorked * 60 + minutesWorked;
        let shortHours = '0h 0m', overtimeHours = '0h 0m';

        if (workableMinutes > workedMinutes) {
            let diff = workableMinutes - workedMinutes;
            shortHours = `${Math.floor(diff / 60)}h ${diff % 60}m`;
        } else if (workedMinutes > workableMinutes) {
            let diff = workedMinutes - workableMinutes;
            overtimeHours = `${Math.floor(diff / 60)}h ${diff % 60}m`;
        }

        const summary = {
            workable_shifts: actualShifts,
            workable_hours: `${actualShifts * workingHours}h`,
            worked_hours: workedHours,
            short_hours: shortHours,
            overtime_hours: overtimeHours,
            short_duration: shortDuration,
            present,
            absent,
            day_off: dayOff,
            missing_punch: missingPunch,
            leaves
        };

        let client = clientResult.rows[0];

        let outsrcResult = await pool.query(`SELECT * FROM eSparkTalentAPI_outsource_employees WHERE employee_id = $1 AND client_id = $2`, [emp.id, client.id]);
        let outsrc = outsrcResult.rows[0];

        const employeeDetails = {
            employee_id: emp.id,
            employee_name: `${emp.first_name} ${emp.last_name}`,
            company: client ? client.company_name : 'eSpark Talent',
            location: client ? client.address : 'Karachi',
            role_type: outsrc.role_type,
            job_title: outsrc.job_title,
            joining_date: outsrc.joining_date
        };

        return res.status(200).json({
            time_sheet: {
                id: timeSheets[0].id,
                record: filteredRecord,
                month: fromMonth,
                year: fromYear,
                expected_check_in: employee.punch_timings.check_in,
                expected_check_out: employee.punch_timings.check_out,
            },
            time_sheet_summary: summary,
            employee_details: employeeDetails
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default getTimeSheetDetails;
