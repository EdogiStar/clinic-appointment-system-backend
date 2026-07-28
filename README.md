# Clinic Appointment System — Backend

A secure RESTful API backend for a Clinic Appointment System built with Node.js, Express.js, Supabase, and PostgreSQL.

The system provides authentication, role-based access control, doctor management, specialty management, doctor availability scheduling, and appointment booking with conflict prevention.

### 🚀 Features

- User authentication with Supabase Auth
- Role-based access control
  - Patient
  - Doctor
  - Admin
- Secure API authentication using Bearer tokens
- Row Level Security (RLS) with Supabase
- Specialty management
- Doctor management
- Doctor availability management
- Appointment booking
- Doctor availability validation
- Double-booking prevention
- Overlapping appointment prevention
- Appointment status management
- Appointment status transition validation
- Patient appointment retrieval
- Doctor appointment retrieval
- Individual appointment retrieval
- Input validation using Joi

### 🛠️ Tech Stack

- Node.js
- Express.js
- JavaScript
- Supabase
- PostgreSQL
- Supabase Auth
- Joi
- JWT / Bearer Authentication
- Git & GitHub

### 📁 Project Structure

src/
├── config/
│   └── supabaseAdmin.js
│
├── controllers/
│   ├── appointment.controller.js
│   ├── availability.controller.js
│   ├── doctor.controller.js
│   └── ...
│
├── middleware/
│   ├── auth.middleware.js
│   ├── role.middleware.js
│   ├── validate.middleware.js
│   └── ...
│
├── routes/
│   ├── appointment.routes.js
│   ├── availability.routes.js
│   ├── doctor.routes.js
│   └── ...
│
├── services/
│   ├── appointment.service.js
│   ├── availability.service.js
│   ├── doctor.service.js
│   └── ...
│
├── validations/
│   ├── appointment.validation.js
│   └── ...
│
└── app.js

#### 👥 User Roles

Patient

Patients can:

- Register and log in
- View available doctors and specialties
- Book appointments
- View their own appointments
- Cancel their appointments

Doctor

Doctors can:

- Log in
- Manage their availability
- View assigned appointments
- Confirm appointments
- Complete appointments
- Cancel appointments

Admin

Administrators can:

- Manage users
- Manage doctors
- Manage specialties
- Manage appointments
- Access administrative statistics and resources

📅 Appointment Booking Flow

The appointment booking process follows these steps:

Patient
   ↓
Select Doctor
   ↓
Select Date & Time
   ↓
Check Doctor Availability
   ↓
Verify Requested Time
   ↓
Check Existing Appointments
   ↓
Prevent Double Booking
   ↓
Prevent Time Overlap
   ↓
Create Appointment
   ↓
Status = pending

Appointments cannot be booked outside a doctor's configured availability.

The system also prevents both exact duplicate bookings and overlapping appointments.

🔄 Appointment Status Flow

Valid status transitions are:

pending
   ├──→ confirmed
   └──→ cancelled

confirmed
   ├──→ completed
   └──→ cancelled

completed
   └── No further changes

cancelled
   └── No further changes

This prevents invalid transitions such as:

cancelled → confirmed
completed → pending
completed → cancelled

#### 🔐 Security

The backend uses several security mechanisms:

- Supabase Authentication
- JWT Bearer tokens
- Role-based authorization
- PostgreSQL Row Level Security (RLS)
- Service-role access for trusted backend operations
- Input validation
- User ownership checks
- Doctor ownership checks
- Appointment conflict validation

The Supabase service role key must never be exposed to the frontend or committed to GitHub.

⚙️ Environment Variables

Create a ".env" file in the project root:

PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

Never commit ".env" to GitHub.

Add it to ".gitignore":

.env
node_modules/

#### 📦 Installation

Clone the repository:

git clone <your-repository-url>

Navigate into the project:

cd clinic-appointment-system-backend

Install dependencies:

npm install

Create and configure your ".env" file.

Start the development server:

npm run dev

Start the production server:

npm start

The API will be available at:

http://localhost:5000

🔗 Main API Endpoints

Authentication

POST /api/auth/register
POST /api/auth/login

Specialties

GET  /api/specialties
POST /api/specialties

Doctors

GET  /api/doctors
GET  /api/doctors/:id
POST /api/doctors

Doctor Availability

GET    /api/availability/doctor/:doctorId
POST   /api/availability
PATCH  /api/availability/:id
DELETE /api/availability/:id

Appointments

POST  /api/appointments
GET   /api/appointments/patient
GET   /api/appointments/doctor/:doctorId
GET   /api/appointments/:id
PATCH /api/appointments/:id/status

Protected endpoints require a valid Supabase access token:

Authorization: Bearer YOUR_ACCESS_TOKEN

🧪 Testing

API endpoints can be tested using:

- cURL
- Postman
- Insomnia

Example appointment request:

curl -X POST http://localhost:5000/api/appointments \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-d '{
  "doctor_id": "DOCTOR_UUID",
  "appointment_date": "2026-08-03",
  "start_time": "10:00",
  "end_time": "10:30",
  "reason": "General consultation"
}'

#### 🗄️ Database

The application uses PostgreSQL through Supabase.

Core database entities include:

users
specialties
doctors
doctor_availabilities
appointments

The database uses UUIDs for primary keys and Row Level Security policies to protect data access.

📌 Current Development Status

Completed

- [x] Supabase project configuration
- [x] Authentication
- [x] User roles
- [x] Role-based authorization
- [x] Specialty management
- [x] Doctor management
- [x] Doctor availability
- [x] Appointment booking
- [x] Availability validation
- [x] Double-booking prevention
- [x] Overlapping appointment prevention
- [x] Appointment retrieval
- [x] Appointment status management
- [x] Status transition validation

In Progress / Planned

- [ ] Admin dashboard statistics
- [ ] Admin user management
- [ ] Advanced appointment management
- [ ] Notification system
- [ ] Email/SMS appointment reminders
- [ ] Automated API testing
- [ ] API documentation with Swagger/OpenAPI
- [ ] Production deployment

🤝 Contribution

Contributions, suggestions, and improvements are welcome.

To contribute:

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Commit your changes.
5. Push the branch.
6. Open a Pull Request.

📄 License

This project is currently intended for educational and development purposes.

---

Built with ❤️ using Node.js, Express.js, Supabase, and PostgreSQL.