<?php
error_reporting(-1);
ini_set('display_errors', 'On');


//Connect to the my sql DB
$user_profile = json_decode($_POST['userProfile'], true);
$con = mysql_connect("localhost", "rajuk", "nccw3yld");
//$ret=null;

if (!$con) {
	die('Could not connect: ' . mysql_error());
}
mysql_select_db("antkorp", $con);


if($user_profile['mesgtype'] == "checkEmail" ){

	$check = "select count('email') emailcnt from registerUsers where email ='" .$user_profile['email']."'";
	$check_result = mysql_fetch_array(mysql_query($check));
	
	if ($check_result['emailcnt'] == "0") {
		$ret = false;
	}else
	{
		$usernameCheck = "select * from registerUsers where email = '".$user_profile['email']."'";
		//echo $usernameCheck;
		$ret = mysql_fetch_array(mysql_query($usernameCheck));
	}
}
else if($user_profile['mesgtype'] == "UpdateConfirm"){
	
	$sql="UPDATE registerUsers SET confirmed='1' where email ='".$user_profile['email']."'";
	//echo $sql;
	$ret = mysql_query($sql) ;

}
/*
else if($user_profile['mesgtype'] == "UpdateRegistered"){


	$sql = "UPDATE registerUsers SET registered='1' where email ='".$user_profile[email]."'";
	$ret = mysql_query($sql) or echo "Failed to Update.";

}
*/
/*
 //$sql = "INSERT INTO fbvisits (id,name,emailid,location,dat,username) VALUES ('$user_profile[id]','$user_profile[name]','$user_profile[email]','$location[name]', CURDATE(),'$user_profile[username]')";
//if (!mysql_query($sql, $con)) {
//die('Error: ' . mysql_error());
//}
$ret = 1;
*/

echo json_encode(array("message" => $ret));
?>

