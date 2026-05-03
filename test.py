"""
Bulk Email Sender — Chanchal Mahor (Job Application)
======================================================
Sends personalized job application emails with resume attachment
to HR contacts from the CompanyWise HR contact list.

Setup:
    1. Set SMTP_PASSWORD below (Gmail App Password)
       Get it at: https://myaccount.google.com/apppasswords
    2. Place your resume PDF in the SAME folder as this script
    3. Set DRY_RUN = False when ready to actually send
    4. Run: python bulk_email_sender.py
"""

import smtplib
import time
import logging
import csv
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dataclasses import dataclass
from typing import Optional

# ─────────────────────────────────────────────
# ✏️  YOUR DETAILS
# ─────────────────────────────────────────────

SENDER_NAME   = "Chanchal Mahor"
SENDER_EMAIL  = "chanchal01232@gmail.com"
SMTP_PASSWORD = "jb"   # ← Replace with Gmail App Password

RESUME_PATH   = "Jr. Data Analyst Chanchal Mahor.pdf"  # Must be in same folder

SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587

# ─────────────────────────────────────────────
# 📧  EMAIL CONTENT
# ─────────────────────────────────────────────

EMAIL_SUBJECT = "Application for Data Analyst Role | Chanchal Mahor"

EMAIL_BODY_TEMPLATE = """\
Dear {name},

I hope this email finds you well. I am writing to apply for the Data Analyst \
position at {company}.

I am a final-year B.Tech Computer Science Engineering student (graduating in 2026) \
with hands-on experience in data analysis, visualization, and reporting.

I have worked as a Data Analyst and Research Intern, where I used SQL, Python, \
Excel, and Power BI to clean, analyze, and visualize data, build dashboards, and \
extract actionable insights to support decision-making. I have also developed \
multiple real-world projects involving large datasets, KPI tracking, and \
interactive dashboards.

I am highly motivated, detail-oriented, and passionate about transforming raw \
data into meaningful insights. I am eager to contribute my analytical skills \
while continuing to learn and grow in a professional environment.

Please find my resume attached for your review. I would welcome the opportunity \
to discuss how my skills align with your team's requirements at {company}.

Thank you for your time and consideration.

Warm regards,
Chanchal Mahor
Data Analyst | Final-Year B.Tech CSE Student
📧 chanchal01232@gmail.com
📞 +91-7302194314
🔗 LinkedIn: https://www.linkedin.com/in/chanchalmahor/
💻 GitHub: https://github.com/chanchalmahor/
"""

# ─────────────────────────────────────────────
# ⚙️  SETTINGS
# ─────────────────────────────────────────────

DELAY_BETWEEN_EMAILS = 3      # seconds between sends (reduces spam risk)
MAX_EMAILS_PER_RUN   = None   # e.g. 50 to send in batches; None = all
DRY_RUN              = False   # ✅ Set to False when ready to actually send
LOG_FILE             = "email_log.csv"

# ─────────────────────────────────────────────
# 👥  HR CONTACTS
# ─────────────────────────────────────────────

HR_CONTACTS = [
    {"name": "Qanvi", "email": "qanvifashion@gmail.com", "company": "One Day"},
    
]


# ─────────────────────────────────────────────
# ⚙️  CORE LOGIC — no edits needed below
# ─────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@dataclass
class EmailResult:
    name: str
    email: str
    company: str
    status: str
    error: Optional[str] = None


def load_resume(path: str) -> bytes:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"\n❌ Resume not found: '{path}'\n"
            f"   Make sure the PDF is in the same folder as this script."
        )
    with open(path, "rb") as f:
        return f.read()


def build_message(contact: dict, resume_bytes: bytes) -> MIMEMultipart:
    msg = MIMEMultipart()
    msg["From"]    = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg["To"]      = contact["email"]
    msg["Subject"] = EMAIL_SUBJECT

    body = EMAIL_BODY_TEMPLATE.format(**contact)
    msg.attach(MIMEText(body, "plain"))

    # Attach resume
    part = MIMEBase("application", "octet-stream")
    part.set_payload(resume_bytes)
    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        f'attachment; filename="{os.path.basename(RESUME_PATH)}"',
    )
    msg.attach(part)
    return msg


def send_bulk_emails():
    resume_bytes = load_resume(RESUME_PATH)
    logger.info(f"✅ Resume loaded ({len(resume_bytes) // 1024} KB): {RESUME_PATH}")

    contacts = HR_CONTACTS[:MAX_EMAILS_PER_RUN] if MAX_EMAILS_PER_RUN else HR_CONTACTS
    mode_tag = "[DRY RUN] " if DRY_RUN else ""
    logger.info(f"{mode_tag}Preparing to send to {len(contacts)} contacts...")

    smtp_conn = None
    if not DRY_RUN:
        try:
            smtp_conn = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            smtp_conn.ehlo()
            smtp_conn.starttls()
            smtp_conn.login(SENDER_EMAIL, SMTP_PASSWORD)
            logger.info("✅ SMTP authenticated successfully.")
        except Exception as e:
            logger.error(f"❌ SMTP failed: {e}")
            return

    results, sent, skipped, failed = [], 0, 0, 0

    for i, contact in enumerate(contacts, 1):
        name  = contact.get("name", "")
        email = contact.get("email", "").strip()
        co    = contact.get("company", "")

        if not email or "@" not in email:
            logger.warning(f"[{i}/{len(contacts)}] Skipping {name} — bad email")
            results.append(EmailResult(name, email, co, "skipped", "Invalid email"))
            skipped += 1
            continue

        try:
            msg = build_message(contact, resume_bytes)
            if DRY_RUN:
                logger.info(f"[DRY RUN] [{i}/{len(contacts)}] → {name} <{email}> @ {co}")
            else:
                smtp_conn.sendmail(SENDER_EMAIL, email, msg.as_string())
                logger.info(f"[{i}/{len(contacts)}] ✅ Sent → {name} <{email}> @ {co}")
                time.sleep(DELAY_BETWEEN_EMAILS)
            results.append(EmailResult(name, email, co, "sent"))
            sent += 1
        except Exception as e:
            logger.error(f"[{i}/{len(contacts)}] ❌ {name} <{email}>: {e}")
            results.append(EmailResult(name, email, co, "failed", str(e)))
            failed += 1

    if smtp_conn:
        smtp_conn.quit()

    with open(LOG_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "email", "company", "status", "error"])
        writer.writeheader()
        for r in results:
            writer.writerow({"name": r.name, "email": r.email, "company": r.company,
                             "status": r.status, "error": r.error or ""})

    print(f"""
{'='*55}
  {mode_tag}EMAIL CAMPAIGN SUMMARY
{'='*55}
  ✅ Sent       : {sent}
  ⏭️  Skipped    : {skipped}
  ❌ Failed     : {failed}
  📎 Attachment : {os.path.basename(RESUME_PATH)}
  📄 Log saved  : {LOG_FILE}
{'='*55}""")


if __name__ == "__main__":
    send_bulk_emails()