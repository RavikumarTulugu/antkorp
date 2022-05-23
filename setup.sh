#!/bin/bash
#setup is a bash script which installs the required packages from the apt-repository 
#to setup a 'development' environment for the antkorp platform.

#install boost and then issue a ./b2 install in the boost directory
#XXX: boost_1.54 ; make ; make install;

#update
apt-get update

#install required packages from ubuntu repository
apt-get -y install clang-3.6 
apt-get -y install openssl
apt-get -y install libssl-dev
# apt-get -y install libimlib2
# apt-get -y install libimlib2-dev
apt-get -y install dialog
apt-get -y install build-essential
apt-get -y install fakeroot 
apt-get -y install devscripts
apt-get -y install pkg-config
apt-get -y install scons
apt-get -y install lua5.1
apt-get -y install liblua5.1-dev
apt-get -y install libcurl4-openssl-dev
apt-get -y install libhtmlcxx-dev
apt-get -y install attr 
apt-get -y install attr-dev
apt-get -y install luarocks
apt-get -y install libjpeg62
apt-get -y install libjpeg62-dev 
apt-get -y install libreoffice-gtk3
apt-get -y install mongodb
apt-get -y install apache2
apt-get -y install reprepo
apt-get -y install libpango1.0-dev
apt-get -y install libgdk-pixbuf2.0-dev
apt-get -y install xorg-dev
apt-get -y install conntrack
apt-get -y install glib-2.0 
apt-get -y install libgtk-3.0 
apt-get -y install libgtk-3-dev
apt-get -y install npm
apt-get -y install libgd2-xpm
apt-get -y install libgd2-xpm-dev
apt-get -y install flex
apt-get -y install bison
apt-get -y install gawk
apt-get -y install gobject-introspection
apt-get -y install libgirepository1.0-dev

#apt-get -y install 389-ds
#apt-get -y install 389-ds-base
#apt-get -y install 389-admin
#apt-get -y install 389-admin-console

luarocks install lualogging
luarocks install luasocket
luarocks install stdlib
luarocks install luabitop
luarocks install luaposix
luarocks install stdlib
luarocks install lbase64
luarocks install lua-cjson
luarocks install lpeg
luarocks install luaposix

apt-get -y install libimlib2
apt-get -y install libimlib2-dev
luarocks install lua-imlib2 'IMLIB2_DIR=/usr'
luarocks install luasec

