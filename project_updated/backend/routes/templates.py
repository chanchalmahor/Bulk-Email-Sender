from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.database import get_db
from backend.models import Template

router = APIRouter()

class TemplateCreate(BaseModel):
    title: str
    subject: str
    body: str
    tag: str = "general"

@router.get("/")
async def list_templates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Template).order_by(Template.created_at.desc()))
    items = result.scalars().all()
    return [{"id": t.id, "title": t.title, "subject": t.subject,
             "body": t.body, "tag": t.tag, "createdAt": t.created_at.isoformat()} for t in items]

@router.post("/")
async def create_template(data: TemplateCreate, db: AsyncSession = Depends(get_db)):
    t = Template(**data.dict())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return {"id": t.id, "title": t.title, "subject": t.subject, "body": t.body, "tag": t.tag}

@router.delete("/{template_id}")
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Template).where(Template.id == template_id))
    t = result.scalar_one_or_none()
    if t:
        await db.delete(t)
        await db.commit()
    return {"deleted": template_id}
