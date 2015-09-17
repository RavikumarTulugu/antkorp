<html>
<head>
<title>antkorp</title>
</head>
<body>

<?php

$con = mysql_connect("localhost","rajuk","nccw3yld");
mysql_select_db("my_db", $con);
$result = mysql_query("select country,count(visitor_id) visits from visitors where ip_address != '59.90.186.230' group by country order by count(visitor_id) desc LIMIT 0,20");
echo"<center><h1>Visitors List</h1></center>";
 
print "<br /><br /><center>
<table cellspacing=5px cellpadding=10px >
   
   <th>Country</th>
   <th>Visits</th>
   </tr>";
while($row = mysql_fetch_assoc($result))
{
   print "<tr>
   <td style='padding-right: 10px;'>" . $row["country"] . "</td>
   <td style='padding-right: 30px;'>" . $row["visits"] . "</td>
   </tr>";
}
print "</table></center>";
 
mysql_close($con);
?>
</body>
</html>
