<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

include "conexion.php";

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'];
$nombre = $data['nombre'];
$ubicacion = $data['ubicacion'];
$precio = $data['precio'];
$capacidad = $data['capacidad'];
$descripcion = $data['descripcion'];

$sql = "UPDATE alojamientos SET
nombre='$nombre',
ubicacion='$ubicacion',
precio='$precio',
capacidad='$capacidad',
descripcion='$descripcion'
WHERE id=$id";

if($conn->query($sql)){
    echo json_encode(["status"=>"ok"]);
}else{
    echo json_encode(["error"=>$conn->error]);
}

?>