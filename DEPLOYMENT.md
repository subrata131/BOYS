# Deployment Guide for BOYS Expense Tracker

Since your project is a static web application (HTML, CSS, and JavaScript), you can deploy it for free using **Netlify Drop**. This requires no coding tools, command line, or configuration.

## Option 1: The Easiest Method (Netlify Drop)

1.  **Locate your project folder**:
    Open the folder containing your files (where `index.html` is located) in your File Explorer:
    `s:\pogramming\Basics C program\BOYS_Expense_Tracker`

2.  **Open Netlify Drop**:
    Go to this URL in your browser: [https://app.netlify.com/drop](https://app.netlify.com/drop)

3.  **Drag and Drop**:
    Drag the entire `BOYS_Expense_Tracker` folder directly onto the dashed area on the Netlify page.

4.  **Wait for Upload**:
    Netlify will upload your files. Once complete, you will see a "Production deploy" success message.

5.  **View Your Site**:
    Click the link provided by Netlify (e.g., `https://random-name-12345.netlify.app`) to see your live expense tracker.

6.  **(Optional) Rename Your Site**:
    If you sign up/log in to Netlify, you can go to "Site settings" -> "Change site name" to give it a custom name like `boys-expense-tracker.netlify.app`.

### Important Notes
- **PWA Features**: Because you have a `sw.js` and `manifest.json`, your app can be installed on phones.
    - **iPhone**: Open the link in Safari -> Share -> Add to Home Screen.
    - **Android**: Open in Chrome -> Install App (or Add to Home Screen).
- **Updates**: To update your site, just drag the folder again to the "Deploys" tab in your Netlify dashboard (if you created an account), or repeat the process for a new link.

## Option 2: Using Vercel (If you create a GitHub Account)

If you decide to use Git in the future:
1.  Upload your code to a GitHub repository.
2.  Go to [Vercel.com](https://vercel.com) and log in with GitHub.
3.  Click "Add New Project", select your repository, and click "Deploy".
4.  Vercel will automatically redeploy whenever you push changes to GitHub.
