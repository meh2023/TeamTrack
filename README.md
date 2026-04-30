# ⚡ TaskFlow — Team Task Manager

A full-stack project management web app with role-based access control, built for team collaboration.

## 🔗 Live URL
**[https://taskflow-production-51fb.up.railway.app](https://taskflow-production-51fb.up.railway.app)**

## 🚀 Features

### Authentication
- User signup & login with JWT tokens
- Passwords hashed with bcrypt
- Protected API routes

### Project & Team Management
- Create, edit, delete projects
- Invite team members by email
- Role-based access: **Admin** and **Member**

### Task Management
- Create tasks with title, description, priority (Low/Medium/High), due date
- Assign tasks to team members
- Kanban board with 3 columns: **To Do → In Progress → Done**
- Click status buttons to move tasks between columns

### Dashboard
- Overview stats: total projects, tasks, in-progress, completed, overdue
- Project cards with progress bars
- Recent tasks assigned to you

### Role-Based Access Control (RBAC)
| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Edit/Delete project | ✅ | ❌ |
| Add/Remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Update any task | ✅ | ❌ |
| Update assigned task | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | PostgreSQL + Prisma ORM |
| Authentication | JWT + bcrypt |
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Deployment | Railway |

## 📁 Project Structure
```
├── prisma/
│   └── schema.prisma          # Database models
├── server/
│   ├── index.js               # Express server entry
│   ├── config/db.js           # Prisma client
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── rbac.js            # Role-based access control
│   └── routes/
│       ├── auth.js            # Signup/Login APIs
│       ├── projects.js        # Project CRUD
│       ├── members.js         # Member management
│       ├── tasks.js           # Task CRUD
│       └── dashboard.js       # Stats aggregation
├── public/
│   ├── index.html             # Login/Signup page
│   ├── dashboard.html         # Dashboard
│   ├── project.html           # Project detail + Kanban
│   ├── css/styles.css         # Styling
│   └── js/
│       ├── api.js             # API client helper
│       ├── auth.js            # Auth logic
│       ├── dashboard.js       # Dashboard logic
│       └── project.js         # Project detail logic
├── package.json
└── .gitignore
```

## 🗄️ Database Schema

### Models
- **User** — id, name, email, password, createdAt
- **Project** — id, name, description, ownerId, createdAt
- **ProjectMember** — id, projectId, userId, role (ADMIN/MEMBER), joinedAt
- **Task** — id, title, description, status (TODO/IN_PROGRESS/DONE), priority (LOW/MEDIUM/HIGH), dueDate, projectId, assigneeId, creatorId, createdAt

### Relationships
- User → owns many Projects
- User → has many ProjectMemberships
- Project → has many Members and Tasks
- Task → belongs to Project, assigned to User, created by User

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/members` | List members |
| POST | `/api/projects/:id/members` | Add member by email (Admin) |
| PUT | `/api/projects/:id/members/:userId` | Change role (Admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (Admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/tasks` | List tasks |
| POST | `/api/projects/:id/tasks` | Create task |
| PUT | `/api/projects/:id/tasks/:taskId` | Update task |
| DELETE | `/api/projects/:id/tasks/:taskId` | Delete task (Admin) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get aggregated stats |

## 🛠️ Local Setup

```bash
# Clone the repo
git clone https://github.com/meh2023/Taskflow.git
cd Taskflow

# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_secret_key"
PORT=3000

# Push database schema
npx prisma db push

# Start the server
npm start
```

## 📹 Demo Video
[Watch the demo video](./demo.md)

## 📝 License
MIT
