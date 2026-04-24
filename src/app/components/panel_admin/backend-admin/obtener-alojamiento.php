<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "conexion.php";

$sql = "SELECT * FROM alojamientos";
$result = $conn->query($sql);

$alojamientos = [];

while($row = $result->fetch_assoc()){
    $alojamientos[] = $row;
}

echo json_encode($alojamientos);