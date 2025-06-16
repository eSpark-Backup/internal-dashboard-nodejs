import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";
import { getSignedUrl } from "../../../helpers/s3.js";
import { format, getDaysInMonth } from 'date-fns';


const getTodayActivity = async (employeeEmail, workspaceClientId) => {
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
            [employeeEmail, workspaceClientId, currentMonth, currentYear]
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

        return res.status(200).json({ employee_details: employeeDetails, company: companyResult.rows[0], workspaces: workspaces, leave_summary: leave_summary, today_activity: todayActivity });

    } catch (error) {
        logger.error(`Error fetching home details: ${error.message}`);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export default getHomeDetails;
