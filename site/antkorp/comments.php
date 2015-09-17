
<a name="Comm"><h3>Comments</h3></a>
<?php
$data=$_POST['nam'];
$data = trim($data);
$data = stripslashes($data);
$data = htmlspecialchars($data);
if(isset($_REQUEST['nam']))
{
	if(strlen($data) != 0 && $_POST['commen']!="")
	{
		$con = mysql_connect("localhost","rajuk","nccw3yld");
		if (!$con)
  		{
  			die('Could not connect: ' . mysql_error());
  		}
		mysql_select_db("my_db", $con);
		$sql="INSERT INTO comments (name,emailid,comment)
		VALUES
		('$_POST[nam]','$_POST[email]','$_POST[commen]')";

		if (!mysql_query($sql,$con))
  		{
  			die('Error: ' . mysql_error());
  		}
		echo "Commented successfully";

	}
	else
	{
		echo "Please fill all the fields  to comment";
	}
}
?>

<form name="form1" method="post" action="blog.php#comm">
<table><tr><th>Name:</th><td> <input type="text" name="nam" size="35" class="tb"/></td></tr>
<tr><th>Email ID: </th><td><input type="email" name="email" size="35"class="tb"></td></tr>
<tr><th>Comment:</th><td><textarea cols="35" rows="5" name="commen" class="tb"></textarea></td></tr>
<tr><td><input type="submit" name="submit" /></td><td><input type="reset" name="clear" value="Clear"/></td></tr></table>
</form>
<?php
$con = mysql_connect("localhost","rajuk","nccw3yld");
mysql_select_db("my_db", $con);
$result = mysql_query("SELECT * FROM comments order by cid desc");

while($row = mysql_fetch_array($result))
  {

  echo "<div class='cmt'><b>".$row['name']."</b>";
  echo "<br /> <p>" .$row['comment']." </p></div>";
  }
mysql_close($con);
?>

