from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.models.debrief import (
    DebriefRequest,
    DebriefConfirmRequest,
    DebriefConfirmResponse
)

from app.services.ollama import (
    analyze_debrief,
    test_ollama
)

from app.services.supabase import (
    test_supabase,
    get_projects,
    get_project_work_items,
    save_debrief,
    save_work_item
)


app = FastAPI(
    title="Personal Work OS",
    version="0.2.0"
)


app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)


@app.get("/")
def root():
    return FileResponse("app/static/index.html")


@app.get("/debug")
def debug():
    return {
        "message": "Debug endpoint is working!"
    }


@app.get("/test/ollama")
def ollama_connection():
    return {
        "response": test_ollama()
    }


@app.get("/test/supabase")
def supabase_connection():
    return test_supabase()


@app.get("/projects")
def list_projects():
    return get_projects()


@app.get("/projects/{project_id}")
def get_project_details(project_id: str):

    projects = get_projects()

    project = next(
        (
            project
            for project in projects
            if project["id"] == project_id
        ),
        None
    )

    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    work_items = get_project_work_items(project_id)

    return {
        "project": project,
        "work_items": work_items
    }


@app.post("/debrief/analyze")
def analyze_debrief_endpoint(
    request: DebriefRequest
):

    projects = get_projects()

    result = analyze_debrief(
        content=request.content,
        projects=projects
    )

    return {
        "analysis": result,
        "available_projects": [
            {
                "id": project["id"],
                "name": project["name"]
            }
            for project in projects
        ]
    }


@app.post(
    "/debrief/confirm",
    response_model=DebriefConfirmResponse
)
def confirm_debrief(
    request: DebriefConfirmRequest
):

    saved_debrief = save_debrief(
        raw_content=request.content,
        summary=request.summary
    )

    for item in request.items:

        save_work_item(
            item=item.dict(),
            project_id=request.project_id
        )

    return {
        "debrief_id": saved_debrief["id"],
        "project_id": request.project_id,
        "items_saved": len(request.items)
    }