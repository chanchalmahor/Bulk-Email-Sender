from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float
from backend.database import Base
from datetime import datetime

class EmailLog(Base):
    __tablename__ = "email_logs"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, default="")
    email        = Column(String, index=True)
    company      = Column(String, default="")
    subject      = Column(String, default="")
    status       = Column(String)   # sent / failed / skipped
    error        = Column(Text, default="")
    dry_run      = Column(Boolean, default=False)
    sent_at      = Column(DateTime, default=datetime.utcnow)

class Template(Base):
    __tablename__ = "templates"
    id           = Column(Integer, primary_key=True, index=True)
    title        = Column(String)
    subject      = Column(String)
    body         = Column(Text)
    tag          = Column(String, default="general")
    created_at   = Column(DateTime, default=datetime.utcnow)

class ScheduledCampaign(Base):
    __tablename__ = "scheduled_campaigns"
    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String)
    contacts_json  = Column(Text)
    subject        = Column(String)
    body           = Column(Text)
    sender_name    = Column(String)
    sender_email   = Column(String)
    smtp_password  = Column(String)
    resume_b64     = Column(Text, default="")
    resume_name    = Column(String, default="resume.pdf")
    scheduled_at   = Column(DateTime)
    sent           = Column(Boolean, default=False)
    created_at     = Column(DateTime, default=datetime.utcnow)
