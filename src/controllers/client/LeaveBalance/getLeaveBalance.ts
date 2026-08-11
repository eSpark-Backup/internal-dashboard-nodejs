import pool from '../../../config/db.js';
import { logger } from "../../../helpers/logger.js";


const getLeaveBalances = async (req, res) => {
    const { email } = req.user;

    try {
        const clientResult = await pool.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1`,
            [email]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: "Client not found" });
        }

        const clientId = clientResult.rows[0].id;

        const result = await pool.query(
            `
      SELECT
        emp.first_name || ' ' || emp.last_name AS employee_name,
        lb.casual_leaves->>'balance' AS casual_balance,
        lb.casual_leaves->>'availed' AS casual_availed,
        lb.sick_leaves->>'balance' AS sick_balance,
        lb.sick_leaves->>'availed' AS sick_availed,
        lb.annual_leaves->>'balance' AS annual_balance,
        lb.annual_leaves->>'availed' AS annual_availed
      FROM eSparkTalentAPI_client c
      INNER JOIN eSparkTalentAPI_outsource_employees oe ON oe.client_id = c.id
      INNER JOIN eSparkTalentAPI_leave_balance lb ON lb.employee_id = oe.employee_id
      INNER JOIN eSparkTalentAPI_employee emp ON emp.id = oe.employee_id
      WHERE c.id = $1
      `,
            [clientId]
        );


        const records = result.rows.map(row => {
            const casual = {
                balance: parseInt(row.casual_balance || 0),
                availed: parseInt(row.casual_availed || 0),
            };
            const sick = {
                balance: parseInt(row.sick_balance || 0),
                availed: parseInt(row.sick_availed || 0),
            };
            const annual = {
                balance: parseInt(row.annual_balance || 0),
                availed: parseInt(row.annual_availed || 0),
            };

            const taken = casual.availed + sick.availed + annual.availed;
            const balance = casual.balance + sick.balance + annual.balance;

            return {
                employee_name: row.employee_name,
                casual_leaves: casual.balance,
                sick_leaves: sick.balance,
                annual_leaves: annual.balance,
                taken,
                balance,
            };
        });

        return res.status(200).json(records);
    } catch (error) {
        logger.error('Error fetching leave balances:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export default getLeaveBalances;
