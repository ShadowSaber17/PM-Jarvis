console.log("ALFRED APP JS LOADED");

let currentAnalysis = null;
let availableProjects = [];


/* =========================
   ELEMENTS
========================= */

const debriefInput =
    document.getElementById("debrief-input");

const analyzeButton =
    document.getElementById("analyze-button");

const confirmButton =
    document.getElementById("confirm-button");

const analysisSection =
    document.getElementById("analysis-section");

const summaryElement =
    document.getElementById("summary");

const projectSelect =
    document.getElementById("project-select");

const itemsList =
    document.getElementById("items-list");

const statusMessage =
    document.getElementById("status-message");

const projectsList =
    document.getElementById("projects-list");

const dashboardView =
    document.getElementById("dashboard-view");

const projectView =
    document.getElementById("project-view");

const backButton =
    document.getElementById("back-button");

const projectName =
    document.getElementById("project-name");

const projectDescription =
    document.getElementById("project-description");

const projectStatus =
    document.getElementById("project-status");

const projectFocus =
    document.getElementById("project-focus");

const projectMilestone =
    document.getElementById("project-milestone");

const projectWorkItems =
    document.getElementById("project-work-items");


/* =========================
   ANALYZE UPDATE
========================= */

async function analyzeUpdate() {

    const content = debriefInput.value.trim();

    if (!content) {
        statusMessage.textContent =
            "Enter a work update first.";
        return;
    }

    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";

    statusMessage.textContent =
        "Alfred is analyzing your update...";

    try {

        const response = await fetch(
            "/debrief/analyze",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    content: content
                })
            }
        );

        if (!response.ok) {
            throw new Error("Analysis failed.");
        }

        const data =
            await response.json();

        currentAnalysis =
            data.analysis;

        availableProjects =
            data.available_projects;

        displayAnalysis();

        statusMessage.textContent =
            "Analysis complete. Review the project and confirm when ready.";

    } catch (error) {

        console.error(error);

        statusMessage.textContent =
            "Something went wrong while analyzing the update.";

    } finally {

        analyzeButton.disabled = false;
        analyzeButton.textContent =
            "Analyze Update";
    }
}


/* =========================
   DISPLAY ANALYSIS
========================= */

function displayAnalysis() {

    if (!analysisSection) return;

    analysisSection.classList.remove(
        "hidden"
    );

    if (summaryElement) {
        summaryElement.textContent =
            currentAnalysis.summary || "";
    }


    /* PROJECT SELECT */

    if (projectSelect) {

        projectSelect.innerHTML = "";

        const noProjectOption =
            document.createElement("option");

        noProjectOption.value = "";

        noProjectOption.textContent =
            "No project selected";

        projectSelect.appendChild(
            noProjectOption
        );

        availableProjects.forEach(
            project => {

                const option =
                    document.createElement("option");

                option.value =
                    project.id;

                option.textContent =
                    project.name;

                if (
                    project.name ===
                    currentAnalysis.suggested_project
                ) {
                    option.selected = true;
                }

                projectSelect.appendChild(
                    option
                );
            }
        );
    }


    /* EXTRACTED ITEMS */

    if (!itemsList) return;

    itemsList.innerHTML = "";

    currentAnalysis.items.forEach(
        item => {

            const itemElement =
                document.createElement("div");

            itemElement.className =
                "item";


            const typeElement =
                document.createElement("div");

            typeElement.className =
                "item-type";

            typeElement.textContent =
                formatItemType(item.type);


            const titleElement =
                document.createElement("div");

            titleElement.className =
                "item-title";

            titleElement.textContent =
                item.title;


            const contentElement =
                document.createElement("div");

            contentElement.className =
                "item-content";

            contentElement.textContent =
                item.content || "";


            itemElement.appendChild(
                typeElement
            );

            itemElement.appendChild(
                titleElement
            );

            itemElement.appendChild(
                contentElement
            );

            itemsList.appendChild(
                itemElement
            );
        }
    );
}


/* =========================
   CONFIRM AND SAVE
========================= */

async function confirmAndSave() {

    if (!currentAnalysis) {

        statusMessage.textContent =
            "Analyze an update first.";

        return;
    }

    confirmButton.disabled = true;

    confirmButton.textContent =
        "Saving...";

    statusMessage.textContent =
        "Saving your confirmed update...";

    try {

        const response = await fetch(
            "/debrief/confirm",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    content:
                        debriefInput.value.trim(),

                    summary:
                        currentAnalysis.summary,

                    project_id:
                        projectSelect.value || null,

                    items:
                        currentAnalysis.items
                })
            }
        );

        if (!response.ok) {
            throw new Error("Save failed.");
        }

        const data =
            await response.json();

        statusMessage.textContent =
            `Saved successfully. ${data.items_saved} items added to memory.`;

        debriefInput.value = "";

        analysisSection.classList.add(
            "hidden"
        );

        currentAnalysis = null;

        loadProjects();

    } catch (error) {

        console.error(error);

        statusMessage.textContent =
            "Something went wrong while saving.";

    } finally {

        confirmButton.disabled = false;

        confirmButton.textContent =
            "Confirm & Save";
    }
}


/* =========================
   LOAD PROJECTS
========================= */

