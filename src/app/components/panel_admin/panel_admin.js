"use strict";
let accommodations = [
    {
        id: 1,
        name: "Cabaña del Lago",
        location: "Villa de Leyva, Boyacá",
        price: 280000,
        capacity: 4,
        description: "Cabaña rústica frente al lago con vista a las montañas.",
        images: [],
        status: "active",
        createdAt: new Date("2024-11-01"),
    },
    {
        id: 2,
        name: "Suite Cartagena Gold",
        location: "Cartagena, Bolívar",
        price: 520000,
        capacity: 2,
        description: "Suite de lujo en el centro histórico de Cartagena.",
        images: [],
        status: "active",
        createdAt: new Date("2024-12-15"),
    },
    {
        id: 3,
        name: "Apartamento Bogotá Centro",
        location: "Bogotá, Cundinamarca",
        price: 150000,
        capacity: 3,
        description: "Apartamento moderno en el corazón de Bogotá.",
        images: [],
        status: "inactive",
        createdAt: new Date("2025-01-10"),
    },
];
let nextId = 4;
let editingId = null;
let deletingId = null;
// ─── RF-008: CONTROL DE ACCESO (simulado) ─────────────────────
const currentUser = {
    name: "Administrador",
    role: "admin",
    loggedIn: true,
};
function checkAdminAccess() {
    if (!currentUser.loggedIn || currentUser.role !== "admin") {
        openModal("modal-access-denied");
        return false;
    }
    return true;
}
// ─── NAVEGACIÓN ───────────────────────────────────────────────
function switchSection(section, btn) {
    var _a;
    if (!checkAdminAccess())
        return;
    document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
    const target = document.getElementById(`section-${section}`);
    if (target)
        target.classList.add("active");
    btn.classList.add("active");
    const titles = {
        dashboard: "Dashboard",
        accommodations: "Gestión de Alojamientos",
        reservations: "Gestión de Reservas",
        users: "Gestión de Usuarios",
        reports: "Reportes",
    };
    const titleEl = document.getElementById("page-title");
    if (titleEl)
        titleEl.textContent = (_a = titles[section]) !== null && _a !== void 0 ? _a : section;
    if (section === "accommodations")
        renderTable();
    if (section === "dashboard")
        renderDashboard();
}
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar === null || sidebar === void 0 ? void 0 : sidebar.classList.toggle("open");
}
// ─── DASHBOARD ────────────────────────────────────────────────
function renderDashboard() {
    const total = accommodations.length;
    const active = accommodations.filter((a) => a.status === "active").length;
    const inactive = accommodations.filter((a) => a.status === "inactive").length;
    setTextById("stat-total", String(total));
    setTextById("stat-active", String(active));
    setTextById("stat-inactive", String(inactive));
    const container = document.getElementById("dashboard-recent");
    if (!container)
        return;
    const recent = [...accommodations]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 4);
    container.innerHTML = recent.length
        ? recent
            .map((a) => `
      <div class="recent-card">
        <div>
          <div class="recent-name">${escHtml(a.name)}</div>
          <div class="recent-meta">${escHtml(a.location)} · Cap. ${a.capacity} personas</div>
        </div>
        <div>
          <span class="pill-status ${a.status}">${statusLabel(a.status)}</span>
        </div>
      </div>`)
            .join("")
        : `<p style="color:var(--muted);font-size:14px">Sin alojamientos registrados.</p>`;
}
// ─── TABLA DE ALOJAMIENTOS ────────────────────────────────────
function renderTable() {
    var _a, _b, _c;
    const search = ((_b = (_a = document.getElementById("search-input")) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : "").toLowerCase();
    const statusFilter = (_c = document.getElementById("filter-status")) === null || _c === void 0 ? void 0 : _c.value;
    const filtered = accommodations.filter((a) => {
        const matchText = a.name.toLowerCase().includes(search) ||
            a.location.toLowerCase().includes(search);
        const matchStatus = statusFilter === "all" || a.status === statusFilter;
        return matchText && matchStatus;
    });
    const tbody = document.getElementById("table-body");
    const emptyState = document.getElementById("empty-state");
    const table = document.getElementById("accommodations-table");
    if (!tbody)
        return;
    if (filtered.length === 0) {
        tbody.innerHTML = "";
        emptyState === null || emptyState === void 0 ? void 0 : emptyState.classList.remove("hidden");
        if (table)
            table.style.display = "none";
        return;
    }
    emptyState === null || emptyState === void 0 ? void 0 : emptyState.classList.add("hidden");
    if (table)
        table.style.display = "table";
    tbody.innerHTML = filtered
        .map((a, i) => `
    <tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td><strong>${escHtml(a.name)}</strong></td>
      <td>${escHtml(a.location)}</td>
      <td style="color:var(--gold)">${formatCOP(a.price)}</td>
      <td>${a.capacity} pers.</td>
      <td><span class="pill-status ${a.status}">${statusLabel(a.status)}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-icon" title="Editar" onclick="openEditModal(${a.id})">✎</button>
          <button class="btn btn-icon danger" title="Eliminar" onclick="openDeleteModal(${a.id})">✕</button>
        </div>
      </td>
    </tr>`)
        .join("");
}
// ─── RF-009: CREAR ALOJAMIENTO ────────────────────────────────
function openCreateModal() {
    if (!checkAdminAccess())
        return;
    editingId = null;
    clearForm();
    setTextById("modal-form-title", "Crear Alojamiento");
    setTextById("btn-save-form", "Guardar Alojamiento");
    openModal("modal-form");
}
// ─── RF-010: EDITAR ALOJAMIENTO ───────────────────────────────
function openEditModal(id) {
    if (!checkAdminAccess())
        return;
    const acc = findById(id);
    if (!acc) {
        showToast("Alojamiento no encontrado.", "error");
        return;
    }
    editingId = id;
    clearForm();
    fillForm(acc);
    setTextById("modal-form-title", "Editar Alojamiento");
    setTextById("btn-save-form", "Actualizar");
    openModal("modal-form");
}
// ─── RF-0011: ELIMINAR ALOJAMIENTO ───────────────────────────
function openDeleteModal(id) {
    if (!checkAdminAccess())
        return;
    const acc = findById(id);
    if (!acc) {
        showToast("Alojamiento no encontrado.", "error");
        return;
    }
    deletingId = id;
    setTextById("modal-delete-text", `Vas a eliminar "${acc.name}". Esta acción no se puede deshacer.`);
    openModal("modal-delete");
    const btn = document.getElementById("btn-confirm-delete");
    if (btn) {
        btn.onclick = () => confirmDelete();
    }
}
function confirmDelete() {
    if (deletingId === null)
        return;
    const idx = accommodations.findIndex((a) => a.id === deletingId);
    if (idx === -1) {
        showToast("Error al eliminar: alojamiento no encontrado.", "error");
        closeModal("modal-delete");
        return;
    }
    const name = accommodations[idx].name;
    accommodations.splice(idx, 1);
    deletingId = null;
    closeModal("modal-delete");
    renderTable();
    renderDashboard();
    showToast(`"${name}" eliminado correctamente.`, "success");
}
// ─── GUARDAR FORMULARIO ───────────────────────────────────────
function handleFormSubmit(e) {
    e.preventDefault();
    if (!checkAdminAccess())
        return;
    const values = readForm();
    const errors = validateForm(values);
    if (Object.keys(errors).length > 0) {
        showFieldErrors(errors);
        return;
    }
    clearFieldErrors();
    if (editingId !== null) {
        // RF-010: Actualizar
        const acc = findById(editingId);
        if (!acc) {
            showToast("Error: alojamiento no encontrado.", "error");
            return;
        }
        Object.assign(acc, values);
        closeModal("modal-form");
        renderTable();
        renderDashboard();
        showToast("Alojamiento actualizado correctamente.", "success");
    }
    else {
        // RF-009: Crear
        const newAcc = Object.assign(Object.assign({ id: nextId++ }, values), { createdAt: new Date() });
        accommodations.unshift(newAcc);
        closeModal("modal-form");
        renderTable();
        renderDashboard();
        showToast("Alojamiento creado correctamente.", "success");
    }
}
function readForm() {
    return {
        name: getInputValue("field-name").trim(),
        location: getInputValue("field-location").trim(),
        price: parseFloat(getInputValue("field-price")) || 0,
        capacity: parseInt(getInputValue("field-capacity")) || 0,
        description: getInputValue("field-description").trim(),
        images: getInputValue("field-images")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        status: getSelectValue("field-status") || "active",
    };
}
function validateForm(v) {
    const errors = {};
    if (!v.name)
        errors.name = "El nombre es obligatorio.";
    if (!v.location)
        errors.location = "La ubicación es obligatoria.";
    if (v.price <= 0)
        errors.price = "El precio debe ser mayor a 0.";
    if (v.capacity < 1)
        errors.capacity = "La capacidad debe ser al menos 1.";
    return errors;
}
function showFieldErrors(errors) {
    const fields = ["name", "location", "price", "capacity"];
    fields.forEach((f) => {
        const errEl = document.getElementById(`err-${f}`);
        const inputEl = document.getElementById(`field-${f}`);
        if (errors[f]) {
            if (errEl)
                errEl.textContent = errors[f];
            inputEl === null || inputEl === void 0 ? void 0 : inputEl.classList.add("error");
        }
        else {
            if (errEl)
                errEl.textContent = "";
            inputEl === null || inputEl === void 0 ? void 0 : inputEl.classList.remove("error");
        }
    });
}
function clearFieldErrors() {
    ["name", "location", "price", "capacity"].forEach((f) => {
        const errEl = document.getElementById(`err-${f}`);
        const inputEl = document.getElementById(`field-${f}`);
        if (errEl)
            errEl.textContent = "";
        inputEl === null || inputEl === void 0 ? void 0 : inputEl.classList.remove("error");
    });
}
function fillForm(a) {
    setInputValue("field-name", a.name);
    setInputValue("field-location", a.location);
    setInputValue("field-price", String(a.price));
    setInputValue("field-capacity", String(a.capacity));
    setInputValue("field-description", a.description);
    setInputValue("field-images", a.images.join(", "));
    setSelectValue("field-status", a.status);
}
function clearForm() {
    ["field-name", "field-location", "field-price", "field-capacity",
        "field-description", "field-images"].forEach((id) => setInputValue(id, ""));
    setSelectValue("field-status", "active");
    clearFieldErrors();
}
// ─── MODAL HELPERS ────────────────────────────────────────────
function openModal(id) {
    var _a;
    (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.classList.remove("hidden");
}
function closeModal(id) {
    var _a;
    (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.classList.add("hidden");
}
// ─── TOAST ────────────────────────────────────────────────────
let toastTimer = null;
function showToast(message, type = "default") {
    const toast = document.getElementById("toast");
    if (!toast)
        return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    if (toastTimer)
        clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 3200);
}
// ─── DOM UTILITIES ────────────────────────────────────────────
function getInputValue(id) {
    var _a;
    const el = document.getElementById(id);
    return (_a = el === null || el === void 0 ? void 0 : el.value) !== null && _a !== void 0 ? _a : "";
}
function setInputValue(id, value) {
    const el = document.getElementById(id);
    if (el)
        el.value = value;
}
function getSelectValue(id) {
    var _a, _b;
    return (_b = (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : "";
}
function setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (el)
        el.value = value;
}
function setTextById(id, text) {
    const el = document.getElementById(id);
    if (el)
        el.textContent = text;
}
function findById(id) {
    return accommodations.find((a) => a.id === id);
}
function escHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function formatCOP(n) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(n);
}
function statusLabel(s) {
    return s === "active" ? "Activo" : "Inactivo";
}
// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // RF-008: verificar rol al cargar
    if (!checkAdminAccess())
        return;
    // Formulario submit
    const form = document.getElementById("accommodation-form");
    form === null || form === void 0 ? void 0 : form.addEventListener("submit", handleFormSubmit);
    // Cerrar sidebar al hacer click fuera (móvil)
    document.addEventListener("click", (e) => {
        const sidebar = document.getElementById("sidebar");
        const toggle = document.querySelector(".menu-toggle");
        if ((sidebar === null || sidebar === void 0 ? void 0 : sidebar.classList.contains("open")) &&
            !sidebar.contains(e.target) &&
            !(toggle === null || toggle === void 0 ? void 0 : toggle.contains(e.target))) {
            sidebar.classList.remove("open");
        }
    });
    renderDashboard();
    renderTable();
});