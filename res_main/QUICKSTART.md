# Quickstart — Code Checker

Get up and running in under 5 minutes.

---

## Prerequisites

- Python **3.10+** — check with `py --version`
- A GitHub personal access token (for the GitHub API)

---

## 1. Clone the repo

```bash
git clone https://github.com/joeabrahamk/code-checker.git
cd code-checker
```

---

## 2. Create a virtual environment

```bash
# Windows
py -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

---

## 3. Install dependencies

**Core (required)**

```bash
pip install requests gitpython
```

**AI audit / code review (optional)**

```bash
pip install ollama
```

**GraphCodeBERT skill scoring (optional)**

```bash
pip install transformers torch pdfminer.six
```

> If optional dependencies are missing, those features are skipped with a warning — the core analyzer still works.

---

## 4. Run the analyzer

```bash
py analyze_repo.py
```

You will be prompted for three inputs:

| Prompt          | Example                                  |
| --------------- | ---------------------------------------- |
| Repo URL        | `https://github.com/username/my-project` |
| GitHub username | `username`                               |
| Claimed stacks  | `React, Node.js, MongoDB`                |

The analyzer clones the repo into `temp_repo/`, filters commits by the given username, and prints a scored breakdown.

---

## 5. Read the output

```
Score Breakdown
----------------------------------------
Stack Accuracy:    85   ✓ react, javascript   ✗ python
Commit Quality:    80
Code Quality:      75
Project Depth:     88
Documentation:     50
GraphCodeBERT:     72
----------------------------------------
Final Score:       76.40
Confidence:        0.85  (High)
========================================
```

The result is also saved to `evaluation_result.json`.

---

## Optional features

### AI Audit

Reviews the evaluator's output for rule consistency. Requires `ollama` with a local model running.

```bash
# The audit runs automatically at the end of analyze_repo.py
# To run it standalone:
py ai_audit.py
```

### AI Code Review

Adversarially reviews sampled code files. Affects confidence only — never scores.

```bash
py code_review.py
```

### Resume input

Pass a PDF resume path when prompted. The analyzer extracts claimed stacks and repo URLs automatically.

---

## Project files at a glance

| File                         | Purpose                                       |
| ---------------------------- | --------------------------------------------- |
| `analyze_repo.py`            | Main entry point                              |
| `scoring_policy.json`        | All scoring rules (edit to tune weights)      |
| `ai_audit.py`                | AI audit of evaluator output                  |
| `code_review.py`             | AI review of actual code samples              |
| `skill_assessment_engine.py` | Language-specific skill depth scoring         |
| `graphcodebert_scoring.py`   | Semantic similarity scoring via GraphCodeBERT |
| `evaluation_result.json`     | Generated output from last run                |

---

## Tweak scoring weights

Open `scoring_policy.json` and adjust `final_score_weights`:

```json
"final_score_weights": {
  "stack_accuracy":        0.22,
  "commit_quality":        0.26,
  "code_quality":          0.20,
  "project_depth":         0.13,
  "documentation":         0.09,
  "graphcodebert_quality": 0.10
}
```

Weights must sum to **1.0**.

---

## Troubleshooting

| Problem                       | Fix                                       |
| ----------------------------- | ----------------------------------------- |
| `ModuleNotFoundError: git`    | `pip install gitpython`                   |
| `ModuleNotFoundError: ollama` | `pip install ollama` or skip AI features  |
| API rate limit errors         | Add a `GITHUB_TOKEN` env variable         |
| `temp_repo/` permission error | Delete the `temp_repo/` folder and re-run |
