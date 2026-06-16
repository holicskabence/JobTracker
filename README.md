# JobTracker

A full-stack job application tracking platform built with ASP.NET Core and Angular. It helps job seekers manage their applications, prepare for interviews, schedule events, and store documents — all in one place.

**Live demo:** https://green-meadow-0c9de8f03.7.azurestaticapps.net/

---

## Features

**Application management**
- Kanban board view with drag-and-drop across custom status columns
- Table view for a spreadsheet-style overview
- Track company, position, application date, links, and current status
- Configurable status pipeline (e.g. Saved → Applied → Interview → Offer → Rejected)

**Interview preparation**
- Create practice questions organized by category
- Record your answers and receive AI-powered feedback via Azure OpenAI (GPT-4.1-mini)
- Review past attempts and track progress over time

**Calendar and planning**
- Schedule interviews and follow-ups with event types and time slots
- Personal daily planner with task completion tracking

**Documents**
- Upload and manage resumes and cover letters stored in Azure Blob Storage
- Version tracking for document updates

**Statistics**
- Dashboard with application metrics, callback rates, offer conversion, and trend charts

**Profile**
- Set a target number of applications per period and track your goal progress
- Upload a profile avatar
- Google and Facebook OAuth support alongside email/password login

---

## Tech Stack

**Backend**
- .NET 9, ASP.NET Core Web API
- Entity Framework Core 9 with SQL Server (Azure SQL Database)
- JWT authentication with custom JwtService
- Google and Facebook OAuth integration
- Azure Blob Storage for file uploads
- Azure OpenAI (GPT-4.1-mini) for AI evaluation
- BCrypt.Net for password hashing
- Swagger / OpenAPI documentation

**Frontend**
- Angular 18 (standalone component architecture)
- TypeScript 5.5
- Angular Signals for state management
- GSAP for animations
- Angular Router with auth guards and HTTP interceptors

**Infrastructure**
- Azure SQL Database
- Azure Blob Storage
- Azure Static Web Apps (frontend hosting)
- EF Core migrations with automatic seeding on startup

---

## Architecture

The solution follows a layered Clean Architecture approach:

```
JobTracker.Domain          # Entities and repository interfaces (no external dependencies)
JobTracker.Application     # Business logic, DTOs, service interfaces
JobTracker.Infrastructure  # EF Core, Azure integrations, external auth, JWT
JobTracker.WebApi          # ASP.NET Core controllers, middleware, DI composition
JobTracker.Angular         # Angular 18 SPA
```

---

## Getting Started

### Prerequisites

- .NET 9 SDK
- Node.js 18+ and npm
- SQL Server (local or Azure)
- Azure Storage account (optional, for document uploads)
- Azure OpenAI resource (optional, for AI feedback)

### Backend

1. Clone the repository.
2. Update `JobTracker.WebApi/appsettings.json` with your connection string and any optional Azure credentials.
3. Run the API:

```bash
cd JobTracker.WebApi
dotnet run
```

The database is created and seeded automatically on first startup via EF Core migrations.

### Frontend

```bash
cd JobTracker.Angular
npm install
ng serve
```

The Angular dev server proxies API requests to `https://localhost:7000` by default. Adjust `proxy.conf.json` if your API runs on a different port.

### Environment configuration

Key settings in `appsettings.json`:

| Key | Description |
|-----|-------------|
| `ConnectionStrings:Default` | SQL Server connection string |
| `AzureStorage:ConnectionString` | Azure Blob Storage connection string |
| `AzureOpenAI:Endpoint` / `ApiKey` | Azure OpenAI resource credentials |
| `Jwt:Secret` | Secret used to sign JWT tokens |
| `Authentication:Google:ClientId` | Google OAuth client ID |
| `Authentication:Facebook:AppId` | Facebook OAuth app ID |

---

## Project Status

Active development. Core tracking, interview prep, calendar, documents, and statistics features are complete and deployed.
