<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "conexion.php";

$data = json_decode(file_get_contents("php://input"), true);

$nombre = $data["nombre"];
$ubicacion = $data["ubicacion"];
$precio = $data["precio"];
$capacidad = $data["capacidad"];
$descripcion = $data["descripcion"];

$sql = "INSERT INTO alojamientos(nombre,ubicacion,precio,capacidad,descripcion)
VALUES('$nombre','$ubicacion','$precio','$capacidad','$descripcion')";

if($conn->query($sql)){
    echo json_encode(["status"=>"ok"]);
}else{
    echo json_encode(["status"=>"error"]);
}