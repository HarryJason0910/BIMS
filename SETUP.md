# Setup Guide

This guide will help you set up the Job Bid and Interview Management System for development.

## Step 1: Prerequisites

Ensure you have the following installed:

### Required
- **Node.js 22.x or higher**: [Download](https://nodejs.org/)
- **npm 10.x or higher**: Comes with Node.js
- **Rust**: [Install Rust](https://www.rust-lang.org/tools/install)
- **MongoDB**: [Install MongoDB](https://www.mongodb.com/try/download/community)

### Platform-Specific Requirements

#### Windows
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)

#### macOS
- Xcode Command Line Tools: `xcode-select --install`

#### Linux
- Development packages:
  ```bash
  # Debian/Ubuntu
  sudo apt update
  sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
  ```

## Step 2: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd job-bid-management-system

# Install all dependencies
npm run install:all
```

## Step 3: MongoDB Setup

### Option A: Local MongoDB

1. Start MongoDB:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   # MongoDB runs as a service after installation
   ```

2. Verify MongoDB is running:
   ```bash
   mongosh
   ```

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Use the connection string in your `.env` file

## Step 4: Microsoft Graph API Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Configure:
   - Name: "Job Bid Management System"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Leave blank for now
5. Click "Register"
6. Note down:
   - Application (client) ID
   - Directory (tenant) ID
7. Go to "Certificates & secrets"
8. Create a new client secret
9. Note down the secret value (you won't be able to see it again)
10. Go to "API permissions"
11. Add permissions:
    - Microsoft Graph → Application permissions
    - Mail.Read
    - Mail.ReadWrite
12. Click "Grant admin consent"

## Step 5: Backend Configuration

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env` with your values:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/job-bid-system
MONGODB_DB_NAME=job-bid-system

# Microsoft Graph API Configuration
GRAPH_CLIENT_ID=<your-client-id>
GRAPH_CLIENT_SECRET=<your-client-secret>
GRAPH_TENANT_ID=<your-tenant-id>

# Email Polling Configuration
EMAIL_POLL_INTERVAL_MS=300000
EMAIL_FILTER_KEYWORDS=job,interview,application,position,role

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Step 6: Frontend Configuration

```bash
cd packages/frontend
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Step 7: Verify Installation

### Test Backend Build

```bash
cd packages/backend
npm run build
```

### Test Frontend Build

```bash
cd packages/frontend
npm run build
```

### Run Tests

```bash
# From root directory
npm test
```

## Step 8: Development Workflow

### Terminal 1: Backend Server

```bash
cd packages/backend
npm run dev
```

The backend will start on http://localhost:3000

### Terminal 2: Frontend Application

```bash
cd packages/frontend
npm run tauri:dev
```

This will:
1. Start the Vite dev server
2. Launch the Tauri desktop application
3. Enable hot-reload for both frontend and backend changes

## Troubleshooting

### MongoDB Connection Issues

**Error**: "MongoServerError: Authentication failed"
- Check your MongoDB URI
- Ensure MongoDB is running
- Verify credentials if using authentication

### Tauri Build Issues

**Error**: "Rust compiler not found"
- Install Rust: https://www.rust-lang.org/tools/install
- Restart your terminal after installation

**Error**: "WebView2 not found" (Windows)
- Download and install WebView2: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### Microsoft Graph API Issues

**Error**: "Invalid client secret"
- Regenerate the client secret in Azure Portal
- Update your `.env` file immediately (secrets expire)

**Error**: "Insufficient privileges"
- Ensure you've granted admin consent for the API permissions
- Check that you've added the correct permissions (Mail.Read, Mail.ReadWrite)

### Port Already in Use

**Error**: "Port 3000 is already in use"
- Change the PORT in `packages/backend/.env`
- Update VITE_API_BASE_URL in `packages/frontend/.env` accordingly

## Next Steps

After successful setup:

1. Review the [README.md](./README.md) for project overview
2. Check the [design document](./.kiro/specs/job-bid-management-system/design.md) for architecture details
3. Review the [requirements](./.kiro/specs/job-bid-management-system/requirements.md)
4. Start implementing features following the [tasks](./.kiro/specs/job-bid-management-system/tasks.md)

## Additional Resources

- [Tauri Documentation](https://tauri.app/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/overview)
- [Express.js Documentation](https://expressjs.com/)
