# HaritSetu - Smart Waste Management System

Welcome to HaritSetu! This is a complete, real-time React application that utilizes Supabase for dynamic database management, authentication, and secure row-level security. 

## Quick Start Guide

If you have downloaded this project as a ZIP or cloned it from GitHub, follow these exact steps to get the project running perfectly on your local machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Step 1: Open the Project
1. Extract/Unzip the downloaded folder.
2. Open **Visual Studio Code** (VS Code).
3. Go to `File > Open Folder...` and select the extracted `Harisetu` directory.
4. Once opened, hit `` Ctrl + ` `` (or go to `Terminal > New Terminal` in the top menu) to open the built-in terminal.

### Step 2: Install Dependencies
In your VS Code terminal, run the following command to download all the required packages (like React, Tailwind, and Recharts):
```bash
npm install
```

### Step 3: Setup the Database Connection (.env)
For security, the database connection keys are never uploaded to GitHub or shared in ZIP files. You must create a local environment file to connect the app to the backend.

1. In the root directory (where `package.json` is), create a new file named exactly: `.env`
2. Open the `.env` file and paste the following keys (ask the project owner for the exact values!):
```env
VITE_SUPABASE_URL=project_url_here
VITE_SUPABASE_ANON_KEY=project_anon_key_here
```
3. Save the file.

### Step 4: Run the Application
Once the dependencies are installed and the `.env` file is saved, start the local development server by running:
```bash
npm run dev
```

### Step 5: Start Exploring!
The terminal will provide a local link (usually `http://localhost:5173`). Ctrl+Click the link to open the app in your browser!

**Direct Portal Links:**
*   **Citizen Portal:** `http://localhost:5173/` (Login to upload waste and earn tokens)
*   **Worker Portal:** `http://localhost:5173/worker` (Login to fulfill operations)
*   **Command Center:** `http://localhost:5173/admin` (Login to monitor live telemetry and assign tasks)
