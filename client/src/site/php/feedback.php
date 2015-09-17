<?php

// * wont work in FF w/ Allow-Credentials
//if you dont need Allow-Credentials, * seems to work
header('Access-Control-Allow-Origin: *');
//if you need cookies or login etc
/*header('Access-Control-Allow-Credentials: true');
if ($this->getRequestMethod() == 'OPTIONS')
{
	header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
	header('Access-Control-Max-Age: 604800');
	//if you need special headers
	header('Access-Control-Allow-Headers: x-requested-with');
	//exit(0);
}

*/


ini_set('display_errors', 1);
//Connect to the my sql DB

//$user_feedback=json_decode($_POST[userFeedback],true);

$user_feedback = $_POST['userFeedback'];

$con=mysql_connect("localhost","rajuk","nccw3yld");

if(!$con) {
	die('Could not connect: '.mysql_error());
}

//echo "Connected to database";

mysql_select_db("antkorp",$con);

$sql="INSERT INTO feedbacks (oid,uid,name,email,feedback,dat) VALUES ('$user_feedback[oid]','$user_feedback[uid]','$user_feedback[name]','$user_feedback[email]','$user_feedback[stmt]', CURDATE())";

/*if(!mysql_query($sql,$con)) {
	//die('Error: '.mysql_error());
	$ret=false;
}
*/
//echo json_encode(array("message" => mysql_query($sql,$con)));

echo mysql_query($sql,$con);
?>

