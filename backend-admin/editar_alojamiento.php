<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include "conexion.php";

$data        = json_decode(file_get_contents("php://input"), true);
$id          = $data['id'] ?? null;
$nombre      = $data['nombre'] ?? '';
$ubicacion   = $data['ubicacion'] ?? '';
$precio      = $data['precio'] ?? 0;
$capacidad   = $data['capacidad'] ?? 0;
$descripcion = $data['descripcion'] ?? '';
$imagenes    = $data['imagenes'] ?? '[]'; // Agregamos la variable de imágenes

// Validación rápida de seguridad
if (!$id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "msg" => "Falta el ID del alojamiento para poder editar."]);
    exit();
}

try {
    // Agregamos imagenes=? a la consulta SQL
    $sql = "UPDATE alojamientos 
            SET nombre=?, ubicacion=?, precio=?, capacidad=?, descripcion=?, imagenes=?
            WHERE id=?";

    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception($conn->error);
    }

    // "ssdissi" -> Añadimos una 's' para $imagenes antes de la 'i' del $id
    $stmt->bind_param("ssdissi", $nombre, $ubicacion, $precio, $capacidad, $descripcion, $imagenes, $id);
    
    if (!$stmt->execute()) {
        throw new Exception($stmt->error);
    }

    echo json_encode(["status" => "ok"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "msg" => $e->getMessage()
    ]);
}