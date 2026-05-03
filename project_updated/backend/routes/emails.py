import smtplib, time, json, base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.database import get_db
from backend.models import EmailLog, ScheduledCampaign

router = APIRouter()

class Contact(BaseModel):
    name: str = ""
    email: str
    company: str = ""

class SendRequest(BaseModel):
    senderName: str
    senderEmail: str
    smtpPassword: str
    subject: str
    body: str
    contacts: List[Contact]
    resumeBase64: str = ""
    resumeName: str = "resume.pdf"
    delay: int = 3
    maxEmails: Optional[int] = None
    dryRun: bool = False

class ScheduleRequest(SendRequest):
    campaignName: str
    scheduledAt: str  # ISO datetime string

@router.post("/send")
async def send_emails(req: SendRequest, db: AsyncSession = Depends(get_db)):
    contacts = req.contacts[:req.maxEmails] if req.maxEmails else req.contacts
    resume_bytes = base64.b64decode(req.resumeBase64) if req.resumeBase64 else None

    results = []
    sent = skipped = failed = 0

    smtp_conn = None
    if not req.dryRun:
        try:
            smtp_conn = smtplib.SMTP("smtp.gmail.com", 587)
            smtp_conn.ehlo(); smtp_conn.starttls()
            smtp_conn.login(req.senderEmail, req.smtpPassword)
        except Exception as e:
            return {"error": f"SMTP login failed: {e}"}

    for c in contacts:
        email = c.email.strip()
        if not email or "@" not in email:
            log = EmailLog(name=c.name, email=email, company=c.company,
                           subject=req.subject, status="skipped",
                           error="Invalid email", dry_run=req.dryRun)
            db.add(log); skipped += 1
            results.append({"name": c.name, "email": email, "company": c.company,
                            "status": "skipped", "error": "Invalid email"})
            continue

        body = req.body.replace("{name}", c.name).replace("{company}", c.company)
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{req.senderName} <{req.senderEmail}>"
            msg["To"] = email
            msg["Subject"] = req.subject
            msg.attach(MIMEText(body, "plain"))
            if resume_bytes:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(resume_bytes)
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f'attachment; filename="{req.resumeName}"')
                msg.attach(part)

            if req.dryRun:
                time.sleep(0.05)
            else:
                smtp_conn.sendmail(req.senderEmail, email, msg.as_string())
                time.sleep(req.delay)

            log = EmailLog(name=c.name, email=email, company=c.company,
                           subject=req.subject, status="sent", dry_run=req.dryRun)
            db.add(log); sent += 1
            results.append({"name": c.name, "email": email, "company": c.company, "status": "sent"})
        except Exception as e:
            log = EmailLog(name=c.name, email=email, company=c.company,
                           subject=req.subject, status="failed", error=str(e), dry_run=req.dryRun)
            db.add(log); failed += 1
            results.append({"name": c.name, "email": email, "company": c.company,
                            "status": "failed", "error": str(e)})

    if smtp_conn:
        smtp_conn.quit()
    await db.commit()

    return {"summary": {"sent": sent, "failed": failed, "skipped": skipped,
                        "total": len(contacts), "dryRun": req.dryRun},
            "results": results}

@router.post("/schedule")
async def schedule_campaign(req: ScheduleRequest, db: AsyncSession = Depends(get_db)):
    campaign = ScheduledCampaign(
        name=req.campaignName,
        contacts_json=json.dumps([c.dict() for c in req.contacts]),
        subject=req.subject, body=req.body,
        sender_name=req.senderName, sender_email=req.senderEmail,
        smtp_password=req.smtpPassword,
        resume_b64=req.resumeBase64, resume_name=req.resumeName,
        scheduled_at=datetime.fromisoformat(req.scheduledAt)
    )
    db.add(campaign)
    await db.commit()
    return {"message": "Campaign scheduled", "id": campaign.id, "scheduledAt": req.scheduledAt}

@router.get("/scheduled")
async def get_scheduled(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScheduledCampaign).where(ScheduledCampaign.sent == False))
    items = result.scalars().all()
    return [{"id": i.id, "name": i.name, "scheduledAt": i.scheduled_at.isoformat(),
             "contactCount": len(json.loads(i.contacts_json))} for i in items]

@router.get("/logs")
async def get_logs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmailLog).order_by(EmailLog.sent_at.desc()).limit(200))
    logs = result.scalars().all()
    return [{"id": l.id, "name": l.name, "email": l.email, "company": l.company,
             "status": l.status, "sentAt": l.sent_at.isoformat(), "dryRun": l.dry_run} for l in logs]
