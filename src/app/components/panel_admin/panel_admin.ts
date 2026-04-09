import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Status = "active" | "inactive";

interface Accommodation {
  id: number;
  name: string;
  location: string;
  price: number;
  capacity: number;
  description: string;
  status: Status;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel_admin.html',
  styleUrls: ['./panel_admin.css']
})
export class PanelAdmin {

  // ───── RF-008 CONTROL ACCESO ─────

  currentUser = {
    name: "Administrador",
    role: "admin"
  };

  accessDenied = false;

  // ───── ESTADO ─────

  accommodations: Accommodation[] = [
    {
      id: 1,
      name: "Cabaña del Lago",
      location: "Villa de Leyva",
      price: 280000,
      capacity: 4,
      description: "Cabaña frente al lago",
      status: "active"
    }
  ];

  nextId = 2;

  selectedSection = "dashboard";

  // formulario
  showForm = false;
  editing = false;

  form: Accommodation = {
    id: 0,
    name: "",
    location: "",
    price: 0,
    capacity: 1,
    description: "",
    status: "active"
  };

  // eliminar
  deleteId: number | null = null;

  constructor() {
    this.validateAccess();
  }

  validateAccess() {
    if (this.currentUser.role !== "admin") {
      this.accessDenied = true;
    }
  }

  // ───── NAVEGACIÓN ─────

  switchSection(section: string) {
    this.selectedSection = section;
  }

  // ───── RF-009 CREAR ─────

  openCreate() {
    this.editing = false;
    this.showForm = true;

    this.form = {
      id: 0,
      name: "",
      location: "",
      price: 0,
      capacity: 1,
      description: "",
      status: "active"
    };
  }

  // ───── RF-010 EDITAR ─────

  openEdit(acc: Accommodation) {
    this.editing = true;
    this.showForm = true;

    this.form = { ...acc };
  }

  saveAccommodation() {

    if (!this.form.name) {
      alert("El nombre es obligatorio");
      return;
    }

    if (this.form.price <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }

    if (this.editing) {

      const index = this.accommodations.findIndex(a => a.id === this.form.id);

      if (index === -1) {
        alert("Alojamiento no encontrado");
        return;
      }

      this.accommodations[index] = { ...this.form };

    } else {

      this.form.id = this.nextId++;

      this.accommodations.push({ ...this.form });

    }

    this.showForm = false;
  }

  cancelForm() {
    this.showForm = false;
  }

  // ───── RF-0011 ELIMINAR ─────

  confirmDelete(id: number) {
    this.deleteId = id;
  }

  deleteAccommodation() {

    if (this.deleteId === null) return;

    const index = this.accommodations.findIndex(a => a.id === this.deleteId);

    if (index === -1) {
      alert("Alojamiento no encontrado");
      return;
    }

    this.accommodations.splice(index, 1);

    this.deleteId = null;
  }

  cancelDelete() {
    this.deleteId = null;
  }

}