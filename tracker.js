// tracker.js

const TRACKER_API_URL = "https://broken-meadow-47c5.ivlievd156.workers.dev/tracker"; // Используем тот же домен что в main.js

let trackerState = {
    isAdmin: false,
    queues: [],
    tasks: [],
    myId: null
};

// Инициализация модуля Трекера
async function initTracker() {
    const loader = document.getElementById('tracker-loader');
    const content = document.getElementById('tracker-content');
    
    if(loader) loader.style.display = 'block';
    
    try {
        const tg = window.Telegram.WebApp;
        // Отправляем запрос на /init
        const res = await fetch(`${TRACKER_API_URL}/init`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: tg.initData })
        });

        const data = await res.json();
        if (data.ok) {
            trackerState.isAdmin = data.isAdmin;
            trackerState.queues = data.queues || ['Общая'];
            trackerState.tasks = data.tasks || [];
            trackerState.myId = data.myId;
            
            renderTrackerUI();
        }
    } catch (e) {
        console.error("Tracker Load Error:", e);
    } finally {
        if(loader) loader.style.display = 'none';
        if(content) content.style.display = 'block';
    }
}
function renderTrackerUI() {
    const container = document.getElementById('tracker-content');
    if (!container) return;

    // 1. Controls (Admin only buttons)
    let controlsHtml = `
        <div class="tracker-controls">
            <div class="tracker-filter">
                <select id="filter-queue" onchange="filterTasks()">
                    <option value="all">Все очереди</option>
                    ${trackerState.queues.map(q => `<option value="${q}">${q}</option>`).join('')}
                </select>
                <select id="filter-status" onchange="filterTasks()">
                    <option value="all">Все статусы</option>
                    <option value="open">Открыто</option>
                    <option value="in_progress">В работе</option>
                    <option value="review">Проверка</option>
                    <option value="done">Готово</option>
                </select>
            </div>
    `;

    if (trackerState.isAdmin) {
        controlsHtml += `
            <div class="admin-actions">
                <button class="btn-tracker-action" onclick="openTaskModal()">+ Задача</button>
                <button class="btn-tracker-secondary" onclick="createQueue()">+ Очередь</button>
            </div>
        `;
    }
    controlsHtml += `</div>`;

    // 2. Task List
    let tasksHtml = `<div class="tracker-list" id="tracker-list-container">`;
    tasksHtml += generateTaskListHTML(trackerState.tasks);
    tasksHtml += `</div>`;

    container.innerHTML = controlsHtml + tasksHtml;
}

function generateTaskListHTML(tasks) {
    if (tasks.length === 0) return '<div class="empty-state">Нет задач</div>';

    // Сортировка: Сначала открытые, потом дедлайн
    const statusOrder = { 'open': 1, 'in_progress': 2, 'review': 3, 'done': 4 };
    
    const sorted = [...tasks].sort((a,b) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(a.deadline) - new Date(b.deadline);
    });

    return sorted.map(t => {
        const isExpired = new Date(t.deadline) < new Date() && t.status !== 'done';
        const statusLabels = {
            'open': 'Открыто',
            'in_progress': 'В работе',
            'review': 'Проверка',
            'done': 'Готово'
        };
        const statusColors = {
            'open': 'var(--info)',
            'in_progress': 'var(--warning)',
            'review': 'var(--accent)',
            'done': 'var(--success)'
        };

        return `
        <div class="tracker-card" onclick="editTask('${t.id}')">
            <div class="tracker-card-header">
                <span class="queue-badge">${t.queue}</span>
                <span class="status-badge" style="background:${statusColors[t.status]}">${statusLabels[t.status]}</span>
            </div>
            <div class="tracker-card-title">${t.title}</div>
            <div class="tracker-card-desc">${t.desc || ''}</div>
            <div class="tracker-card-footer">
                <span class="assignee-id">👤 ${t.assigneeId}</span>
                <span class="deadline-date ${isExpired ? 'expired' : ''}">📅 ${new Date(t.deadline).toLocaleDateString()}</span>
            </div>
        </div>
        `;
    }).join('');
}

