import pool from '../../../config/db.js';
import { logger } from "../../../helpers/logger.js";
import { fonts } from '../../../constants/index.js';
import PdfPrinter from 'pdfmake';

const printer = new PdfPrinter(fonts);

const getTimeOffDownloadReport = async (req, res) => {
    const { email } = req.user;
    const get_tab = req.query.tab;

    let client;

    try {

        client = await pool.connect();
        const clientResult = await client.query(
            `SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1`,
            [email]
        );


        if (clientResult.rows.length === 0) {
            return res.status(404).json({ message: "Client not found" });
        }


        const clientId = clientResult.rows[0].id;
        let tableHeaders = [], tableData = [], colWidths = [], fileHeading = '', filename = '';
        const now = new Date();
        const current_datetime = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

        if (get_tab === 'lr') {
            // Leave Requests
            const result = await client.query(`
        SELECT 
          lr.id,
          e.employee_id,
          e.first_name,
          e.last_name,
          oe.country,
          oe.job_title AS department,
          lr.leave_type,
          lr.count,
          lr.created_at AS requested_at,
          lr.status
        FROM eSparkTalentAPI_leave_request lr
        JOIN eSparkTalentAPI_employee e ON lr.employee_id = e.id
        LEFT JOIN eSparkTalentAPI_outsource_employees oe 
          ON oe.employee_id = lr.employee_id AND oe.client_id = lr.client_id
        WHERE lr.client_id = $1
      `, [clientId]);


            tableHeaders = [
                'Employee ID', 'Employee Name', 'Country', 'Department', 'Leave Type', 'Count', 'Requested At', 'Status'
            ];

            fileHeading = 'Leave Request';
            filename = `leaveRequestReport_${current_datetime}.pdf`;
            tableData = result.rows.map(row => [
                row.employee_id,
                `${row.first_name || ''} ${row.last_name || ''}`.trim(),
                row.country || '',
                row.department || '',
                row.leave_type,
                row.count,
                row.requested_at ? new Date(row.requested_at).toISOString().split('T')[0] : '',
                row.status
            ]);
            colWidths = [65, 150, 80, 80, 60, 35, 70, 50];


        } else if (get_tab === 'cio') {
            // Clock In/Out Requests
            const result = await client.query(`
        SELECT 
          pr.employee_id,
          e.first_name,
          e.last_name,
          TO_CHAR(pr.date, 'YYYY-MM-DD') as date,
          pr.punch_time,
          pr.punch_type,
          pr.status
        FROM eSparkTalentAPI_punch_request pr
        JOIN eSparkTalentAPI_employee e ON e.id = pr.employee_id
        WHERE pr.client_id = $1
      `, [clientId]);


            tableHeaders = [
                'Employee ID', 'Employee Name', 'Date', 'Punch Time', 'Punch Type', 'Status'
            ];

            fileHeading = 'Clock In Out Request';
            filename = `ClockInOutReport${current_datetime}.pdf`;
            tableData = result.rows.map(row => [
                row.employee_id,
                `${row.first_name || ''} ${row.last_name || ''}`.trim(),
                row.date,
                row.punch_time,
                row.punch_type,
                row.status
            ]);
            colWidths = [65, 150, 80, 80, 80, 80];


        } else if (get_tab === 'lb') {
            // Leave Balances
            const result = await client.query(`
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
      `, [clientId]);


            tableHeaders = [
                'Employee Name', 'Casual Leave', 'Sick Leave', 'Annual Leave', 'Taken', 'Balance'
            ];


            fileHeading = 'Leave Balance';
            filename = `leaveBalanceReport${current_datetime}.pdf`;
            tableData = result.rows.map(row => {
                const casual = parseInt(row.casual_balance || 0);
                const sick = parseInt(row.sick_balance || 0);
                const annual = parseInt(row.annual_balance || 0);
                const casualAvailed = parseInt(row.casual_availed || 0);
                const sickAvailed = parseInt(row.sick_availed || 0);
                const annualAvailed = parseInt(row.annual_availed || 0);
                const taken = casualAvailed + sickAvailed + annualAvailed;
                const balance = casual + sick + annual;
                return [
                    row.employee_name,
                    casual,
                    sick,
                    annual,
                    taken,
                    balance
                ];
            });
            colWidths = [150, 80, 80, 80, 80, 80];
        }

        const docDefinition = {
            content: [
                { text: fileHeading, style: 'header', alignment: 'center' },
                { text: '\n' },
                {
                    table: {
                        headerRows: 1,
                        widths: colWidths,
                        body: [tableHeaders, ...tableData],
                    },
                    layout: {
                        fillColor: function (rowIndex) {
                            if (rowIndex === 0) return '#808080'; 
                            return '#fff9db'; 
                        },
                        hLineWidth: function () { return 1; },
                        vLineWidth: function () { return 1; },
                        hLineColor: function () { return '#000000'; },
                        vLineColor: function () { return '#000000'; },
                    },
                    alignment: 'center',
                    margin: [40, 0, 40, 0],
                },
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 10],
                },
                table: {
                    alignment: 'center',
                },
                tableHeader: {
                    alignment: 'center',
                    bold: true,
                    color: 'white',
                },
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 10,
                alignment: 'center',
            },
            pageOrientation: 'landscape',
        };
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        let chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(pdfBuffer);
        });
        pdfDoc.end();
    } catch (err) {
        logger.error('Error generating time off report PDF:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (client) client.release();
    }
};

export default getTimeOffDownloadReport;



