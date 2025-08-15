import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const getNotifications = async (req, res) => {
  try {

    const userEmail = req.user?.email;
    const talentEmail =
      process.env.TALENT_EMAIL || "talent@esparkconsultants.com";

    if (!userEmail) {
      return res.status(400).json({ message: "Missing user email." });
    }

    const userRes = await pool.query(
      `SELECT role FROM eSparkTalentAPI_end_user WHERE email = $1`,
      [userEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const role = userRes.rows[0].role;
    const notiArray = [];
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const notificationFormatType = (type) =>
      type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    const getClientsByIds = async (ids) => {
      if (!ids || ids.length === 0) return new Map();

      const clientRes = await pool.query(
        `SELECT * FROM eSparkTalentAPI_client WHERE id = ANY($1::int[])`,
        [ids]
      );

      const map = new Map();
      clientRes.rows.forEach((row) => map.set(row.id, row));
      return map;
    };

    const pushNotification = (type, description, dateObj) => {
      notiArray.push({
        type,
        description,
        date: dateObj.toISOString().split("T")[0],
        time: dateObj.toTimeString().split(" ")[0],
      });
    };

    const baseNotiQuery = `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND updated_at >= $2
    `;

    if (role === "employee") {
      const [notificationsData, empContract, offContract, policies, guides] =
        await Promise.all([
          pool.query(
            `${baseNotiQuery} AND notification_type NOT IN ('employee_contract', 'offshore_contracts')`,
            [userEmail, fiveDaysAgo]
          ),
          // Company contracts
          pool.query(
            `${baseNotiQuery} AND notification_type = 'employee_contract' AND created_at >= $2 ORDER BY created_at DESC`,
            [userEmail, fiveDaysAgo]
          ),

          // Client contracts
          pool.query(
            `${baseNotiQuery} AND notification_type = 'offshore_contracts' AND created_at >= $2 ORDER BY created_at DESC`,
            [userEmail, fiveDaysAgo]
          ),

          // Policies (employee only)
          pool.query(
            `
      SELECT * FROM eSparkTalentAPI_policy
      WHERE employee = true AND created_at >= $1
      ORDER BY created_at DESC
    `,
            [fiveDaysAgo]
          ),

          // Guides (employee only)
          pool.query(
            `
      SELECT * FROM eSparkTalentAPI_guide
      WHERE employee = true AND created_at >= $1
      ORDER BY created_at DESC
    `,
            [fiveDaysAgo]
          ),
        ]);

      logger.info(
        `Fetched general notifications: ${notificationsData.rows.length}`
      );
      logger.info(`Fetched company contracts: ${empContract.rows.length}`);
      logger.info(`Fetched client contracts: ${offContract.rows.length}`);
      logger.info(`Fetched employee policies: ${policies.rows.length}`);
      logger.info(`Fetched employee guides: ${guides.rows.length}`);

      notificationsData.rows.forEach((n) => {
        logger.info(
          `Adding general notification: ${notificationFormatType(
            n.notification_type
          )}`
        );
        pushNotification(
          notificationFormatType(n.notification_type),
          n.description,
          n.updated_at
        );
      });

      // Company Contracts
      if (empContract.rows.length > 0) {
        logger.info("Adding Company Contracts notification");
        pushNotification(
          "Company Contracts",
          `${empContract.rows.length} new contract has been added to company contracts.`,
          empContract.rows[0].updated_at
        );
      }
      // Client Contracts
      if (offContract.rows.length > 0) {
        logger.info("Adding Client Contracts notification");
        pushNotification(
          "Client Contracts",
          `${offContract.rows.length} new contract has been added to client contracts.`,
          offContract.rows[0].created_at
        );
      }

      // Policies
      if (policies.rows.length > 0) {
        const description = `${policies.rows.length} new polic${
          policies.rows.length === 1 ? "y has" : "ies have"
        } been added.`;
        logger.info("Adding Policy notification");
        pushNotification("Policy", description, policies.rows[0].created_at);
      }

      // Guides
      if (guides.rows.length > 0) {
        const description = `${guides.rows.length} new guid${
          guides.rows.length === 1 ? "e has" : "es have"
        } been added.`;
        logger.info("Adding Guide notification");
        pushNotification("Guide", description, guides.rows[0].created_at);
      }
    } else if (role === "client") {
      const [
        notificationsData,
        intSch,
        onboard,
        invoice,
        cltContract,
        offContract,
        policies,
        guides,
      ] = await Promise.all([
        pool.query(
          `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND updated_at >= $2
      AND notification_type NOT IN (
        'client_contract', 'offshore_contracts',
        'interview_schedule', 'onboarding',
        'other_payment', 'employee_invoice'
      )
    `,
          [userEmail, fiveDaysAgo]
        ),

        //  Interview schedules (added)
        pool.query(
          `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND notification_type = 'interview_schedule' AND status = 'added'
      ORDER BY created_at DESC
    `,
          [userEmail]
        ),

        //  Onboarding (added)
        pool.query(
          `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND notification_type = 'onboarding' AND status = 'added'
      ORDER BY created_at DESC
    `,
          [userEmail]
        ),

        //  Invoices (added)
        pool.query(
          `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND status = 'added'
      AND notification_type IN ('employee_invoice', 'other_payment')
      ORDER BY created_at DESC
    `,
          [userEmail]
        ),

        // Client Contracts
        pool.query(
          `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND notification_type = 'client_contract'
      AND created_at >= $2 ORDER BY created_at DESC
    `,
          [userEmail, fiveDaysAgo]
        ),

        //  Offshore Contracts
        pool.query(
          `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND notification_type = 'offshore_contracts'
      AND created_at >= $2 ORDER BY created_at DESC
    `,
          [userEmail, fiveDaysAgo]
        ),

        //  Policies (for clients)
        pool.query(
          `
      SELECT * FROM eSparkTalentAPI_policy
      WHERE client = true AND created_at >= $1
      ORDER BY created_at DESC
    `,
          [fiveDaysAgo]
        ),

        //  Guides (for clients)
        pool.query(
          `
      SELECT * FROM eSparkTalentAPI_guide
      WHERE client = true AND created_at >= $1
      ORDER BY created_at DESC
    `,
          [fiveDaysAgo]
        ),
      ]);

      // General notifications
      notificationsData.rows.forEach((n) => {
        const type = notificationFormatType(n.notification_type);
        logger.info(`Adding general notification: ${type}`);
        pushNotification(type, n.description, n.updated_at);
      });

      // Company Contracts
      if (cltContract?.rows?.length > 0) {
        const msg = `${cltContract.rows.length} new contract has been added to company contracts.`;
        logger.info(`Adding Company Contracts notification`);
        pushNotification(
          "Company Contracts",
          msg,
          cltContract.rows[0].created_at
        );
      }

      // Employee Contracts
      if (offContract?.rows?.length > 0) {
        const msg = `${offContract.rows.length} new contract has been added to employee contracts.`;
        logger.info(`Adding Employee Contracts notification`);
        pushNotification(
          "Employee Contracts",
          msg,
          offContract.rows[0].created_at
        );
      }

      // Policies
      if (policies?.rows?.length > 0) {
        const description = `${policies.rows.length} new polic${
          policies.rows.length === 1 ? "y has" : "ies have"
        } been added.`;
        logger.info(`Adding Policy notification`);
        pushNotification("Policy", description, policies.rows[0].created_at);
      }

      // Guides
      if (guides?.rows?.length > 0) {
        const description = `${guides.rows.length} new guid${
          guides.rows.length === 1 ? "e has" : "es have"
        } been added.`;
        logger.info(`Adding Guide notification`);
        pushNotification("Guide", description, guides.rows[0].created_at);
      }

      // Interview Schedule
      if (intSch?.rows?.length > 0) {
        const msg = `You have ${intSch.rows.length} new interview scheduled.`;
        logger.info(`Adding Interview Schedule notification`);
        pushNotification("Interview Schedule", msg, intSch.rows[0].created_at);
      }

      // Onboarding
      if (onboard?.rows?.length > 0) {
        const onboardCount = onboard.rows.length;
        const description =
          onboardCount === 1
            ? "1 new employee is added"
            : `${onboardCount} new employees are added`;
        logger.info(`Adding Onboarding notification`);
        pushNotification("Onboarding", description, onboard.rows[0].created_at);
      }

      // Invoice
      if (invoice?.rows?.length > 0) {
        const invoiceCount = invoice.rows.length;
        const description =
          invoiceCount === 1
            ? "1 new invoice is added"
            : `${invoiceCount} new invoices are added`;
        logger.info(`Adding Invoice notification`);
        pushNotification("Invoice", description, invoice.rows[0].created_at);
      }
    } else {
      const [hireReq, shortInt, rejInt, empInvoice, otherInv, wfhReq] =
        await Promise.all([
          pool.query(
            `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND notification_type = 'hiring_request' AND status = 'added' AND created_at >= $2
      ORDER BY created_at DESC
    `,
            [talentEmail, fiveDaysAgo]
          ),

          pool.query(
            `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND notification_type = 'interview_schedule' AND status = 'short_list' AND updated_at >= $2
      ORDER BY updated_at DESC
    `,
            [talentEmail, fiveDaysAgo]
          ),

          pool.query(
            `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE email = $1 AND notification_type = 'interview_schedule' AND status = 'rejected' AND updated_at >= $2
      ORDER BY updated_at DESC
    `,
            [talentEmail, fiveDaysAgo]
          ),

          pool.query(
            `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE (status = 'processing' OR status = 'paid')
      AND notification_type = 'employee_invoice' AND email = $1 AND updated_at >= $2
      ORDER BY updated_at DESC
    `,
            [talentEmail, fiveDaysAgo]
          ),

          pool.query(
            `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE (status = 'processing' OR status = 'paid')
      AND notification_type = 'other_payment' AND email = $1 AND updated_at >= $2
      ORDER BY updated_at DESC
    `,
            [talentEmail, fiveDaysAgo]
          ),

          pool.query(
            `
      SELECT * FROM eSparkTalentAPI_notifications
      WHERE status = 'added' AND notification_type = 'wfh_request' AND email = $1 AND updated_at >= $2
      ORDER BY updated_at DESC
    `,
            [talentEmail, fiveDaysAgo]
          ),
        ]);

      // HIRING REQUESTS

      const hiringRefIds = hireReq.rows.map((hr) => hr.ref_id);
      logger.info(
        `Processing ${
          hireReq.rows.length
        } hiring_request notifications with refIds: ${hiringRefIds.join(", ")}`
      );

      const hiringReqRes = await pool.query(
        `SELECT * FROM eSparkTalentAPI_hiring_request WHERE id = ANY($1::int[])`,
        [hiringRefIds]
      );
      logger.info(
        `Retrieved ${hiringReqRes.rows.length} hiring_request records from DB`
      );

      const hiringReqMap = new Map();
      hiringReqRes.rows.forEach((row) => hiringReqMap.set(row.id, row));
      const hiringClientIds = [
        ...new Set(hiringReqRes.rows.map((r) => r.client_id)),
      ];
      logger.info(
        `Unique client IDs in hiring requests: ${hiringClientIds.join(", ")}`
      );

      const hiringClientMap = await getClientsByIds(hiringClientIds);

      for (const hr of hireReq.rows) {
        const hiring = hiringReqMap.get(hr.ref_id);
        if (!hiring) {
          logger.warn(
            `Skipping: No hiring_request found for ref_id: ${hr.ref_id}`
          );
          continue;
        }

        const client = hiringClientMap.get(hiring.client_id);
        if (!client) {
          logger.warn(
            `Skipping: No client found for client_id: ${hiring.client_id}`
          );
          continue;
        }
        logger.info(
          `Added Hiring Request notification for client ${client.company_name}`
        );

        notiArray.push({
          type: "Hiring Request",
          description: `New hiring request has been generated by ${client.company_name}`,
          date: hr.created_at.toISOString().split("T")[0],
          time: hr.created_at.toTimeString().split(" ")[0],
          client_email: client.email,
          client_record_id: client.id,
        });
      }

      // INTERVIEW SHORTLIST
      logger.info(
        `Found ${shortInt.rows.length} interview_schedule (short_list) notifications`
      );
      const interviewShortRefIds = shortInt.rows.map((st) => st.ref_id);
      if (interviewShortRefIds.length === 0) {
        logger.info("No interview_schedule (short_list) ref_ids to process.");
      }

      const interviewShortSchedulesRes = await pool.query(
        `SELECT * FROM eSparkTalentAPI_interview_schedule WHERE id = ANY($1::int[])`,
        [interviewShortRefIds]
      );
      logger.info(
        `Retrieved ${interviewShortSchedulesRes.rows.length} interview_schedule records from DB`
      );

      const interviewShortScheduleMap = new Map();
      interviewShortSchedulesRes.rows.forEach((row) =>
        interviewShortScheduleMap.set(row.id, row)
      );
      const interviewShortClientIds = [
        ...new Set(interviewShortSchedulesRes.rows.map((s) => s.client_id)),
      ];
      logger.info(
        `Unique client IDs for interview_shortlist: ${interviewShortClientIds.join(
          ", "
        )}`
      );

      const interviewShortClientMap = await getClientsByIds(
        interviewShortClientIds
      );

      for (const st of shortInt.rows) {
        const schedule = interviewShortScheduleMap.get(st.ref_id);
        if (!schedule) {
          logger.warn(`Skipping: No schedule found for ref_id: ${st.ref_id}`);
          continue;
        }

        const client = interviewShortClientMap.get(schedule.client_id);
        if (!client) {
          logger.warn(
            `Skipping: No client found for schedule.client_id: ${schedule.client_id}`
          );
          continue;
        }
        logger.info(
          `Added Interview Shortlist notification for ${schedule.employee_name} under ${client.company_name}`
        );

        notiArray.push({
          type: "Interview Shortlist",
          description: `${schedule.employee_name} has been shortlisted by ${client.company_name}`,
          date: st.updated_at.toISOString().split("T")[0],
          time: st.updated_at.toTimeString().split(" ")[0],
          client_email: client.email,
          client_record_id: client.id,
        });
      }

      // INTERVIEW REJECT
      logger.info(
        `Found ${rejInt.rows.length} interview_schedule (rejected) notifications`
      );

      const rejectedInterviewRefIds = rejInt.rows.map((rj) => rj.ref_id);
      if (rejectedInterviewRefIds.length === 0) {
        logger.info("No rejected interview ref_ids to process.");
      }
      const rejectedSchedulesRes = await pool.query(
        `SELECT * FROM eSparkTalentAPI_interview_schedule WHERE id = ANY($1::int[])`,
        [rejectedInterviewRefIds]
      );
      logger.info(
        `Retrieved ${rejectedSchedulesRes.rows.length} interview_schedule (rejected) records from DB`
      );

      const scheduleMap = new Map();
      rejectedSchedulesRes.rows.forEach((row) => scheduleMap.set(row.id, row));
      const interviewRejectClientIds = [
        ...new Set(rejectedSchedulesRes.rows.map((s) => s.client_id)),
      ];
      logger.info(
        `Unique client IDs for interview rejects: ${interviewRejectClientIds.join(
          ", "
        )}`
      );

      const interviewRejectClientMap = await getClientsByIds(
        interviewRejectClientIds
      );

      for (const rj of rejInt.rows) {
        const schedule = scheduleMap.get(rj.ref_id);
        if (!schedule) {
          logger.warn(
            `Skipping: No schedule found for rejected ref_id: ${rj.ref_id}`
          );
          continue;
        }

        const client = interviewRejectClientMap.get(schedule.client_id);
        if (!client) {
          logger.warn(
            `Skipping: No client found for schedule.client_id: ${schedule.client_id}`
          );
          continue;
        }

        logger.info(
          `Added Interview Reject notification for ${schedule.employee_name} by ${client.company_name}`
        );

        notiArray.push({
          type: "Interview Reject",
          description: `${schedule.employee_name} has been rejected by ${client.company_name}`,
          date: rj.updated_at.toISOString().split("T")[0],
          time: rj.updated_at.toTimeString().split(" ")[0],
          client_email: client.email,
          client_record_id: client.id,
        });
      }

      // EMPLOYEE INVOICE
      const empInvoiceIds = empInvoice.rows.map((i) => i.ref_id);
      if (empInvoiceIds.length === 0) {
        logger.info("No employee_invoice ref_ids to process.");
      }
      const invoiceRes = await pool.query(
        `SELECT * FROM eSparkTalentAPI_employee_invoice WHERE id = ANY($1::int[])`,
        [empInvoiceIds]
      );
      logger.info(
        `Retrieved ${invoiceRes.rows.length} employee_invoice records from DB`
      );

      const invoiceMap = new Map();
      invoiceRes.rows.forEach((row) => invoiceMap.set(row.id, row));

      const empInvoiceClientIds = [
        ...new Set(invoiceRes.rows.map((i) => i.client_id)),
      ];
      logger.info(
        `Unique client IDs for employee_invoice: ${empInvoiceClientIds.join(
          ", "
        )}`
      );

      const empInvoiceClientMap = await getClientsByIds(empInvoiceClientIds);

      for (const inv of empInvoice.rows) {
        const invoice = invoiceMap.get(inv.ref_id);
        if (!invoice) {
          logger.warn(
            `Skipping: No employee_invoice found for ref_id: ${inv.ref_id}`
          );
          continue;
        }

        const client = empInvoiceClientMap.get(invoice.client_id);
        if (!client) {
          logger.warn(
            `Skipping: No client found for client_id: ${invoice.client_id}`
          );
          continue;
        }

        logger.info(
          `Added Employee Invoice notification for ${client.company_name} with status ${inv.status}`
        );

        notiArray.push({
          type: "Employee Invoice",
          description: `Employee Invoice has been ${inv.status} by ${client.company_name}`,
          date: invoice.updated_at.toISOString().split("T")[0],
          time: invoice.updated_at.toTimeString().split(" ")[0],
          client_email: client.email,
          client_record_id: client.id,
        });
      }

      // OTHER PAYMENTS
      logger.info(`Found ${otherInv.rows.length} other_payment notifications`);

      const otherPaymentRefIds = otherInv.rows.map((inv) => inv.ref_id);
      if (otherPaymentRefIds.length === 0) {
        logger.info("No other_payment ref_ids to process.");
      }
      const otherPaymentsRes = await pool.query(
        `SELECT * FROM eSparkTalentAPI_other_payment WHERE id = ANY($1::int[])`,
        [otherPaymentRefIds]
      );
      logger.info(
        `Retrieved ${otherPaymentsRes.rows.length} other_payment records from DB`
      );

      const paymentMap = new Map();
      otherPaymentsRes.rows.forEach((row) => paymentMap.set(row.id, row));
      const otherPaymentClientIds = [
        ...new Set(otherPaymentsRes.rows.map((p) => p.client_id)),
      ];
      logger.info(
        `Unique client IDs for other_payment: ${otherPaymentClientIds.join(
          ", "
        )}`
      );

      const otherPaymentClientMap = await getClientsByIds(
        otherPaymentClientIds
      );
      for (const inv of otherInv.rows) {
        const payment = paymentMap.get(inv.ref_id);
        if (!payment) {
          logger.warn(
            `Skipping: No other_payment found for ref_id: ${inv.ref_id}`
          );
          continue;
        }

        const client = otherPaymentClientMap.get(payment.client_id);
        if (!client) {
          logger.warn(
            `Skipping: No client found for client_id: ${payment.client_id}`
          );
          continue;
        }
        logger.info(
          `Added Other Payment notification for ${client.company_name} with status ${inv.status}`
        );

        notiArray.push({
          type: "Other Payments",
          description: `Other Payment has been ${inv.status} by ${client.company_name}`,
          date: payment.updated_at.toISOString().split("T")[0],
          time: payment.updated_at.toTimeString().split(" ")[0],
          client_email: client.email,
          client_record_id: client.id,
        });
      }

      // WFH REQUEST
      logger.info(`🔍 Found ${wfhReq.rows.length} wfh_request notifications`);
      const wfhRefIds = wfhReq.rows.map((inv) => inv.ref_id);
      if (wfhRefIds.length === 0) {
        logger.info("No wfh_request ref_ids to process.");
      }
      const wfhRes = await pool.query(
        `SELECT * FROM eSparkTalentAPI_wfh_request WHERE id = ANY($1::int[])`,
        [wfhRefIds]
      );
      logger.info(
        `Retrieved ${wfhRes.rows.length} wfh_request records from DB`
      );

      const wfhMap = new Map();
      wfhRes.rows.forEach((row) => wfhMap.set(row.id, row));

      const employeeIds = [...new Set(wfhRes.rows.map((w) => w.employee_id))];
      logger.info(
        `Unique employee IDs for wfh_request: ${employeeIds.join(", ")}`
      );

      const empRes = await pool.query(
        `SELECT * FROM eSparkTalentAPI_employee WHERE id = ANY($1::int[])`,
        [employeeIds]
      );
      logger.info(
        `Retrieved ${empRes.rows.length} employee records for WFH notifications`
      );

      const empMap = new Map();
      empRes.rows.forEach((e) => empMap.set(e.id, e));

      for (const inv of wfhReq.rows) {
        const wfh = wfhMap.get(inv.ref_id);
        if (!wfh) {
          logger.warn(
            `Skipping: No WFH request found for ref_id: ${inv.ref_id}`
          );
          continue;
        }

        const emp = empMap.get(wfh.employee_id);
        if (!emp) {
          logger.warn(
            `Skipping: No employee found for employee_id: ${wfh.employee_id}`
          );
          continue;
        }

        logger.info(
          `Added WFH Request notification by ${emp.first_name} ${emp.last_name}`
        );

        notiArray.push({
          type: "WFH Request",
          description: `WFH Request is created by ${emp.first_name} ${emp.last_name}`,
          date: wfh.updated_at.toISOString().split("T")[0],
          time: wfh.updated_at.toTimeString().split(" ")[0],
          employee_email: emp.email,
          employee_record_id: emp.id,
        });
      }
    }

    if (notiArray.length > 0) {
      logger.info(`Sending ${notiArray.length} notifications in response`);
      return res.status(200).json(notiArray);
    }

    logger.info("No notifications found. Sending empty array.");
    return res.status(200).json(notiArray);
  } catch (err) {
    logger.error("Error in getNotifications:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export default getNotifications;
