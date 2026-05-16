from enum import StrEnum


class IntentType(StrEnum):
    LEAD_GEN = "Lead_Gen"
    SUPPORT = "Support"
    SPAM = "Spam"


class ThreadStatus(StrEnum):
    ACTIVE = "active"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ESCALATED = "escalated"
    DISCARDED = "discarded"


class AgentType(StrEnum):
    ROUTER = "Router_Agent"
    SALES = "Sales_Agent"
    EXTRACTOR = "Data_Extractor_Agent"
    HUMAN = "Human_Agent"


class ExportStatus(StrEnum):
    PENDING = "pending"
    EXPORTED = "exported"
    FAILED = "failed"
