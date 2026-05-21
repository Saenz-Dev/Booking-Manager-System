<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include "conexion.php";

// Consulta que unifica datos de reservas, el nombre del alojamiento y el nombre del usuario
$sql = "SELECT r.id, r.fecha_inicio, r.fecha_fin, r.estado, 
               a.nombre AS alojamiento_nombre, 
               u.nombre AS nombre_usuario 
        FROM reservas r
        LEFT JOIN alojamientos a ON r.id_alojamiento = a.id
        LEFT JOIN usuarios u ON r.id_usuario = u.id
        ORDER BY r.id DESC";

$result = $conn->query($sql);
$data = [];

if ($result) {
    while($row = $result->fetch_assoc()){
        $data[] = $row;
    }
}

echo json_encode($data);
?>