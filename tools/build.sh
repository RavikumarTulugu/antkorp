#!/bin/bash
if [ "$#" -ne 1 ]; then
  echo "You forgot to give the base directory of antkorp";
  exit 1
fi

cd $1/server/src
echo "Cleaning ...";
make clean;
echo 'Patience !!!!';
echo "Building 3rdparty...";
make 3rdparty; 
echo "Building antkorp ...";
make akorp_stuff; 
echo "Done building";
cd -
echo "Packaging deb now";
$1/tools/package.sh --deb ~/akorp antkorp_1.0_ubuntu_limited_alpha_amd64
#echo "Packaging rpm now";
#$1/tools/package.sh --rpm ~/akorp antkorp_1.0_centos_limited_alpha_amd64
