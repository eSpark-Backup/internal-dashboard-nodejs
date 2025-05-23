import pool from "../../config/db.js"
import { logger } from "../../helpers/logger.js"
import { getSignedUrl } from "../../helpers/s3.js"

const getEmployeeDetails = async (req, res) => {
    const talentEmail = process.env.TALENT_EMAIL;
    const { id, tab } = req.query
    try {
        const employee = await pool.query(
        `SELECT id, employee_id, first_name, last_name, gender, TO_CHAR(dob, 'YYYY-MM-DD') as dob, phone_number, email, personal_email, marital_status, emergency_contact, TO_CHAR(joining_date, 'YYYY-MM-DD') as joining_date, job_title, role, job_status, TO_CHAR(starting_date, 'YYYY-MM-DD') as starting_date, TO_CHAR(ending_date, 'YYYY-MM-DD') as ending_date, image FROM eSparkTalentAPI_employee WHERE id = $1`,
        [id]
    )

    if (!employee.rows[0]?.id) {
        return res.status(404).json({ message: "Employee does not exist with given employee email" });
    }

    const emp_record = employee.rows[0];

    switch (tab) {
        case "client":
            const clientResult = await pool.query(
                `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
                [talentEmail]
            );

            if (!clientResult.rows[0]?.id) {
                return res.status(404).json({ message: "Client does not exist" });
            }

            const clientsData = await pool.query(
                `SELECT 
                    c.first_name,
                    c.last_name,
                    c.client_id,
                    oe.job_title,
                    oe.employment_term,
                    TO_CHAR(c.join_date, 'YYYY-MM-DD') as join_date,
                    oe.status
                FROM eSparkTalentAPI_outsource_employees oe
                JOIN eSparkTalentAPI_client c ON c.id = oe.client_id
                WHERE oe.employee_id = $1 
                AND oe.client_id != $2`,
                [id, clientResult.rows[0].id]
            );

            const active_clients_data = clientsData.rows
                .filter(client => client.status === 'active')
                .map(client => ({
                    client_name: `${client.first_name} ${client.last_name}`,
                    client_id: client.client_id,
                    job_title: client.job_title,
                    employeement_term: client.employment_term,
                    join_date: client.join_date
                }));

            const terminated_clients_data = clientsData.rows
                .filter(client => client.status === 'terminated')
                .map(client => ({
                    client_name: `${client.first_name} ${client.last_name}`,
                    client_id: client.client_id,
                    job_title: client.job_title,
                    employeement_term: client.employment_term,
                    join_date: client.join_date
                }));

            return res.status(200).json({ 
                active_clients: active_clients_data, 
                terminated_clients: terminated_clients_data 
            });
        case "assets":
            const assets = await pool.query(
                `SELECT id, gadget, asset_id, TO_CHAR(assigned_date, 'YYYY-MM-DD') as assigned_date, assignee_name, assignee_email FROM eSparkTalentAPI_asset WHERE employee_id = $1`,
                [id]
            )

            return res.status(200).json({ assets: assets.rows })
        default:

            let image_path = null;
            try {
                image_path = await getSignedUrl(emp_record.image)
            } catch (error) {
                logger.error(`Error getting signed url: ${error}`)
            }

            const response = {
                id: emp_record.id,
                employee_id: emp_record.employee_id,
                first_name: emp_record.first_name,
                last_name: emp_record.last_name,
                gender: emp_record.gender,
                dob: emp_record.dob,
                phone_number: emp_record.phone_number,
                email: emp_record.email,
                personal_email: emp_record.personal_email,
                marital_status: emp_record.marital_status,
                image_path: image_path,
                emergency_contact: emp_record.emergency_contact,
                joining_date: emp_record.joining_date,
                job_title: emp_record.job_title,
                role: emp_record.role,
                status: emp_record.job_status,
                probation_started: emp_record.starting_date,
                probation_ended: emp_record.ending_date
            };

            return res.status(200).json(response);
    }
} catch (error) {
    logger.error(`Error in getEmployeeDetails: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
}
}

export default getEmployeeDetails