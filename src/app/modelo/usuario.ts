import { Cuenta } from "./cuenta";

// Modelo principal de usuario en la aplicación.
export class Usuario {
    constructor(
        public id: number,
        public nombres: string,
        public apellidos: string, 
        public tipo_documento: string,
        public numero_documento: string,
        public telefono: number,
        public ciudad: string,
        public fecha_nacimiento: Date,
        public estado: number,
        public id_rol: number,
        public cuenta: Cuenta
    ) {}
}