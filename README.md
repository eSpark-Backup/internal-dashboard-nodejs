# eSpark Talent Dashboard Backend

A Node.js backend API for the eSpark Talent Dashboard system, providing comprehensive HR management, employee tracking, and client management functionalities.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- AWS S3 bucket (for file storage)
- Environment variables configured

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd internal-dashboard-nodejs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database Configuration
   DB_HOST=your_db_host
   DB_PORT=5432
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=your_aws_region
   S3_BUCKET=your_s3_bucket_name

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h

   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ```

4. **Run database migrations**

   ```bash
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 🔐 Super Admin Setup

**IMPORTANT**: After deploying the backend, you must create a super admin account to access the system.

### Step 1: Create Super Admin Account

Run the following SQL query in your PostgreSQL database:

```sql
INSERT INTO public.eSparkTalentAPI_end_user
  (username, email, password, role, is_superuser, is_active, is_staff)
VALUES
  ('Super Admin', 'superadmin@esparkconsultants.com', 'hashpassword', 'super-admin', true, true, false);
```

**Note**: Replace `'hashpassword'` with a properly hashed password. You can use bcrypt or your preferred hashing method.

### Step 2: Create Required Client Account

After logging in as the super admin on the frontend, you **MUST** create a client account with the following specifications:

- **Name**: Any name you prefer
- **Email**: `talent@esparkconsultants.com` (this is mandatory)
- **Status**: Active

**Important**: This client account will not appear in the regular client list but is required for system functionality.

## 📚 API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: `http://localhost:3000/api-docs`
- Postman Collection: Available in the `docs/` folder

## 🏗️ Project Structure

```
src/
├── controllers/          # Route controllers
│   ├── auth/            # Authentication controllers
│   ├── client/          # Client-related controllers
│   ├── employee/        # Employee-related controllers
│   └── HR/              # HR management controllers
├── routes/              # API route definitions
├── middleware/          # Custom middleware
├── helpers/             # Utility functions
├── config/              # Configuration files
├── migrations/          # Database migrations
├── validations/         # Request validation schemas
└── utils/               # Additional utilities
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm test` - Run tests (if configured)

## 🛠️ Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Employee Management**: Complete employee lifecycle management
- **Client Management**: Client onboarding and relationship management
- **Time Tracking**: Employee time tracking and attendance management
- **Leave Management**: Leave request processing and approval
- **Document Management**: File upload and storage with AWS S3
- **Reporting**: Comprehensive reporting and analytics
- **API Documentation**: Auto-generated Swagger documentation

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- File upload security
- SQL injection prevention
- CORS configuration

## 📝 Environment Variables

| Variable                | Description        | Required | Default |
| ----------------------- | ------------------ | -------- | ------- |
| `DB_HOST`               | PostgreSQL host    | Yes      | -       |
| `DB_PORT`               | PostgreSQL port    | No       | 5432    |
| `DB_NAME`               | Database name      | Yes      | -       |
| `DB_USER`               | Database user      | Yes      | -       |
| `DB_PASSWORD`           | Database password  | Yes      | -       |
| `PORT`                  | Server port        | No       | 3000    |
| `JWT_SECRET`            | JWT signing secret | Yes      | -       |
| `AWS_ACCESS_KEY_ID`     | AWS access key     | Yes      | -       |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key     | Yes      | -       |
| `AWS_REGION`            | AWS region         | Yes      | -       |
| `S3_BUCKET`             | S3 bucket name     | Yes      | -       |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software owned by eSpark Consultants.

## 🆘 Support

For technical support or questions, please contact the development team or create an issue in the repository.

---

**Last Updated**: July 2025
**Version**: 1.0.0

## PayFast Payment Integration Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 2. PayFast Configuration

#### Sandbox/Testing:

```env
PAYFAST_ENVIRONMENT=sandbox
PAYFAST_MERCHANT_ID=102
PAYFAST_SECURED_KEY=zWHjBp2AlttNu1sK
```

#### Production:

```env
PAYFAST_ENVIRONMENT=production
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_SECURED_KEY=your_secured_key
PAYFAST_PRODUCTION_TOKEN_URL=https://production-url/GetAccessToken
PAYFAST_PRODUCTION_TRANSACTION_URL=https://production-url/PostTransaction
```

### 3. Webhook URL (CRITICAL)

PayFast needs to reach your webhook endpoint. For local development:

#### Option A: Use ngrok

```bash
ngrok http 3000
```

Then set:

```env
PAYFAST_CHECKOUT_URL=https://your-ngrok-url.ngrok.io/api/payfast/webhook
```

#### Option B: Deploy to public server

```env
PAYFAST_CHECKOUT_URL=https://yourdomain.com/api/payfast/webhook
```

**⚠️ Important:** Webhook URL MUST be publicly accessible and use HTTPS in production.

### 3.5 Success and Failure URLs

PayFast redirects users to these URLs after payment completion:

#### Local Development:

```env
PAYFAST_SUCCESS_URL=http://localhost:3000/api/payfast/success
PAYFAST_FAILURE_URL=http://localhost:3000/api/payfast/failure
```

#### Production:

```env
PAYFAST_SUCCESS_URL=https://yourdomain.com/api/payfast/success
PAYFAST_FAILURE_URL=https://yourdomain.com/api/payfast/failure
```

**Note:** These URLs serve user-friendly HTML pages showing payment results and update the database accordingly.

### 4. Database Migration

Run the PayFast migration:

```bash
psql -U postgres -d espark_talent_db -f src/migrations/011_payfast_integration.sql
```

### 5. Install Dependencies

```bash
npm install node-cron
```

### 6. Cron Jobs

Cron jobs run automatically on server start. To disable:

```env
ENABLE_CRON_JOBS=false
```

### 7. Testing

#### Test Payment Flow:

1. Create a test invoice
2. Initiate payment via client dashboard
3. Use PayFast sandbox credentials
4. Verify webhook receives notification

### 8. Production Checklist

- [ ] Set `PAYFAST_ENVIRONMENT=production`
- [ ] Configure production PayFast credentials
- [ ] Set HTTPS webhook URL
- [ ] Test webhook connectivity
- [ ] Enable CORS for your domain
- [ ] Configure email provider
- [ ] Test cron jobs in production timezone
- [ ] Monitor logs for errors
