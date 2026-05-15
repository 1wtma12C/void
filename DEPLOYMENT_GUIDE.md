# 🚀 VOID — Deployment & Mobile Usage Guide

This guide explains how to get your app running on your **mobile phone or iPad** so you can use it anytime without starting your computer.

---

## 1. Do I need to start the server?
**No.** 
*   **The Server (`npm run dev`)** is only for when you are coding.
*   **Once Deployed**, the app lives on the internet (GitHub's servers). You can open it on your phone just like any other website (e.g., Google or Facebook) without your computer being on.

---

## 2. How to Upload (Deploy) your App
Since you asked "where to paste the code," here is the step-by-step guide to hosting it on **GitHub Pages**.

### Step A: Build the App (Prepare for Upload)
Before uploading, you must "build" the code into a format that browsers understand.
1.  Open your terminal in VS Code.
2.  Type this command and press Enter:
    ```bash
    npm run build
    ```
3.  This will create a new folder in your project called **`dist`**. This folder contains the "final" code.

### Step B: Upload to GitHub (The "Manual" Way)
If you want to upload files directly to GitHub:
1.  Go to your repository on GitHub.com.
2.  Create a new branch named **`gh-pages`** (or use your main branch).
3.  **Crucial:** You must upload the **CONTENTS** of the `dist` folder, not the whole project.
    *   Open the `dist` folder on your computer.
    *   Drag and drop all files inside `dist` (index.html, assets folder, etc.) into your GitHub repository.
4.  Go to **Settings > Pages** in your GitHub repo.
5.  Under **Build and deployment**, set the source to "Deploy from a branch" and select `gh-pages` (or `main`).
6.  Click **Save**. Your link will appear at the top!

### Step C: The "Automatic" Way (Recommended)
You already have a script to do this for you!
1.  In your terminal, type:
    ```bash
    npm run deploy
    ```
2.  This will automatically build the app and push it to a special `gh-pages` branch for you.

---

## 3. How to use it on your Mobile/iPad (Like a Real App)
Once your website link is live (e.g., `https://yourname.github.io/void-finance/`):

1.  Open **Safari** on your iPhone/iPad.
2.  Type in your website link.
3.  Tap the **Share** button (the square with an arrow pointing up).
4.  Scroll down and tap **"Add to Home Screen"**.
5.  Give it the name **"VOID"** and tap **Add**.

**Now, VOID will appear on your home screen with its own icon!** It will open in full-screen mode without the browser bars, looking like a premium app.

---

## 4. Troubleshooting: The Error
I have already fixed the common error for you! 
*   **What was the error?** The app was looking for its files in the wrong place (the root `/` instead of the relative `./` path).
*   **The Fix:** I updated `vite.config.js` and `manifest.json`. Now, when you build and upload, everything will load correctly!

---

### Need more help?
If you see a specific error message on your screen, please take a screenshot or tell me exactly what it says!
