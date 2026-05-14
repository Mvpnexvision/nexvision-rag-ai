"""
core/logger.py
==============
Global debug logger for NexVision backend.

Usage:
    from core.logger import debug_log

    debug_log("AUTH", "JWT decoded successfully")
    debug_log("DOCUMENT", f"Processing file: {file_name}")
    debug_log("REASONING", f"Retrieved {len(chunks)} chunks")

Output (when DEBUG_LOGS=true):
    [AUTH] JWT decoded successfully
    [DOCUMENT] Processing file: report.pdf
    [REASONING] Retrieved 5 chunks

Silenced completely when DEBUG_LOGS=false.
"""

from core.config import settings


_RESET = "\033[0m"
_TAG_COLORS = {
    "AUTH": "\033[38;5;39m",
    "DOCUMENT": "\033[38;5;214m",
    "EMBEDDING": "\033[38;5;135m",
    "REASONING": "\033[38;5;112m",
    "DB": "\033[38;5;208m",
}


def debug_log(tag: str, message: str) -> None:
    """
    Print a tagged debug message to stdout.
    No-op when settings.DEBUG_LOGS is False.

    Args:
        tag:     Module identifier shown in brackets e.g. "AUTH", "DOCUMENT"
        message: What happened
    """
    if settings.DEBUG_LOGS:
        color = _TAG_COLORS.get(tag.upper(), "\033[38;5;245m")
        print(f"{color}[{tag}] {_RESET}{message}")