async function loadProjects() {

    if (!projectsList) return;

    try {

        const response =
            await fetch("/projects");

        if (!response.ok) {
            throw new Error(
                "Failed to load projects."
            );
        }

        const projects =
            await response.json();

        projectsList.innerHTML = "";

        if (projects.length === 0) {

            projectsList.textContent =
                "No projects found.";

            return;
        }

        projects.forEach(
            project => {

                const projectElement =
                    document.createElement("div");

                projectElement.className =
                    "project-card";


                const nameElement =
                    document.createElement("div");

                nameElement.className =
                    "project-name";

                nameElement.textContent =
                    project.name;


                const statusElement =
                    document.createElement("div");

                statusElement.className =
                    "project-status";

                statusElement.textContent =
                    project.status;


                projectElement.appendChild(
                    nameElement
                );

                projectElement.appendChild(
                    statusElement
                );


                projectElement.addEventListener(
                    "click",
                    () => {

                        openProject(
                            project.id
                        );
                    }
                );


                projectsList.appendChild(
                    projectElement
                );
            }
        );

    } catch (error) {

        console.error(error);

        projectsList.textContent =
            "Failed to load projects.";
    }
}


/* =========================
   OPEN PROJECT
========================= */

async function openProject(projectId) {

    console.log(
        "Opening project:",
        projectId
    );

    try {

        const response = await fetch(
            `/projects/${projectId}`
        );

        if (!response.ok) {

            throw new Error(
                "Failed to load project."
            );
        }

        const data =
            await response.json();

        console.log(
            "PROJECT DATA:",
            data
        );

        displayProject(data);

    } catch (error) {

        console.error(
            "PROJECT LOAD ERROR:",
            error
        );

        if (statusMessage) {

            statusMessage.textContent =
                "Failed to load project details.";
        }
    }
}


/* =========================
   FORMAT ITEM TYPE
========================= */

function formatItemType(type) {

    if (!type) {
        return "UNKNOWN";
    }

    return type
        .replaceAll("_", " ")
        .toUpperCase();
}


/* =========================
   DISPLAY PROJECT
========================= */

function displayProject(data) {

    console.log(
        "DISPLAYING PROJECT"
    );

    console.log(
        "WORK ITEMS:",
        data.work_items
    );


    const project =
        data.project || {};

    const workItems =
        data.work_items || [];


    /* SWITCH VIEWS */

    if (dashboardView) {

        dashboardView.classList.add(
            "hidden"
        );
    }

    if (projectView) {

        projectView.classList.remove(
            "hidden"
        );
    }


    /* PROJECT DETAILS */

    if (projectName) {

        projectName.textContent =
            project.name ||
            "Unnamed Project";
    }

    if (projectDescription) {

        projectDescription.textContent =
            project.description ||
            "No project description yet.";
    }

    if (projectStatus) {

        projectStatus.textContent =
            project.status ||
            "unknown";
    }

    if (projectFocus) {

        projectFocus.textContent =
            project.current_focus ||
            "No current focus set.";
    }

    if (projectMilestone) {

        projectMilestone.textContent =
            project.next_milestone ||
            "No milestone set.";
    }


    /* PROJECT MEMORY */

    if (!projectWorkItems) {

        console.error(
            "ERROR: project-work-items element not found."
        );

        return;
    }

    console.log(
        "PROJECT MEMORY ELEMENT FOUND"
    );

    projectWorkItems.innerHTML = "";


    if (workItems.length === 0) {

        const emptyState =
            document.createElement("p");

        emptyState.className =
            "empty-state";

        emptyState.textContent =
            "No project memory yet.";

        projectWorkItems.appendChild(
            emptyState
        );

        return;
    }


    workItems.forEach(
        item => {

            const itemElement =
                document.createElement("div");

            itemElement.className =
                "memory-item";


            /* HEADER */

            const headerElement =
                document.createElement("div");

            headerElement.className =
                "memory-item-header";


            /* TYPE */

            const typeElement =
                document.createElement("span");

            typeElement.className =
                "memory-item-type";

            typeElement.textContent =
                formatItemType(item.type);


            /* PRIORITY */

            const priorityElement =
                document.createElement("span");

            priorityElement.className =
                "memory-item-priority";

            priorityElement.textContent =
                `Priority ${item.priority ?? 3}`;


            headerElement.appendChild(
                typeElement
            );

            headerElement.appendChild(
                priorityElement
            );


            /* TITLE */

            const titleElement =
                document.createElement("div");

            titleElement.className =
                "memory-item-title";

            titleElement.textContent =
                item.title ||
                "Untitled item";


            /* CONTENT */

            const contentElement =
                document.createElement("div");

            contentElement.className =
                "memory-item-content";

            contentElement.textContent =
                item.content || "";


            /* BUILD */

            itemElement.appendChild(
                headerElement
            );

            itemElement.appendChild(
                titleElement
            );


            if (item.content) {

                itemElement.appendChild(
                    contentElement
                );
            }


            projectWorkItems.appendChild(
                itemElement
            );
        }
    );

    console.log(
        `${workItems.length} memory items rendered.`
    );
}


/* =========================
   BACK TO DASHBOARD
========================= */

if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            if (projectView) {

                projectView.classList.add(
                    "hidden"
                );
            }

            if (dashboardView) {

                dashboardView.classList.remove(
                    "hidden"
                );
            }

            loadProjects();
        }
    );
}


/* =========================
   EVENT LISTENERS
========================= */

if (analyzeButton) {

    analyzeButton.addEventListener(
        "click",
        analyzeUpdate
    );
}

if (confirmButton) {

    confirmButton.addEventListener(
        "click",
        confirmAndSave
    );
}


/* =========================
   INITIAL LOAD
========================= */

loadProjects();