<?php

$host = "mysql.railway.internal";
$port = 3306;
$user = "root";
$password = "nxhAdiVRlMKguOyMNobtNbwwTIGdYgKc";
$database = "railway";

$conn = new mysqli($host, $user, $password, $database, $port);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

?>