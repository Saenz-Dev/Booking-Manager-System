// Modelo simple de la cuenta de acceso.
export class Cuenta {
    constructor(
        public id_cuenta: number,
        public correo: string,
        public contrasena: string,
        public estado_sesion: number
    ) {}
}