const TRACKER_API_URL = "https://broken-meadow-47c5.ivlievd156.workers.dev/tracker";

let trackerState = {
    isAdmin: false,
    queues: ['Общая'], // Дефолтное значение
    tasks: [],
    myId: null
};

async function initTracker() {
    const loader = document.getElementById('tracker-loader');
    const content = document.getElementById('tracker-content');
    
    if(loader) loader.style.display = 'block';
    if(content) content.innerHTML = ''; // Очистка старого контента

    try {
        const tg = window.Telegram.WebApp;
        const res = await fetch(`${TRACKER_API_URL}/init`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: tg.initData })
        });

        const data = await res.json();
        console.log("Tracker Data Received:", data); // Для отладки в консоли

        if (data.ok) {
            trackerState.isAdmin = data.isAdmin;
            trackerState.queues = (data.queues && data.queues.length > 0) ? data.queues : ['Общая'];
            trackerState.tasks = data.tasks || [];
            trackerState.myId = data.myId;
            renderTrackerUI();
        } else {
            content.innerHTML = `<p style="color:red; padding:20px;">Ошибка доступа: ${data.error || 'неизвестно'}</p>`;
        }
    } catch (e) {
        console.error("Tracker Load Error:", e);
        content.innerHTML = `<p style="color:red; padding:20px;">Ошибка сети. Проверьте консоль.</p>`;
    } finally {
        if(loader) loader.style.display = 'none';
    }
}

function renderTrackerUI() {
    const container = document.getElementById('tracker-content');
    if (!container) return;

    let html = `
        <div class="tracker-controls">
            <div class="tracker-filter">
                <select id="filter-queue" onchange="filterTasks()" class="tracker-input">
                    <option value="all">Все очереди</option>
                    ${trackerState.queues.map(q => `<option value="${q}">${q}</option>`).join('')}
                </select>
            </div>
            ${trackerState.isAdmin ? `
            <div class="admin-actions" style="display:flex; gap:10px; margin-top:10px;">
                <button class="btn-tracker-action" onclick="openTaskModal()" style="flex:1;">+ Задача</button>
                <button class="btn-tracker-secondary" onclick="createQueue()">+ Проект</button>
            </div>` : ''}
        </div>
        <div class="tracker-list" id="tracker-list-container">
            ${generateTaskListHTML(trackerState.tasks)}
        </div>
    `;
    container.innerHTML = html;
}

function generateTaskListHTML(tasks) {
    if (!tasks || tasks.length === 0) return '<div style="text-align:center; padding:20px; color:gray;">Задач пока нет</div>';

    return tasks.map(t => `
        <div class="tracker-card" onclick="editTask('${t.id}')">
            <div class="tracker-card-header">
                <span class="queue-badge">${t.queue}</span>
                <span class="status-badge" style="background:var(--accent)">${t.status}</span>
            </div>
            <div class="tracker-card-title">${t.title}</div>
            <div class="tracker-card-footer">
                <span>👤 ${t.assigneeId || '---'}</span>
                <span>📅 ${t.deadline || '---'}</span>
            </div>
        </div>
    `).join('');
}

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
