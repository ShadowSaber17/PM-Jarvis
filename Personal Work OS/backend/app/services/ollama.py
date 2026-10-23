import json
import requests

from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL


def test_ollama():
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": "Reply with exactly: Ollama connection successful.",
            "stream": False
        },
        timeout=120
    )

    response.raise_for_status()

    return response.json().get("response", "").strip()


def analyze_debrief(content: str, projects: list):
    project_list = "\n".join(
        [
            f"- {project['name']}"
            for project in projects
        ]
    )

    prompt = f"""
You are the analysis engine for a personal work assistant.

Analyze the user's work update and extract important information.

Existing projects:

{project_list}

Your job is to:

1. Extract important work items.
2. Determine whether the update likely belongs to one of the existing projects.
3. Suggest the best matching project.
4. Do NOT create a new project.
5. If no existing project is a confident match, return null.

Return ONLY valid JSON.

Use this exact structure:

{{
  "summary": "short summary",

  "suggested_project": "project name or null",

  "items": [
    {{
      "type": "task | decision | waiting_on | fact | change | blocker | idea | note",
      "title": "short title",
      "content": "details",
      "status": "active",
      "priority": 3
    }}
  ]
}}

Rules:
- Only choose a project from the Existing projects list.
- Never invent a project name.
- If uncertain, set suggested_project to null.
- Extract explicit tasks.
- Extract explicit decisions.
- Extract important facts and changes.
- Extract things waiting on external people or events.
- Do not invent information.
- Keep the response concise.

User update:

{content}
"""

    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,
                "num_predict": 500
            }
        },
        timeout=120
    )

    response.raise_for_status()

    return json.loads(response.json()["response"])