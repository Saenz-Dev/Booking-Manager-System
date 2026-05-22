<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include "conexion.php";

$data = json_decode(file_get_contents("php://input"), true);

$nombre = $data["nombre"] ?? '';
$ubicacion = $data["ubicacion"] ?? '';
$precio = $data["precio"] ?? 0;
$capacidad = $data["capacidad"] ?? 0;
$descripcion = $data["descripcion"] ?? '';
$imagenes = $data["imagenes"] ?? '[]';
try {

    $sql = "INSERT INTO alojamientos
    (nombre, ubicacion, precio, capacidad, descripcion, imagenes)
    VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception($conn->error);
    }

    $stmt->bind_param(
        "ssdiss",
        $nombre,
        $ubicacion,
        $precio,
        $capacidad,
        $descripcion,
        $imagenes
    );

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