"""Singoo L2S-Router — CLI entry point.

Usage:
    python -m singoo serve            Start FastAPI server
    python -m singoo test             Run test suite
    python -m singoo export-all       Export all pending leads to CRM
    python -m singoo stats            Show session statistics
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from pathlib import Path

# Ensure project root is on sys.path and set as cwd
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))
os.chdir(str(PROJECT_ROOT))


def cmd_serve(args):
    import uvicorn
    from config.settings import settings
    uvicorn.run(
        "app:app",
        host=settings.host,
        port=args.port or settings.port,
        reload=args.reload,
    )


def cmd_test(args):
    import pytest
    test_dir = Path(__file__).resolve().parent / "tests"
    exit_code = pytest.main([str(test_dir), "-v"])
    sys.exit(exit_code)


def cmd_export_all(args):
    from storage.thread_store import ThreadStore
    from config.settings import settings

    store = ThreadStore(base_dir=settings.thread_store_dir)
    pending = []
    for summary in store.list_summaries():
        if summary.get("status") == "completed" and summary.get("intent") == "Lead_Gen":
            state = store.load(summary["session_id"])
            if state and state.extracted_entities:
                pending.append(state)

    print(f"Found {len(pending)} leads ready for export.\n")
    for state in pending:
        lead = state.extracted_entities
        print(f"  {state.session_id}")
        print(f"    Company: {lead.company_name or 'N/A'}")
        print(f"    Score:   {lead.lead_score}")
        print(f"    Country: {lead.country or 'N/A'}")
        if args.execute:
            from api.handlers import handle_export_lead
            asyncio.run(handle_export_lead(state.session_id, store))
            print(f"    → Exported")
        print()

    if not args.execute:
        print("Dry run. Use --execute to actually export.")


def cmd_stats(args):
    from storage.thread_store import ThreadStore
    from config.settings import settings

    store = ThreadStore(base_dir=settings.thread_store_dir)
    summaries = store.list_summaries()

    by_intent = {}
    by_status = {}
    total_score = 0
    scored_count = 0

    for s in summaries:
        by_intent[s.get("intent", "unknown")] = by_intent.get(s.get("intent", "unknown"), 0) + 1
        by_status[s.get("status", "unknown")] = by_status.get(s.get("status", "unknown"), 0) + 1

        state = store.load(s["session_id"])
        if state and state.extracted_entities and state.extracted_entities.lead_score:
            total_score += state.extracted_entities.lead_score
            scored_count += 1

    print(f"Total sessions: {len(summaries)}")
    print(f"By intent: {dict(by_intent)}")
    print(f"By status: {dict(by_status)}")
    if scored_count > 0:
        print(f"Avg lead score: {total_score / scored_count:.1f} ({scored_count} scored)")
    print(f"Unexported leads: {sum(1 for s in summaries if s.get('status') == 'completed' and s.get('intent') == 'Lead_Gen')}")


def main():
    parser = argparse.ArgumentParser(description="Singoo L2S-Router CLI")
    sub = parser.add_subparsers(dest="command")

    p_serve = sub.add_parser("serve", help="Start FastAPI server")
    p_serve.add_argument("--port", type=int, help="Port to bind to")
    p_serve.add_argument("--reload", action="store_true", default=True, help="Auto-reload")

    p_test = sub.add_parser("test", help="Run test suite")

    p_export = sub.add_parser("export-all", help="Export pending leads")
    p_export.add_argument("--execute", action="store_true", help="Actually export (default: dry run)")

    p_stats = sub.add_parser("stats", help="Show session statistics")

    args = parser.parse_args()
    if args.command == "serve":
        cmd_serve(args)
    elif args.command == "test":
        cmd_test(args)
    elif args.command == "export-all":
        cmd_export_all(args)
    elif args.command == "stats":
        cmd_stats(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
