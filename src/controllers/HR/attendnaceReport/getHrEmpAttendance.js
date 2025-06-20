import pool from "../../../config/db.js";
import {
  parseISO,
  isValid,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  parse,
} from "date-fns";
import { logger } from "../../../helpers/logger.js";

const TALENT_EMAIL = process.env.TALENT_EMAIL || "talent@esparkconsultants.com";

const MONTH_MAP = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12
};

export const getHrEmpAttendance = async (req, res) => {
  const { e_email, from, to } = req.query;
  logger.info(`Received getHrEmpAttendance request for employee email: ${e_email}`);

  try {
    const fromDate = from ? parseISO(from) : startOfMonth(new Date());
    const toDate = to ? parseISO(to) : endOfMonth(new Date());

    logger.info(`Using date range from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

    const empQuery = await pool.query(
      "SELECT * FROM eSparkTalentAPI_employee WHERE email = $1",
      [e_email]
    );
    const employee = empQuery.rows[0];
    if (!employee) {
      logger.error(`Employee not found with email: ${e_email}`);
      return res.status(404).json({ message: "Employee not found." });
    }
    const employeeId = employee.id;

    const fromYear = fromDate.getFullYear();
    const toYear = toDate.getFullYear();

    const timeSheetQuery = await pool.query(
      `SELECT * FROM eSparkTalentAPI_time_sheet
       WHERE employee_id = $1
       AND year >= $2 AND year <= $3`,
      [employeeId, fromYear, toYear]
    );

    const timeSheets = timeSheetQuery.rows;
    if (!timeSheets.length) {
      logger.info(`No timesheets found for employee id: ${employeeId}`);
      return res.sendStatus(204);
    }

    const clientIds = [...new Set(timeSheets.map(ts => ts.client_id))];
    const clientQuery = await pool.query(
      "SELECT * FROM eSparkTalentAPI_client WHERE id = ANY($1::bigint[])",
      [clientIds]
    );
    const clientMap = Object.fromEntries(clientQuery.rows.map(c => [c.id, c]));

    const outsrcQuery = await pool.query(
      `SELECT * FROM eSparkTalentAPI_outsource_employees
       WHERE employee_id = $1 AND client_id = ANY($2::bigint[])`,
      [employeeId, clientIds]
    );
    const outsrcMap = Object.fromEntries(outsrcQuery.rows.map(o => [o.client_id, o]));

    const records = [];

    for (const ts of timeSheets) {
      const monthNum = MONTH_MAP[ts.month];
      if (!monthNum) {
        logger.warn(`Invalid month in timesheet: ${ts.month}`);
        continue;
      }

      if (
        (ts.year < fromYear) ||
        (ts.year === fromYear && monthNum < (fromDate.getMonth() + 1)) ||
        (ts.year > toYear) ||
        (ts.year === toYear && monthNum > (toDate.getMonth() + 1))
      ) {
        continue;
      }

      const record = ts.record || {};
      const filteredRecord = {};

      for (const [dateStr, status] of Object.entries(record)) {
        if (!dateStr || !dateStr.includes("-")) continue;

        const date = parse(dateStr, "dd-MM-yyyy", new Date());
        if (!isValid(date)) continue;

        if (isWithinInterval(date, { start: fromDate, end: toDate })) {
          filteredRecord[dateStr] = status;
        }
      }

      if (Object.keys(filteredRecord).length === 0) continue;

      const client = clientMap[ts.client_id];
      const outsrcEmp = outsrcMap[ts.client_id];

      let companyName = "-";
      let companyEmail = "-";
      let location = "-";

      if (client) {
        if (client.email === TALENT_EMAIL) {
          companyName = "eSpark Talent";
          companyEmail = TALENT_EMAIL;
          location = "Karachi";
        } else {
          companyName = client.company_name;
          companyEmail = client.email;
          location = client.address;
        }
      }

      const employeeDetails = {
        employee_id: employee.employee_id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        company: companyName,
        company_email: companyEmail,
        location,
        role_type: outsrcEmp?.role_type || "-",
        job_title: outsrcEmp?.job_title || "-",
        joining_date: outsrcEmp?.joining_date || "-",
      };

      const timeSheetData = {
        id: ts.id,
        month: ts.month,
        year: ts.year,
        record: filteredRecord,
        expect_check_in: employee?.punch_timings?.check_in || "-",
        expect_check_out: employee?.punch_timings?.check_out || "-",
      };

      records.push({
        [companyName]: {
          time_sheet: timeSheetData,
          employee_details: employeeDetails,
        },
      });
    }

    records.sort((a, b) => {
      const nameA = Object.keys(a)[0].toLowerCase();
      const nameB = Object.keys(b)[0].toLowerCase();
      return nameA.localeCompare(nameB);
    });

    logger.info(`Returning ${records.length} attendance record(s) for employee id: ${employeeId}`);
    return res.status(200).json(records);

  } catch (error) {
    logger.error("Error in getHrEmpAttendance:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
