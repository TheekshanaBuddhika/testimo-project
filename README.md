# Testimo Project

Testimo is a SaaS platform for collecting, managing, and showcasing text-based customer testimonials via embeddable web widgets. This is a full-stack mono-repo containing both a React (Vite) frontend and a Next.js API backend.

## 🚀 Getting Started

If you have just cloned or copied this project to a new computer, follow these simple steps to get it running.

### 1. Install All Dependencies
To make setup easy, there is a single script that installs the dependencies for the main folder, the frontend, and the backend all at once.
Open a terminal in the main `testimo-project` folder and run:
```bash
npm run install-all
```

### 2. Environment Variables
Make sure you have your `.env.local` files securely copied to the new computer.
- **Backend:** Ensure `backend/.env.local` exists and contains your Aiven database credentials, Google OAuth secrets, and NextAuth URLs.
- **Frontend:** Ensure `frontend/.env.local` exists (if applicable) with any VITE_ prefixed environment variables.

*(Note: Because your database is securely hosted in the cloud on Aiven, you **do not** need to re-run the database setup or migrate any tables. As long as your `.env.local` points to the Aiven database, your app will connect and all your data will be right there!)*

### 3. Run the App
You can start both the frontend and the backend servers simultaneously using one command.
Open a terminal in the main `testimo-project` folder and run:
```bash
npm run dev
```
This command uses `concurrently` to boot up the Vite server (usually on `http://localhost:5173`) and the Next.js API server (usually on `http://localhost:3001`), streaming both of their logs into this single terminal window.

---

## 📂 Project Structure

- `/frontend` - The React application built with Vite and standard CSS.
- `/backend` - The Next.js application (App Router) handling the API endpoints and authentication.
- `/database` - Contains the `schema.sql` blueprint for the MySQL database.

## 🛠️ Database Setup (For fresh databases only)
If you are moving to a brand new database (e.g., creating a new Aiven instance from scratch):
1. Update `backend/.env.local` with the new database credentials.
2. Run `npm run setup --prefix backend` to automatically connect and create all the necessary tables.
