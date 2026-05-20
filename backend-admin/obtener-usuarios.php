<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include "conexion.php";

// Consulta para traer los usuarios junto al conteo total de sus reservas
$sql = "SELECT u.id, u.nombre, u.email, u.fecha_registro, 
               COUNT(r.id) AS total_reservas
        FROM usuarios u
        LEFT JOIN reservas r ON u.id = r.id_usuario
        GROUP BY u.id
        ORDER BY u.fecha_registro DESC";

$result = $conn->query($sql);
$data = [];

if ($result) {
    while($row = $result->fetch_assoc()){
        // Forzamos el tipo numérico para el contador
        $row['total_reservas'] = (int)$row['total_reservas'];
        $data[] = $row;
    }
}

echo json_encode($data);
?>