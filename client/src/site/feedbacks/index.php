<!Doctype html>
<html>
<head>
<title>Feedbacks</title>
<style>
.center {
	width: 600px;
	margin: 0px auto;
}


#hor-minimalist-b
{
	font-family: "Lucida Sans Unicode", "Lucida Grande", Sans-Serif;
	font-size: 16px;
	background: #fff;
	margin: 45px;
	width: 480px;
	border-collapse: collapse;
	text-align: left;
}
#hor-minimalist-b th
{
	font-size: 18px;
	font-weight: normal;
	color: #039;
	padding: 10px 8px;
	border-bottom: 2px solid #6678b1;
}
#hor-minimalist-b td
{
	border-bottom: 1px solid #ccc;
	color: #669;
	padding: 6px 8px;
}
#hor-minimalist-b td.msg{
	max-width:400px;
	font-size:14px;
	word-wrap:break-word;
}
#hor-minimalist-b tbody tr:hover td
{
	color: #009;
}
</style>
</head>
<body>
	<?php 
	$con=mysql_connect("localhost","rajuk","nccw3yld");

	if(!$con) {
		die('Could not connect: '.mysql_error());
	}

	//echo "Connected to database";

	mysql_select_db("antkorp",$con);

	$sql="select * from feedbacks";

	$result = mysql_query($sql,$con);
	?>
	<div class="center">
		<table class="" id="hor-minimalist-b">
			<caption><h2>Feedbacks</h2></caption>
			<thead>
				<tr>
					<th>Date</th>
					<th>Name</th>
					<th>Message</th>
				</tr>
			</thead>
			<tbody>
				<?php 
				while($row = mysql_fetch_array($result)){
					echo "<tr>";
					echo "<td>" . $row['dat'] . "</td>";
					echo "<td>" . $row['name'] . "</td>";
					echo "<td class='msg'>" . $row['feedback'] . "</td>";
					echo "</tr>";
}
?>

			</tbody>
		</table>
	</div>
</body>

</html>
