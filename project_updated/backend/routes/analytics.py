from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.database import get_db
from backend.models import EmailLog
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary")
async def summary(db: AsyncSession = Depends(get_db)):
    total  = await db.scalar(select(func.count()).select_from(EmailLog).where(EmailLog.dry_run == False))
    sent   = await db.scalar(select(func.count()).select_from(EmailLog).where(EmailLog.status == "sent",   EmailLog.dry_run == False))
    failed = await db.scalar(select(func.count()).select_from(EmailLog).where(EmailLog.status == "failed", EmailLog.dry_run == False))
    skipped= await db.scalar(select(func.count()).select_from(EmailLog).where(EmailLog.status == "skipped",EmailLog.dry_run == False))

    # last 7 days
    daily = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        count = await db.scalar(
            select(func.count()).select_from(EmailLog)
            .where(func.date(EmailLog.sent_at) == day, EmailLog.dry_run == False))
        daily.append({"date": day.strftime("%b %d"), "count": count or 0})

    # top companies
    rows = await db.execute(
        select(EmailLog.company, func.count().label("c"))
        .where(EmailLog.dry_run == False, EmailLog.status == "sent")
        .group_by(EmailLog.company).order_by(func.count().desc()).limit(5))
    companies = [{"company": r.company or "Unknown", "count": r.c} for r in rows]

    return {"total": total or 0, "sent": sent or 0, "failed": failed or 0,
            "skipped": skipped or 0, "daily": daily, "topCompanies": companies}
