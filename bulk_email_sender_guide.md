# Bulk Email Sender — Chanchal Mahor
### Job Application Email Automation Guide

---

## What This Tool Does

This Python script automatically sends personalized job application emails with your resume attached to a list of HR contacts. Each email is customized with the recipient's name and company, making it feel personal rather than a generic mass email.

---

## Two Versions Available

### Version 1 — Hardcoded Contacts
You type the HR contacts directly inside the script as a list. Best for small, one-time sends where you have only a handful of recipients.

### Version 2 — CSV-Based Contacts
You provide a separate `contacts.csv` file with all your HR contacts. The script reads from it automatically. Best for large lists or when your contact list changes frequently — you only update the CSV, not the script.

---

## Folder Structure

Before running, make sure all required files are placed in the **same folder**:

```
📁 Your Project Folder
│
├── bulk_email_sender.py       ← the script
├── contacts.csv               ← (Version 2 only) your HR contacts list
├── Jr. Data Analyst Chanchal Mahor.pdf   ← your resume
└── email_log.csv              ← auto-created after running
```

---

## Step-by-Step Setup

### Step 1 — Create a Gmail App Password

> ⚠️ You CANNOT use your regular Gmail password. Google blocks direct login for scripts. You must create an **App Password**.

**How to create a Gmail App Password:**

1. Open your browser and go to your Google Account:
   **[https://myaccount.google.com](https://myaccount.google.com)**

2. Click on **"Security"** in the left sidebar.

3. Scroll down to the **"How you sign in to Google"** section and make sure **2-Step Verification is ON**.
   - If it is OFF, click on it and enable it first — App Passwords only work when 2-Step Verification is active.

4. Once 2-Step Verification is ON, go directly to:
   **[https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**

5. You may be asked to sign in again — do so.

6. In the **"App name"** field, type any name you like, for example: `Email Sender Script`

7. Click **"Create"**.

8. Google will show you a **16-character password** like: `abcd efgh ijkl mnop`

9. **Copy this password immediately** — Google will not show it again.

10. Paste it into the script where it says `SMTP_PASSWORD = "..."`.

> 💡 **Tip:** Remove the spaces when pasting. The password should be 16 characters with no spaces: `abcdefghijklmnop`

---

### Step 2 — Place Your Resume PDF

- Put your resume PDF file in the **same folder** as the script.
- Make sure the filename in the script **exactly matches** your actual PDF filename, including spaces and capitalization.

---

### Step 3 — Update Your Personal Details in the Script

Open the script and fill in your information at the top:

- **SENDER_NAME** — Your full name
- **SENDER_EMAIL** — Your Gmail address
- **SMTP_PASSWORD** — The 16-character App Password you created in Step 1
- **RESUME_PATH** — The exact filename of your resume PDF

---

### Step 4 — Add Your HR Contacts

**For Version 1 (Hardcoded):**
Edit the `HR_CONTACTS` list in the script and add each contact with their name, email, and company name.

**For Version 2 (CSV):**
Create a file named `contacts.csv` in the same folder with the following structure:

- The first row must be the header: `name, email, company`
- Each row after that is one HR contact
- The `email` column is required — rows without a valid email are automatically skipped

Example CSV content:
```
name,email,company
Ravi Sharma,ravi@techcorp.com,TechCorp India
Priya Singh,priya@dataco.in,DataCo Solutions
Aman Verma,aman@hrfirm.com,HR Firm Ltd
```

---

### Step 5 — Customize the Email (Optional)

Inside the script you can change:

- **EMAIL_SUBJECT** — The subject line of your email
- **EMAIL_BODY_TEMPLATE** — The body of the email

The placeholders `{name}` and `{company}` in the body are automatically replaced with each contact's actual name and company when the email is sent.

---

### Step 6 — Do a Dry Run First

Before sending real emails, always test with **Dry Run mode ON**:

- In the script, make sure `DRY_RUN = True`
- Run the script: `python bulk_email_sender.py`
- It will print what it *would* send, without actually sending anything
- Check the console output and make sure names, emails, and companies look correct

Once you are satisfied, change `DRY_RUN = False` and run again to send for real.

---

## Settings You Can Adjust

| Setting | What It Does |
|---|---|
| `DRY_RUN` | Set to `True` to preview without sending; `False` to actually send |
| `DELAY_BETWEEN_EMAILS` | Seconds to wait between each send (default is 3 seconds — helps avoid spam filters) |
| `MAX_EMAILS_PER_RUN` | Limit how many emails are sent in one run (e.g. set to `50` to send in batches); leave as `None` to send all |
| `LOG_FILE` | Name of the CSV file where results are saved (default: `email_log.csv`) |

---

## What Happens When You Run It

1. The script loads your resume file and checks it exists.
2. It connects to Gmail's SMTP server using your credentials.
3. It goes through each contact one by one.
4. For each contact, it personalizes the email and sends it with your resume attached.
5. It waits a few seconds between emails to reduce spam risk.
6. After finishing, it saves a log of all results.

---

## Understanding the Log File

After every run, a file called `email_log.csv` is created (or overwritten) in the same folder. It contains one row per contact with the following information:

| Column | Meaning |
|---|---|
| `name` | The recipient's name |
| `email` | The recipient's email address |
| `company` | The company name |
| `status` | Whether the email was `sent`, `skipped`, or `failed` |
| `error` | If something went wrong, the reason is written here |

You can open this file in Excel or Google Sheets to review your campaign results.

---

## Console Summary After Each Run

At the end of every run, a summary is printed directly in the terminal showing how many emails were sent, skipped, and failed — along with the name of your resume file and the log file location.

---

## Common Issues & Fixes

| Problem | Likely Cause | Fix |
|---|---|---|
| SMTP Authentication Failed | Wrong App Password or 2-Step Verification is OFF | Re-create the App Password and enable 2-Step Verification |
| Resume Not Found | Wrong filename or file is in a different folder | Double-check the filename and make sure it's in the same folder as the script |
| Contacts File Not Found | `contacts.csv` is missing or misnamed (Version 2) | Create the CSV file and make sure the name matches exactly |
| Emails going to Spam | Sending too fast or content looks spammy | Increase `DELAY_BETWEEN_EMAILS` and avoid all-caps or spammy words in the subject |
| Bad email skipped | A contact's email is empty or has no `@` symbol | Fix the email address in your contacts list or CSV |

---

## Tips for Better Deliverability

- Keep the delay between emails at least **3 seconds** — sending too fast can get your account flagged.
- Send in **batches** (e.g. 50 per day) using `MAX_EMAILS_PER_RUN` instead of blasting hundreds at once.
- Always use `DRY_RUN = True` to preview before going live.
- Avoid using words like "FREE", "URGENT", "GUARANTEED" in your subject line — they trigger spam filters.
- Make sure your Gmail account is in good standing and not already flagged for spam.

---

## Contact Information

**Chanchal Mahor**
Data Analyst | Final-Year B.Tech CSE Student

- 📧 chanchal01232@gmail.com
- 📞 +91-7302194314
- 🔗 [https://www.linkedin.com/in/chanchalmahor/]
- 💻 [https://github.com/chanchalmahor/]