function filterTasks() {
    const q = document.getElementById('filter-queue').value;
    const s = document.getElementById('filter-status').value;

    const filtered = trackerState.tasks.filter(t => {
        return (q === 'all' || t.queue === q) && (s === 'all' || t.status === s);
    });

    document.getElementById('tracker-list-container').innerHTML = generateTaskListHTML(filtered);
}

// --- Actions ---

async function createQueue() {
    const name = prompt("Название новой очереди (проекта):");
    if (!name) return;

    try {
        const tg = window.Telegram.WebApp;
        const res = await fetch(`${TRACKER_API_URL}/queue/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: tg.initData, name })
        });
        if ((await res.json()).ok) {
            trackerState.queues.push(name);
            renderTrackerUI();
        }
    } catch(e) { alert("Ошибка"); }
}

let currentEditingTask = null;

function openTaskModal(taskId = null) {
    const modal = document.getElementById('tracker-modal');
    currentEditingTask = taskId ? trackerState.tasks.find(t => t.id === taskId) : null;
    
    const isNew = !currentEditingTask;
    const task = currentEditingTask || {
        title: '', desc: '', queue: trackerState.queues[0], status: 'open', assigneeId: '', deadline: new Date().toISOString().split('T')[0]
    };

    // Заполнение формы
    document.getElementById('t-title').value = task.title;
    document.getElementById('t-desc').value = task.desc;
    document.getElementById('t-assignee').value = task.assigneeId;
    document.getElementById('t-deadline').value = task.deadline.split('T')[0];
    
    // Selects
    const qSelect = document.getElementById('t-queue');
    qSelect.innerHTML = trackerState.queues.map(q => `<option value="${q}" ${q===task.queue?'selected':''}>${q}</option>`).join('');
    
    const sSelect = document.getElementById('t-status');
    sSelect.value = task.status;

    // Permissions in Modal
    // Admin: can edit everything. User: can only edit Status.
    const isOwner = trackerState.isAdmin; 
    
    document.getElementById('t-title').disabled = !isOwner && !isNew;
    document.getElementById('t-desc').disabled = !isOwner && !isNew;
    document.getElementById('t-assignee').disabled = !isOwner && !isNew;
    document.getElementById('t-queue').disabled = !isOwner && !isNew;
    document.getElementById('t-deadline').disabled = !isOwner && !isNew;
    
    document.getElementById('btn-delete-task').style.display = (isOwner && !isNew) ? 'block' : 'none';

    modal.classList.add('active');
}

function closeTrackerModal() {
    document.getElementById('tracker-modal').classList.remove('active');
    currentEditingTask = null;
}

function editTask(id) {
    openTaskModal(id);
}

async function saveTask() {
    const tg = window.Telegram.WebApp;
    
    const taskData = {
        id: currentEditingTask ? currentEditingTask.id : undefined,
        title: document.getElementById('t-title').value,
        desc: document.getElementById('t-desc').value,
        queue: document.getElementById('t-queue').value,
        status: document.getElementById('t-status').value,
        assigneeId: document.getElementById('t-assignee').value,
        deadline: document.getElementById('t-deadline').value
    };

    try {
        // ПУТЬ ДОЛЖЕН БЫТЬ ТАКИМ ЖЕ КАК В WORKER ( /task/save )
        const res = await fetch(`${TRACKER_API_URL}/task/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: tg.initData, task: taskData })
        });
        
        const data = await res.json();
        if(data.ok) {
            closeTrackerModal();
            initTracker(); // Перезагружаем список
        } else {
            alert("Ошибка: " + data.error);
        }
    } catch(e) { 
        alert("Ошибка сети при сохранении"); 
    }
}

async function deleteTask() {
    if(!confirm("Удалить задачу?")) return;
    const tg = window.Telegram.WebApp;
    try {
        const res = await fetch(`${TRACKER_API_URL}/task/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: tg.initData, taskId: currentEditingTask.id })
        });
        if((await res.json()).ok) {
            closeTrackerModal();
            initTracker();
        }
    } catch(e) { alert("Ошибка"); }
}
