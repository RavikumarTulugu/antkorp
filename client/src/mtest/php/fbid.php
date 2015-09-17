<?php
   //Connect to the my sql DB
$user = json_decode($_POST[user], true);
$con = mysql_connect("localhost", "rajuk", "nccw3yld");
if (!$con) {
	die('Could not connect: ' . mysql_error());
}
mysql_select_db("my_db", $con);

$query = "select id from fbvisits where username = '" . $user[uname]."'";
//$query_result = mysql_query($query);

if (!mysql_query($query, $con)) {
	die('Error: ' . mysql_error());
}
//echo $query_result;
$result = mysql_fetch_array(mysql_query($query, $con));

echo json_encode(array("message" => $result));
?>