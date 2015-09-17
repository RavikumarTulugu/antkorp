<?php
//Connect to the my sql DB
$user_feedback=json_decode($_POST[userFeedback],true);
$con=mysql_connect("localhost","rajuk","nccw3yld");
if(!$con) {
 	die('Could not connect: '.mysql_error());
}
mysql_select_db("my_db",$con);

$sql="INSERT INTO feedbacks (id,name,email,feedback,dat) VALUES ('$user_feedback[id]','$user_feedback[name]','$user_feedback[email]','$user_feedback[stmt]', CURDATE())";
if(!mysql_query($sql,$con)) {
 	die('Error: '.mysql_error());
	$ret="fail";
}

echo json_encode(array("message" => $ret));
?>

