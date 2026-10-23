from supabase import create_client

from app.config import SUPABASE_URL, SUPABASE_KEY


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


def test_supabase():
    response = (
        supabase
        .table("projects")
        .select("*")
        .limit(1)
        .execute()
    )

    return {
        "connection": "successful",
        "projects_found": len(response.data)
    }


def save_debrief(raw_content: str, summary: str):
    response = (
        supabase
        .table("debriefs")
        .insert({
            "raw_content": raw_content,
            "summary": summary
        })
        .execute()
    )

    return response.data[0]


def get_or_create_project(project_name: str):
    if not project_name:
        return None

    existing_project = (
        supabase
        .table("projects")
        .select("*")
        .ilike("name", project_name)
        .limit(1)
        .execute()
    )

    if existing_project.data:
        return existing_project.data[0]

    new_project = (
        supabase
        .table("projects")
        .insert({
            "name": project_name
        })
        .execute()
    )

    return new_project.data[0]


def save_work_item(item: dict, project_id=None):
    work_item = {
        "project_id": project_id,
        "type": item["type"],
        "title": item["title"],
        "content": item.get("content"),
        "status": item.get("status", "active"),
        "priority": item.get("priority", 3)
    }

    response = (
        supabase
        .table("work_items")
        .insert(work_item)
        .execute()
    )

    return response.data[0]


def get_projects():
    response = (
        supabase
        .table("projects")
        .select(
            "id, name, description, status, current_focus, next_milestone"
        )
        .eq("status", "active")
        .execute()
    )

    return response.data


def get_project_work_items(project_id: str):
    response = (
        supabase
        .table("work_items")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )

    return response.data