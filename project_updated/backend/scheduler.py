import json, smtplib, base64, time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from backend.database import SessionLocal
from backend.models import ScheduledCampaign, EmailLog
from sqlalchemy import select
from datetime import datetime

scheduler = AsyncIOScheduler()

async def run_scheduled():
    async with SessionLocal() as db:
        now = datetime.utcnow()
        result = await db.execute(
            select(ScheduledCampaign)
            .where(ScheduledCampaign.scheduled_at <= now)
            .where(ScheduledCampaign.sent == False))
        campaigns = result.scalars().all()

        for camp in campaigns:
            contacts = json.loads(camp.contacts_json)
            resume_bytes = base64.b64decode(camp.resume_b64) if camp.resume_b64 else None
            try:
                smtp = smtplib.SMTP("smtp.gmail.com", 587)
                smtp.ehlo(); smtp.starttls()
                smtp.login(camp.sender_email, camp.smtp_password)
                for c in contacts:
                    body = camp.body.replace("{name}", c.get("name","")).replace("{company}", c.get("company",""))
                    msg = MIMEMultipart()
                    msg["From"] = f"{camp.sender_name} <{camp.sender_email}>"
                    msg["To"] = c["email"]
                    msg["Subject"] = camp.subject
                    msg.attach(MIMEText(body, "plain"))
                    if resume_bytes:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(resume_bytes)
                        encoders.encode_base64(part)
                        part.add_header("Content-Disposition", f'attachment; filename="{camp.resume_name}"')
                        msg.attach(part)
                    smtp.sendmail(camp.sender_email, c["email"], msg.as_string())
                    log = EmailLog(name=c.get("name",""), email=c["email"],
                                   company=c.get("company",""), subject=camp.subject, status="sent")
                    db.add(log)
                    time.sleep(3)
                smtp.quit()
            except Exception as e:
                print(f"Scheduled campaign {camp.id} failed: {e}")
            camp.sent = True
        await db.commit()

scheduler.add_job(run_scheduled, "interval", minutes=1)
