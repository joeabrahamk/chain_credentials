"""
FastAPI microservice for Code Checker.

Exposes POST /evaluate — accepts a resume file + GitHub username,
runs the full analyze_repo pipeline, optionally runs ai_audit,
and returns per-stack scores for the cchain SkillsDashboard.
"""

import os
import sys
import json
import shutil
import tempfile

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure local imports (analyze_repo, ai_audit etc.) resolve correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analyze_repo import (
    load_policy,
    extract_resume_text,
    extract_claimed_stacks_from_resume,
    extract_github_urls_from_text,
    evaluate_repo,
    compute_skill_assessment,
    canonical_stack_name,
    parse_repo_url,
)

app = FastAPI(title="Code Checker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

POLICY_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scoring_policy.json")

ALLOWED_EXTENSIONS = {".pdf", ".txt"}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "service": "Code Checker API",
        "version": "1.0.0",
        "routes": {
            "GET  /health": "Liveness check",
            "POST /evaluate": "Analyse resume — fields: resume (file), github_username (str)",
            "GET  /docs": "Interactive Swagger UI",
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Main evaluation endpoint
# ---------------------------------------------------------------------------

@app.post("/evaluate")
async def evaluate(
    github_username: str = Form(...),
    resume: UploadFile = File(...),
):
    # Validate file type
    _, ext = os.path.splitext(resume.filename or "")
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF or TXT resumes are accepted.")

    tmp_dir = tempfile.mkdtemp(prefix="cchecker_")
    tmp_resume_path = os.path.join(tmp_dir, resume.filename)

    try:
        # ── 1. Save uploaded resume to temp file ──────────────────────────
        content = await resume.read()
        with open(tmp_resume_path, "wb") as f:
            f.write(content)

        # ── 2. Parse resume for stacks + repo URLs ─────────────────────────
        resume_text = extract_resume_text(tmp_resume_path)
        resume_claimed = extract_claimed_stacks_from_resume(resume_text)
        resume_repo_urls = extract_github_urls_from_text(resume_text)

        claimed_stacks = sorted({canonical_stack_name(s) for s in resume_claimed}) if resume_claimed else []
        repo_urls = resume_repo_urls or []

        if not claimed_stacks:
            raise HTTPException(
                status_code=422,
                detail="No tech stacks could be extracted from the resume.",
            )

        if not repo_urls:
            raise HTTPException(
                status_code=422,
                detail="No GitHub repository URLs found in the resume.",
            )

        policy = load_policy(POLICY_PATH)

        # ── 3. Evaluate each repository ────────────────────────────────────
        repo_results = []
        combined_confirmed = set()
        combined_gcb_scores: dict = {}

        for repo_url in repo_urls:
            _, repo_name = parse_repo_url(repo_url)
            local_path = os.path.join(tmp_dir, "repos", repo_name)
            try:
                result = evaluate_repo(repo_url, local_path, github_username, claimed_stacks, policy)
                if result is None:
                    continue
                repo_results.append(result)

                confirmed = {c.lower() for c in result["evaluation"]["stack_analysis"]["confirmed"]}
                combined_confirmed |= confirmed

                for stack, gcb in result["graphcodebert"]["scores"].items():
                    cur = combined_gcb_scores.get(stack)
                    if cur is None or gcb.get("similarity", 0) > cur.get("similarity", 0):
                        combined_gcb_scores[stack] = gcb

            except Exception as exc:
                # Log but continue — other repos may succeed
                print(f"[api] Skipped {repo_url}: {exc}")
                continue

        if not repo_results:
            raise HTTPException(
                status_code=422,
                detail="Could not evaluate any of the repositories found in the resume.",
            )

        # ── 4. Compute per-stack skill assessment ───────────────────────────
        combined_stack_result = {"confirmed": list(combined_confirmed)}
        skill_assessment = compute_skill_assessment(
            claimed_stacks, combined_stack_result, combined_gcb_scores, policy
        )

        # ── 5. Optionally run AI audit (requires ollama) ────────────────────
        audit: dict | None = None
        try:
            from ai_audit import run_ai_audit  # noqa: PLC0415

            primary_eval = repo_results[0]["evaluation"]
            audit_json = run_ai_audit(primary_eval)
            audit = json.loads(audit_json)
        except Exception as exc:
            print(f"[api] AI audit skipped: {exc}")

        # ── 6. Merge audit qualitative data with scores ────────────────────
        audit_by_stack: dict = {}
        if audit:
            for row in audit.get("skill_knowledge_review", {}).get("stack_assessments", []):
                if row.get("stack"):
                    audit_by_stack[row["stack"].strip().lower()] = row

        skills_output = []
        for item in skill_assessment:
            stack_key = item["stack"].strip().lower()
            audit_row = audit_by_stack.get(stack_key, {})

            # score: graphcodebert/blended value (0-100) from compute_skill_assessment
            # graphcodebert_independent_score lives in item["evidence"]
            gcb_ind = (item.get("evidence") or {}).get("graphcodebert_independent_score")

            skills_output.append({
                "name": item["stack"],
                "score": item["score"],                     # primary display score
                "graphcodebert_score": gcb_ind,            # raw GCB score (may be None)
                "level": item.get("level", ""),
                "remark": item.get("remark", ""),
                "gaps": audit_row.get("gaps", []),
                "recommendations": audit_row.get("recommendations", []),
            })

        primary_summary = repo_results[0]["evaluation"].get("evaluation_summary", {})

        return {
            "skills": skills_output,
            "final_score": primary_summary.get("final_score"),
            "confidence": primary_summary.get("confidence"),
            "audit_summary": audit.get("audit_summary") if audit else None,
        }

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
