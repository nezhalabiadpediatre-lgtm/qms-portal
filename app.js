// === CONFIGURATION SUPABASE ===
// Remplacer par vos clés Supabase depuis Paramètres > API
const SUPABASE_URL = 'https://ymrrkhaspzpbqblzsuwm.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltcnJraGFzcHpwYnFibHpzdXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMzI3MTAsImV4cCI6MjA5MjgwODcxMH0.WJLAklXP7MvEov7a4BK6PkyC97opDKASH4WxoyA-BcY';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === GESTION DE L'AUTHENTIFICATION ===
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        document.getElementById('user-email').innerText = session.user.email;
        initApp();
    } else {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('app-section').classList.add('hidden');
    }
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('auth-error');
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        errorMsg.innerText = "Erreur : " + error.message;
    } else {
        errorMsg.innerText = "";
        checkAuth();
    }
}

async function logout() {
    await supabase.auth.signOut();
    checkAuth();
}

// === NAVIGATION INTERFACE ===
function showView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    document.getElementById(`view-${viewId}`).classList.add('active');
    
    if(viewId === 'dashboard') loadDashboard();
    if(viewId === 'events') loadEvents();
    if(viewId === 'departments') loadDepartments();
}

function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.toggle('hidden');
}

// === INITIALISATION ===
async function initApp() {
    await loadDepartmentsSelect(); // Charge les depts dans le formulaire
    showView('dashboard');
}

// === LOGIQUE DEPARTEMENTS ===
async function loadDepartments() {
    const { data, error } = await supabase.from('departments').select('*').order('name');
    if (error) return console.error(error);
    
    const container = document.getElementById('dept-list');
    container.innerHTML = data.map(d => `<div class="dept-card">${d.name}</div>`).join('');
}

async function loadDepartmentsSelect() {
    const { data } = await supabase.from('departments').select('id, name');
    const select = document.getElementById('ev-dept');
    select.innerHTML = data.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

async function saveDepartment(e) {
    e.preventDefault();
    const name = document.getElementById('dept-name').value;
    await supabase.from('departments').insert([{ name }]);
    document.getElementById('dept-form').reset();
    toggleModal('dept-modal');
    loadDepartments();
    loadDepartmentsSelect();
}

// === LOGIQUE EVENEMENTS QUALITE ===
async function loadEvents() {
    const typeFilter = document.getElementById('filter-type').value;
    const statusFilter = document.getElementById('filter-status').value;
    
    let query = supabase.from('quality_events').select(`*, departments(name)`).order('created_at', { ascending: false });
    
    if (typeFilter) query = query.eq('event_type', typeFilter);
    if (statusFilter) query = query.eq('status', statusFilter);
    
    const { data, error } = await query;
    if (error) return console.error(error);
    
    const tbody = document.getElementById('events-list');
    tbody.innerHTML = data.map(ev => {
        const statusClass = ev.status === 'Réalisé' ? 'bg-success' : 'bg-warning';
        return `
            <tr>
                <td>${ev.id.substring(0,8)}</td>
                <td>${ev.event_type}</td>
                <td>${ev.departments ? ev.departments.name : 'N/A'}</td>
                <td>${ev.event_date}</td>
                <td>${ev.responsible || '-'}</td>
                <td><span class="badge ${statusClass}">${ev.status}</span></td>
                <td>
                    <button class="btn-secondary" style="padding: 5px; font-size:12px;" onclick="alert('Détails non implémentés dans cette démo')">Voir</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function saveEvent(e) {
    e.preventDefault();
    
    const newEvent = {
        event_type: document.getElementById('ev-type').value,
        department_id: document.getElementById('ev-dept').value,
        event_date: document.getElementById('ev-date').value,
        status: document.getElementById('ev-status').value,
        description: document.getElementById('ev-desc').value,
        action_taken: document.getElementById('ev-action').value,
        responsible: document.getElementById('ev-resp').value,
        planned_date: document.getElementById('ev-planned').value || null,
        completion_date: document.getElementById('ev-completion').value || null,
        root_cause: document.getElementById('ev-root').value,
        recurrence: document.getElementById('ev-recurrence').checked
    };

    const { error } = await supabase.from('quality_events').insert([newEvent]);
    if (error) {
        alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
        document.getElementById('event-form').reset();
        toggleModal('event-modal');
        loadEvents();
        loadDashboard();
    }
}

// === TABLEAU DE BORD ===
async function loadDashboard() {
    const { data, error } = await supabase.from('quality_events').select('status');
    if(error) return;
    
    const total = data.length;
    const pending = data.filter(d => d.status === 'En cours').length;
    const closed = data.filter(d => d.status === 'Réalisé').length;
    
    document.getElementById('kpi-total').innerText = total;
    document.getElementById('kpi-pending').innerText = pending;
    document.getElementById('kpi-closed').innerText = closed;
}

// === EXPORT EXCEL ===
async function exportToExcel() {
    const { data, error } = await supabase.from('quality_events').select('*, departments(name)');
    if (error || !data) return alert("Erreur d'export");
    
    const formattedData = data.map(ev => ({
        ID: ev.id,
        Type: ev.event_type,
        Département: ev.departments ? ev.departments.name : '',
        Date_Evénement: ev.event_date,
        Description: ev.description,
        Action: ev.action_taken,
        Responsable: ev.responsible,
        Statut: ev.status,
        Date_Prévue: ev.planned_date,
        Date_Réalisation: ev.completion_date,
        Cause_Racine: ev.root_cause
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Evenements_Qualite");
    XLSX.writeFile(workbook, "Export_Qualite.xlsx");
}

// Démarrage au chargement de la page
checkAuth();