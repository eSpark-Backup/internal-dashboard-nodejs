import pool from "../../../config/db.js";
import { getSignedUrl } from "../../../helpers/s3.js";
import { logger } from "../../../helpers/logger.js";

const getClients = async (req, res) => {
    const excludedEmail = process.env.TALENT_EMAIL;

    try {

        const result = await pool.query(
            `
            SELECT 
                c.id,
                c.client_id,
                c.first_name,
                c.last_name,
                c.image,
                c.company_name,
                eu.is_active
            FROM eSparkTalentAPI_client AS c
            LEFT JOIN eSparkTalentAPI_end_user AS eu
                ON c.email = eu.email 
            WHERE c.email != $1
            `,
            [excludedEmail]
        );

        const records = await Promise.all(
            result.rows.map(async (row) => {
                const fullName = `${row.first_name} ${row.last_name}`;

                let signedImageUrl = null;
                if (row.image) {
                    try {
                        signedImageUrl = await getSignedUrl(row.image);
                    } catch (err) {
                        logger.error(
                            `Signed URL error for image ${row.image}: ${err.message}`
                        );
                    }
                }

                return {
                    id: row.id,
                    client_id: row.client_id,
                    name: fullName,
                    image_path: signedImageUrl,
                    company_name: row.company_name,
                    active: !!row.is_active,
                };
            })
        );

        return res.status(200).json(records);
    } catch (err) {
        logger.error(`Error while getting clients: ${err.message}`);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export default getClients;
