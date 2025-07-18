import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { format, getYear } from "date-fns";
import { parseTimeToMinutes } from "../../../helpers/utils.js";

const calculateWorkHours = (
  checkInMinutes,
  checkOutMinutes,
  requiredHours = 9
) => {
  let totalWorkedMinutes = checkOutMinutes - checkInMinutes;

  if (totalWorkedMinutes < 0) {
    totalWorkedMinutes += 24 * 60;
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

  const hoursWorkedStr =
    minutesWorked > 0 ? `${hoursWorked}h ${minutesWorked}m` : `${hoursWorked}h`;

  return {
    hoursWorkedStr,
    overtime,
    totalWorkedMinutes,
    isShortDuration: totalWorkedMinutes < requiredMinutes,
  };
};

const updateOrCreateTimesheetRecord = async ({
  client,
  employee_id,
  clientId,
  date,
  punchTime,
  punchType,
  timesheetRecord,
  wfhFlag,
}) => {
  const punchDateKey = format(new Date(date), "dd-MM-yyyy");
  const month = format(new Date(date), "MMMM");
  const year = getYear(new Date(date));

  let newEntry = {
    check_in: punchType === "check_in" ? punchTime : "-",
    check_out: punchType === "check_out" ? punchTime : "-",
    hours_worked: "-",
    overtime: "-",
    status: {
      Present: true,
      Missing: false,
      Absent: false,
      "Day Off": false,
      "Full Leave": false,
      "Short Duration": false,
      WFH: wfhFlag || false,
    },
  };

  if (punchType === "check_out") {
    const checkIn = timesheetRecord?.[punchDateKey]?.check_in || "-";

    if (checkIn !== "-") {
      const checkInMinutes = parseTimeToMinutes(checkIn);
      const checkOutMinutes = parseTimeToMinutes(punchTime);
      const { hoursWorkedStr, overtime, isShortDuration } = calculateWorkHours(
        checkInMinutes,
        checkOutMinutes
      );
      newEntry = {
        ...timesheetRecord[punchDateKey],
        check_out: punchTime,
        hours_worked: hoursWorkedStr,
        overtime,
        status: {
          ...timesheetRecord[punchDateKey].status,
          Missing: false,
          "Short Duration": isShortDuration,
          WFH: wfhFlag ?? timesheetRecord[punchDateKey]?.status?.WFH ?? false,
        },
      };
    } else {
      newEntry = {
        ...newEntry,
        check_in: "-",
        check_out: punchTime,
        status: {
          ...newEntry.status,
          Missing: true,
          WFH: wfhFlag ?? newEntry.status?.WFH ?? false,
        },
      };
    }
  }

  const existingRecord = await client.query(
    `SELECT id, record FROM eSparkTalentAPI_time_sheet
     WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
    [employee_id, clientId, month, year]
  );

  if (existingRecord.rowCount > 0) {
    const currentRecord = existingRecord.rows[0].record || {};
    currentRecord[punchDateKey] = newEntry;

    await client.query(
      `UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2`,
      [currentRecord, existingRecord.rows[0].id]
    );
  } else {
    await client.query(
      `INSERT INTO eSparkTalentAPI_time_sheet
       (employee_id, client_id, month, year, record)
       VALUES ($1, $2, $3, $4, $5)`,
      [employee_id, clientId, month, year, { [punchDateKey]: newEntry }]
    );
  }
};

const updateNotification = async ({
  client,
  ref_id,
  type,
  email,
  status,
  description,
}) => {
  const existing = await client.query(
    `SELECT id FROM eSparkTalentAPI_notifications WHERE ref_id = $1 AND notification_type = $2`,
    [ref_id, type]
  );

  if (existing.rowCount > 0) {
    await client.query(
      `UPDATE eSparkTalentAPI_notifications SET email = $1, status = $2, description = $3
       WHERE ref_id = $4 AND notification_type = $5`,
      [email, status, description, ref_id, type]
    );
  } else {
    await client.query(
      `INSERT INTO eSparkTalentAPI_notifications (email, status, description, ref_id, notification_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, status, description, ref_id, type]
    );
  }
};

const updateClientPunchRequest = async (req, res) => {
  const { email: clientEmail } = req.user;
  const { id: requestId } = req.query;
  const { status: toUpdateStatus } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [clientEmail]
    );

    if (clientResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Client not found" });
    }

    const clientId = clientResult.rows[0].id;

    const punchReqResult = await client.query(
      `SELECT * FROM eSparkTalentAPI_punch_request WHERE id = $1`,
      [requestId]
    );

    if (punchReqResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Punch request not found" });
    }

    const punchRequest = punchReqResult.rows[0];

    if (punchRequest.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(200).json({ message: "This request is closed" });
    }

    const empResult = await client.query(
      `SELECT first_name, last_name, punch_timings, email FROM eSparkTalentAPI_employee WHERE id = $1`,
      [punchRequest.employee_id]
    );

    if (empResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = empResult.rows[0];
    const empName = `${employee.first_name} ${employee.last_name}`;

    const punchType = punchRequest.punch_type;
    const punchTime = punchRequest.punch_time;
    const wfhResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_wfh_request 
   WHERE employee_id = $1 
     AND $2::date BETWEEN start_date AND end_date 
     AND status = 'completed'`,
      [punchRequest.employee_id, punchRequest.date]
    );

    const wfhFlag = wfhResult.rowCount > 0;

    const timesheetQuery = await client.query(
      `SELECT record FROM eSparkTalentAPI_time_sheet
       WHERE employee_id = $1 AND client_id = $2 AND month = $3 AND year = $4`,
      [
        punchRequest.employee_id,
        clientId,
        format(new Date(punchRequest.date), "MMMM"),
        getYear(new Date(punchRequest.date)),
      ]
    );
    const timesheetRecord = timesheetQuery.rows[0]?.record || null;

    if (toUpdateStatus === "completed") {
      await updateOrCreateTimesheetRecord({
        client,
        employee_id: punchRequest.employee_id,
        clientId,
        date: punchRequest.date,
        punchTime,
        punchType,
        timesheetRecord,
        wfhFlag,
      });
    }

    await client.query(
      `UPDATE eSparkTalentAPI_punch_request SET status = $1 WHERE id = $2`,
      [toUpdateStatus, requestId]
    );

    await updateNotification({
      client,
      ref_id: requestId,
      type: "punch_request",
      email: employee.email,
      status: toUpdateStatus,
      description: `${punchType} punch request has been ${toUpdateStatus}`,
    });

    await client.query("COMMIT");

    return res.status(200).json({
      message: `${empName} ${punchType} request is ${toUpdateStatus}`,
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    logger.error("Error in updateClientPunchRequest:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) client.release();
  }
};

export default updateClientPunchRequest;
