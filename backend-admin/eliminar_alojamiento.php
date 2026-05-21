<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include "conexion.php";

$data = json_decode(file_get_contents("php://input"), true);

$id = $data["id"];

$sql = "DELETE FROM alojamientos WHERE id=?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i",$id);

$stmt->execute();

echo json_encode(["status"=>"ok"]);