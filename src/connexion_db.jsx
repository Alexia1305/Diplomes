
<?php

$sname="localhost";
$unmae="root";
$password="";
$db_name="nft_bdd";
$conn=mysqli_connect($sname,$unmae,$password,$db_name);

if(!$conn){
    echo "Connexion à la bdd failed!";
}