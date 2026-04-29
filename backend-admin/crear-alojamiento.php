<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include "conexion.php";

$data = json_decode(file_get_contents("php://input"), true);

$nombre     = $data["nombre"]     ?? '';
$ubicacion  = $data["ubicacion"]  ?? '';
$precio     = $data["precio"]     ?? 0;
$capacidad  = $data["capacidad"]  ?? 0;
$descripcion= $data["descripcion"]?? '';

$sql = "INSERT INTO alojamientos (nombre, ubicacion, precio, capacidad, descripcion)
        VALUES (?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);  // ← Solo UNA vez
$stmt->bind_param("ssdis", $nombre, $ubicacion, $precio, $capacidad, $descripcion);

if ($stmt->execute()) {
    echo json_encode(["status" => "ok"]);
} else {
    echo json_encode(["status" => "error", "msg" => $stmt->error]);
}