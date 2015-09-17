<?php 
//Connect to the my sql DB
$user_profile = json_decode($_POST['userProfile'], true);
$con = mysql_connect("localhost", "rajuk", "nccw3yld");
if (!$con) {
	die('Could not connect: ' . mysql_error());
}
mysql_select_db("antkorp", $con);
$registerEmail=$user_profile['email'];
$uniqid=	uniqid();
$parts=explode('@', $registerEmail);
$username =  $parts[0] . $uniqid;
$timestamp=time();


$query= "INSERT INTO registerUsers(ID, email,timestamp,username,invited) VALUES('$uniqid', '$registerEmail',$timestamp,'$username',1);";



$queryResult=mysql_query($query,$con);

if($queryResult){
	//echo "you have registered successfully .";
}
else{

	die("Unable to process your request :" . mysql_error());
}

require_once('../../phpMailer/class.phpmailer.php');
include '../../phpMailer/simple_html_dom.php';
//include("class.smtp.php"); // optional, gets called from within class.phpmailer.php if not already loaded

$mail             = new PHPMailer();





$demolink         ="http://www.antkorp.in/demo/";
$sessionQuery	  ="?c=iu&sid=".$uniqid."&email=".$registerEmail;



//$exp              ='/\b ("http://www.antkorp.in/demo/") /';
//$body             = file_get_contents('emailTemplates/confirmMail.html');
//$body			    = preg_replace($exp,$sessionQuery ,$body);
//$body             = eregi_replace("[\]",'',$body);


$html = new simple_html_dom();
$html->load_file('../../phpMailer/emailTemplates/confirmMail.html');

$e = $html->find('a[id=confirmLink]'); // returns an array containing all the info for anchor a
$link = $e[0]->href; //the value of attribute href of anchor a which was the first element       in array
$e[0]->href = $link.$sessionQuery; // get the new value
$link = $e[0]->href; // assign the value to a variable


$mail->IsSMTP(); // telling the class to use SMTP
$mail->Host       = "127.0.0.1"; // SMTP server
//$mail->SMTPDebug  = 2;                     // enables SMTP debug information (for testing)
// 1 = errors and messages
// 2 = messages only


$mail->SetFrom('rajuk@antkorp.in', 'Neptunium Team');

$mail->AddReplyTo("rajuk@antkorp.in","Neptunium Team");

$mail->Subject    = "Neptunium : confirm your email.";

$mail->AltBody    = "To view the message, please use an HTML compatible email viewer!"; // optional, comment out and test

$mail->MsgHTML($html);

$address = $registerEmail;
$mail->AddAddress($address);

//$mail->AddAttachment("images/phpmailer.gif");      // attachment
//$mail->AddAttachment("images/phpmailer_mini.gif"); // attachment

if(!$mail->Send()) {
	echo "Mailer Error: " . $mail->ErrorInfo;
} else {
	echo "Message sent! please confirm your email ID to proceed.";
}


?>