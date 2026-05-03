"""
Bulk Email Sender — Flask Backend
Run: python app.py
Then open: http://localhost:5000
"""

import smtplib
import time
import csv
import os
import base64
import json
import io
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder="static")

# ── serve frontend ──────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

# ── send endpoint ───────────────────────────────────────────
@app.route("/send", methods=["POST"])
def send_emails():
    data = request.get_json()

    sender_name  = data.get("senderName", "")
    sender_email = data.get("senderEmail", "")
    smtp_pass    = data.get("smtpPassword", "")
    subject      = data.get("subject", "")
    body_tpl     = data.get("body", "")
    contacts     = data.get("contacts", [])          # list of {name, email, company}
    resume_b64   = data.get("resumeBase64", "")      # base64 string
    resume_name  = data.get("resumeName", "resume.pdf")
    delay_sec    = int(data.get("delay", 3))
    dry_run      = data.get("dryRun", False)
    max_emails   = data.get("maxEmails")

    if not contacts:
        return jsonify({"error": "No contacts provided"}), 400
    if not dry_run and not smtp_pass:
        return jsonify({"error": "SMTP password required"}), 400

    # decode resume
    resume_bytes = base64.b64decode(resume_b64) if resume_b64 else None

    if max_emails:
        contacts = contacts[: int(max_emails)]

    results = []
    sent = skipped = failed = 0

    smtp_conn = None
    if not dry_run:
        try:
            smtp_conn = smtplib.SMTP("smtp.gmail.com", 587)
            smtp_conn.ehlo()
            smtp_conn.starttls()
            smtp_conn.login(sender_email, smtp_pass)
        except Exception as e:
            return jsonify({"error": f"SMTP login failed: {e}"}), 500

    for contact in contacts:
        name    = contact.get("name", "")
        email   = contact.get("email", "").strip()
        company = contact.get("company", "")

        if not email or "@" not in email:
            results.append({"name": name, "email": email, "company": company,
                            "status": "skipped", "error": "Invalid email"})
            skipped += 1
            continue

        body = body_tpl.replace("{name}", name).replace("{company}", company)

        try:
            msg = MIMEMultipart()
            msg["From"]    = f"{sender_name} <{sender_email}>"
            msg["To"]      = email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            if resume_bytes:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(resume_bytes)
                encoders.encode_base64(part)
                part.add_header("Content-Disposition",
                                f'attachment; filename="{resume_name}"')
                msg.attach(part)

            if dry_run:
                time.sleep(0.1)
            else:
                smtp_conn.sendmail(sender_email, email, msg.as_string())
                time.sleep(delay_sec)

            results.append({"name": name, "email": email, "company": company,
                            "status": "sent"})
            sent += 1

        except Exception as e:
            results.append({"name": name, "email": email, "company": company,
                            "status": "failed", "error": str(e)})
            failed += 1

    if smtp_conn:
        smtp_conn.quit()

    return jsonify({
        "summary": {"sent": sent, "failed": failed, "skipped": skipped,
                    "total": len(contacts), "dryRun": dry_run},
        "results": results
    })

if __name__ == "__main__":
    os.makedirs("static", exist_ok=True)
    print("✅  Open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)
