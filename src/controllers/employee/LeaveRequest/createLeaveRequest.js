import pool from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { logger } from "../../../helpers/logger.js";
import { cleanupFiles, getFormattedTimestamp } from "../../../helpers/utils.js";
import { uploadToS3, S3_TEMP_BUCKET } from "../../../helpers/s3.js";

const createLeaveRequest = async (req, res) => {
  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");
    const {
      client_id: clientEmail,
      leave_type,
      start_date,
      end_date,
      requested_at,
      reason,
      count,
    } = req.body || {};

    const employeeEmail = req.user?.email;
    const userRole = req.user?.role;
    const attachmentFile = req.files?.attachment?.[0];

    if (!employeeEmail) {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res
        .status(401)
        .json({ message: "Unauthorized: no employee email in token" });
    }

    if (userRole !== "employee") {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res
        .status(403)
        .json({ message: "Forbidden: user is not an employee" });
    }

    const result = await client.query(
      "SELECT id FROM eSparkTalentAPI_employee WHERE email = $1",
      [employeeEmail]
    );

    if (result.rows.length === 0) {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res.status(404).json({ message: "Employee not found" });
    }
    const employeeId = result.rows[0].id;

    // ======== NEW LEAVE BALANCE CHECK START ========

    // Map leave_type to column
    const leaveColumnMap = {
      casual: "casual_leaves",
      sick: "sick_leaves",
      annual: "annual_leaves",
      unpaid: "unpaid_leaves",
      paid: "paid_leaves",
      hajj: "hajj_leaves",
    };

    const columnName = leaveColumnMap[leave_type];

    if (!columnName) {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res.status(400).json({ message: "Invalid leave type" });
    }

    // Get current leave balance
    const leaveBalanceRes = await client.query(
      `SELECT ${columnName} FROM eSparkTalentAPI_leave_balance WHERE employee_id = $1`,
      [employeeId]
    );

    if (leaveBalanceRes.rows.length === 0) {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res.status(400).json({ message: "Leave balance not found" });
    }

    const leaveData = leaveBalanceRes.rows[0][columnName];

    if (!leaveData || leaveData.status !== "enable") {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res.status(400).json({ message: "Leave type not allowed" });
    }

    // Calculate already requested leaves (pending or approved)
    const pendingLeavesRes = await client.query(
      `SELECT COALESCE(SUM(count),0) as total_requested
   FROM eSparkTalentAPI_leave_request
   WHERE employee_id = $1 AND leave_type = $2 AND status IN ('pending','approved')`,
      [employeeId, leave_type]
    );

    const alreadyRequested = Number(
      pendingLeavesRes.rows[0].total_requested || 0
    );
    const availableBalance = Number(leaveData.balance) - alreadyRequested;

    if (Number(count) > availableBalance) {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res.status(400).json({
        message: `Insufficient leave balance. You have ${availableBalance} ${leave_type} leave(s) remaining.`,
      });
    }

    // ======== NEW LEAVE BALANCE CHECK END ========

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [clientEmail]
    );

    if (clientResult.rows.length === 0) {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res.status(400).json({ message: "Invalid client email" });
    }

    const clientId = clientResult.rows[0].id;

    const overlappingLeavesQuery = `
      SELECT id FROM eSparkTalentAPI_leave_request
      WHERE employee_id = $1 AND client_id = $2
        AND start_date <= $4 AND end_date >= $3
    `;
    const overlappingResult = await client.query(overlappingLeavesQuery, [
      employeeId,
      clientId,
      start_date,
      end_date,
    ]);

    if (overlappingResult.rows.length > 0) {
      await cleanupFiles([{ localPath: attachmentFile?.path }]);
      return res.status(400).json({ message: "Leave request already present" });
    }

    let attachmentS3Key = null;

    if (attachmentFile) {
      try {
        const timestamp = getFormattedTimestamp();
        const fileName = path.basename(attachmentFile.originalname);
        const s3Key = `${S3_TEMP_BUCKET}/employees/leave_attachments/${timestamp}_${fileName}`;

        const fileContent = fs.readFileSync(attachmentFile.path);
        await uploadToS3(s3Key, fileContent, attachmentFile.mimetype);
        await cleanupFiles([{ localPath: attachmentFile?.path }]);

        attachmentS3Key = s3Key;
      } catch (uploadErr) {
        await cleanupFiles([{ localPath: attachmentFile?.path }]);
        await client.query("ROLLBACK");
        logger.error("Attachment upload failed:", uploadErr);
        return res.status(500).json({ message: "Failed to upload attachment" });
      }
    }

    const insertQuery = `
  INSERT INTO eSparkTalentAPI_leave_request (
    client_id, employee_id, leave_type, start_date, end_date,
    created_at, reason, attachment, count, status
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING id
`;

    const { rows } = await client.query(insertQuery, [
      clientId,
      employeeId,
      leave_type,
      start_date,
      end_date,
      requested_at,
      reason,
      attachmentS3Key,
      count,
      "pending",
    ]);

    const notificationInsertQuery = `
  INSERT INTO eSparkTalentAPI_notifications (email, ref_id, notification_type, description, status)
  VALUES ($1, $2, $3, $4, $5)
`;
    await client.query(notificationInsertQuery, [
      clientId,
      rows[0].id,
      "leave_request",
      `New leave request from ${employeeEmail} for ${leave_type} leave from ${start_date} to ${end_date}`,
      "added",
    ]);

    await client.query("COMMIT");

    return res.status(201).json({
      message: `${leave_type} leave request is pending`,
      id: rows[0].id,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("Leave request error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) client.release();
  }
};

export default createLeaveRequest;
