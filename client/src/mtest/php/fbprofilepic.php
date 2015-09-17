$img = file_get_contents('https://graph.facebook.com/'.$fid.'/picture?type=large');
$file = dirname.'/'.$fid.'.jpg';
file_put_contents($file, $img);
$imageObject = imagecreatefromjpeg($file);
imagepng($imageObject,'profile.png');
