<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

include "conexion.php";

$data        = json_decode(file_get_contents("php://input"), true);
$id          = $data['id'];
$nombre      = $data['nombre'];
$ubicacion   = $data['ubicacion'];
$precio      = $data['precio'];
$capacidad   = $data['capacidad'];
$descripcion = $data['descripcion'];

$sql = "UPDATE alojamientos 
        SET nombre=?, ubicacion=?, precio=?, capacidad=?, descripcion=?
        WHERE id=?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ssdisi", $nombre, $ubicacion, $precio, $capacidad, $descripcion, $id);
$stmt->execute();

echo json_encode(["status" => "ok"]);