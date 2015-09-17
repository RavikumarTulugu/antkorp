<Doctype html>
<html>
<head>
<title>antkorp</title>
<!--<link href='http://fonts.googleapis.com/css?family=Dosis' rel='stylesheet' type='text/css'>-->
<style>
body
{
margin-left:auto;
margin-right:auto;
background-color:white;
font-family: 'Dosis', sans-serif;
}
.tb
{
border:1px solid gray;
}
.comnt
{
padding-left:100px;
width:600px;
}
.comt a
{
text-decoration:none;
color:white;
opacity:1;
font-weight:bolder;
font-family: 'Dosis', sans-serif;
}
.comt a:hover
{
text-decoration:underline;
font-family: 'Dosis', sans-serif;
color:#F0FFF0;
}
#menu {
  position: fixed;
  right: 0;
  top: 0%;
  width: 35%;
list-style:none;
float:left;
background-color:#191970;
border-radius:5px;
margin-right:200px;
}
#manu ul
{
list-style:none;
}
#menu ul li
{
float:left;
width:100px;
height:30px;
text-align:center;
font-family: 'Dosis', sans-serif;
}
.cmt
{
width:600px;
background-color:snow;
}
.main
{
width:100%;
padding-top:100px;
}
.artdiv
{
width:60%;
padding-top:10px;
padding-left:20%;
border:0px solid black;
/*font-weight:bold;*/
}
.bhead
{
font-family: 'Dosis', sans-serif;
color:#191970;
font-size:52px;
text-shadow:;
}
p
{

font-size:18px;
text-align:justify;
width:80%;
}
.artpgrh 
{

font-size:18px;
text-align:justify;

}
time
{
font-size:10px;
line-height:3px;
color:#FFA07A;
}
</style>
</head>
<body>
<nav class="comt">
<div id="menu">
<ul >
<li><a href="#features" >Features</a></li>
<li><a href="#vision" >Vision</a></li>
<li><a href="#Comm" >Contact</a></li>
<li><a href="http://feedburner.google.com/fb/a/mailverify?uri=Neptunium&amp;loc=en_US"><img src="http://www.feedburner.com/fb/images/pub/feed-icon32x32.png"  height=30px alt="" style="border:0"/></a></li>
</ul>
</div>
</nav>
<div class="main">
<?php
$con = mysql_connect("localhost","rajuk","nccw3yld");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("my_db", $con);

$result = mysql_query("SELECT * FROM post order by pid desc");


while($row = mysql_fetch_array($result))
  {
?>

<div class="artdiv">
	<artical>
		<header>
		
		<h2 class="bhead"><?php echo $row['title']; ?></h2>
		<time datetime="2012-4-4" pubdate><?php echo $row['pdate']; ?></time>
		</header>
		<p class="artpgrh"><?php echo $row['post']; ?> </p>
		<p class="comt"><a href="#Comm">Comment</a></p>
	</article>
</div>
<?php 
}
mysql_close($con);
?>
</div>
</body>
</html>
