<?php

$host = "localhost";
$user = "root";
$password = "";
$database = "booking_manager";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Error de conexion: " . $conn->connect_error);
}

$conn->set_charset("utf8");

?>