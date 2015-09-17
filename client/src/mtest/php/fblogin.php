<?php

//Connect to the my sql DB
$user_profile = json_decode($_POST[userProfile], true);
$con = mysql_connect("localhost", "rajuk", "nccw3yld");
if (!$con) {
	die('Could not connect: ' . mysql_error());
}
mysql_select_db("my_db", $con);

$check = "select count('id') idcnt from fbvisits where id= " . $user_profile[id];
$check_result = mysql_fetch_array(mysql_query($check));

if (!$check_result[idcnt]) {
	$location = $user_profile[location];
	$sql = "INSERT INTO fbvisits (id,name,emailid,location,dat,username) VALUES ('$user_profile[id]','$user_profile[name]','$user_profile[email]','$location[name]', CURDATE(),'$user_profile[username]')";
	if (!mysql_query($sql, $con)) {
		die('Error: ' . mysql_error());
	}
	$ret = 1;
} else {
	$ret = 0;
}
echo json_encode(array("message" => $ret));
?>

