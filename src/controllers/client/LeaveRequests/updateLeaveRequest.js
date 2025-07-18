import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const updateLeaveRequestStatus = async (req, res) => {
    const { email } = req.user;
    const { id: requestId } = req.query;
    const toUpdateStatus = req.body.status;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const clientResult = await client.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1`,
            [email]
        );

        if (clientResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Client not found" });
        }

        const leaveRes = await client.query(
            `SELECT * FROM eSparkTalentAPI_leave_request WHERE id = $1`,
            [requestId]
        );

        if (leaveRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Leave request not found" });
        }

        const leaveRequest = leaveRes.rows[0];
        if (leaveRequest.status !== "pending") {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Leave request already rejected or completed" });
        }

        const empRes = await client.query(
            `SELECT first_name, last_name FROM eSparkTalentAPI_employee WHERE id = $1`,
            [leaveRequest.employee_id]
        );
        const employee = empRes.rows[0];

        let message = "";

        if (toUpdateStatus === "completed") {
            const balanceRes = await client.query(
                `SELECT * FROM eSparkTalentAPI_leave_balance WHERE employee_id = $1`,
                [leaveRequest.employee_id]
            );

            if (balanceRes.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ error: "Leave balance not found" });
            }

            const leaveBalance = balanceRes.rows[0];
            const { start_date, end_date, leave_type } = leaveRequest;

            const overlappingRes = await client.query(
                `SELECT * FROM eSparkTalentAPI_leave_request 
         WHERE employee_id = $1 AND client_id = $2 AND leave_type = $3 
           AND status = 'completed'
           AND start_date <= $4 AND end_date >= $5
           AND id != $6`,
                [
                    leaveRequest.employee_id,
                    leaveRequest.client_id,
                    leave_type,
                    end_date,
                    start_date,
                    requestId,
                ]
            );

            const overlappingLeaves = overlappingRes.rows;

            const start = new Date(start_date);
            const end = new Date(end_date);
            const allLeaveDays = [];

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    allLeaveDays.push(d.toISOString().split("T")[0]);
                }
            }

            for (const leave of overlappingLeaves) {
                const s = new Date(leave.start_date);
                const e = new Date(leave.end_date);
                for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                    const day = d.toISOString().split("T")[0];
                    const idx = allLeaveDays.indexOf(day);
                    if (idx > -1) allLeaveDays.splice(idx, 1);
                }
            }

            const adjustedCount = allLeaveDays.length;

            const now = new Date();
            if (now >= new Date(start_date)) {
                const timeSheetsRes = await client.query(
                    `SELECT * FROM eSparkTalentAPI_time_sheet 
           WHERE employee_id = $1 AND client_id = $2 
             AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
                    [leaveRequest.employee_id, leaveRequest.client_id]
                );

                for (const timesheet of timeSheetsRes.rows) {
                    let updated = false;
                    const record = timesheet.record || {};

                    for (const leaveDay of allLeaveDays) {
                        if (
                            record[leaveDay] &&
                            record[leaveDay].status &&
                            record[leaveDay].status["Day Off"] === false
                        ) {
                            record[leaveDay] = {
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
                            };
                            updated = true;
                        }
                    }

                    if (updated) {
                        await client.query(
                            `UPDATE eSparkTalentAPI_time_sheet SET record = $1 WHERE id = $2`,
                            [record, timesheet.id]
                        );
                    }
                }
            }

            const parsedBalances = {
                casual_leaves: leaveBalance.casual_leaves,
                sick_leaves: leaveBalance.sick_leaves,
                annual_leaves: leaveBalance.annual_leaves,
                hajj_leaves: leaveBalance.hajj_leaves,
                paid_leaves: leaveBalance.paid_leaves,
                unpaid_leaves: leaveBalance.unpaid_leaves,
            };

            if (parsedBalances[`${leave_type}_leaves`]) {
                parsedBalances[`${leave_type}_leaves`].balance -= adjustedCount;
                parsedBalances[`${leave_type}_leaves`].availed += adjustedCount;
            }

            await client.query(
                `UPDATE eSparkTalentAPI_leave_balance SET 
         casual_leaves = $1, sick_leaves = $2, annual_leaves = $3,
         hajj_leaves = $4, paid_leaves = $5, unpaid_leaves = $6
         WHERE employee_id = $7`,
                [
                    parsedBalances.casual_leaves,
                    parsedBalances.sick_leaves,
                    parsedBalances.annual_leaves,
                    parsedBalances.hajj_leaves,
                    parsedBalances.paid_leaves,
                    parsedBalances.unpaid_leaves,
                    leaveRequest.employee_id,
                ]
            );

            message = `${employee.first_name} ${employee.last_name} ${leave_type} leave request is accepted`;
        } else {
            message = `${employee.first_name} ${employee.last_name} ${leaveRequest.leave_type} leave request is ${toUpdateStatus}`;
        }

        await client.query(
            `UPDATE eSparkTalentAPI_leave_request SET status = $1 WHERE id = $2`,
            [toUpdateStatus, requestId]
        );

        await client.query(
            `UPDATE eSparkTalentAPI_notifications
       SET email = $1, status = $2, description = $3
       WHERE ref_id = $4 AND notification_type = 'leave_request'`,
            [
                leaveRequest.employee_id,
                toUpdateStatus,
                `leave request has been ${toUpdateStatus}`,
                requestId,
            ]
        );

        await client.query("COMMIT");
        return res.status(200).json({ message });
    } catch (error) {
        await client.query("ROLLBACK");
        logger.error(`Transaction failed: ${error.message}`);
        return res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
};

export default updateLeaveRequestStatus;
