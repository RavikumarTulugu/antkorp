

### [Antkorp](http://ravikumartulugu.github.io/antkorp/)

- build.sh - master build script which builds and bakes rpm packages.
- client   - client side source code
- server   - server side source code 
- docs     - design documentation for the product 
- site     - website files for the antkorp website.
- 3party   - 3rd party source code which needs to be shipped along with 
       the product, mostly jquery or javascript libraries which 
       are from public domain.
- mockups  - directory where mockups are stored.
- tools  -  directory contains the scripts needed for setting up antkorp 

install and enable xattr on ubuntu : 
--------------------------------------

`sudo apt-get install attr `

`vim /etc/fstab `

put user_xattr on the line partition ext4.

installing qt5 on ubuntu :
---------------------------
Install dependencies of Qt 4 `sudo apt-get build-dep libqt4-dev`

Install additional dependencies `sudo apt-get install gperf bison` (needed to compile QtWebkit)

Install xcb dependencies `sudo apt-get install libxcb1 libxcb1-dev libx11-xcb1 libx11-xcb-dev libxcb-keysyms1 libxcb-keysyms1-dev libxcb-image0 libxcb-image0-dev libxcb-shm0 libxcb-shm0-dev libxcb-icccm4 libxcb-icccm4-dev libxcb-sync0 libxcb-sync0-dev libxcb-xfixes0-dev libxrender-dev libxcb-shape0-dev`

cd to the directory where you extracted the tarball and run `./configure` (with the options suggested above)

Run `./build` and wait for some time. If you have multiple cores, use `./build -j <number of cores>` to speed up the build process


installing ldap support on ubuntu for users to have home directories on the server:
-------------------------------------------------------------------------------------
install ldap on the server and make sure the ldap user is able to login to the system 


installing firewall rules on the webserver to forward websocket traffic to another server which is running akorp_ngw
---------------------------------------------------------------------------------------------------------------------
`sysctl net.ipv4.ip_forward=1`

`iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to 192.168.0.113:443`

`iptables -t nat -A POSTROUTING -j MASQUERADE -p tcp -d 192.168.0.113 --dport 443` 


how to clone ubuntu vm :
-------------------------
after clone operation on the ui 

change hostname in /etc/hosts and /etc/hostname 

`$ sudo rm /etc/udev/rules.d/70-persistent-net.rules`

`$ sudo mkdir /etc/udev/rules.d/70-persisitent-net.rules`


dependencies need to be installed from source to build antkorp:
---------------------------------------------------------------
install **libtool** and **autoconf** before installing any of the below libraries

i) *poco* 

ii) *boost* 

vii) *mongodb* 

viii) luamongodb library

ix) lua5.1 only from repo 

x) *luarocks*

xi) rocks to be installed - lualogging, luasocket, luaposix, json4lua, stdlib , luasec
	make sure you have libssl already installed on the system before luasec 
	install luasec with command 
	
`sudo luarocks install luasec OPENSSL_LIBDIR=/usr/lib/i386-linux-gnu/`
    
    install luabitop rock 
    install luaposix rock 
    install stdlib rock 
    install lbase64 rock 
    install lua-cjson rock
    install lpeg rock
    
xiv) *install ceph file system on the machines with this command* :

`echo deb http://ceph.com/debian-cuttlefish/ $(lsb_release -sc) main | sudo tee /etc/apt/sources.list.d/ceph.list`

`sudo apt-get update` 

`sudo apt-get install ceph`


not needed on the target machine since he already has a user in ldap:
----------------------------------------------------------------------
install lualdap library from luaforge kepler project

Download lua-imlib2 from http://luaforge.net/frs/download.php/3042/lua-imlib2-0.1.tar.gz and build,copy the limlib2.so to /usr/local/lib/lua/5.1

xii) install mongodb from source and copy the files in to relevant /usr/local/include and /usr/local/lib directories 

xiii) compile mongodb lua driver from the git hub repository  copy the shared object to the /usr/local/lib/lua/5.1/ 

xv) install gd  graphics library. 

xvi) install lua-gd for lua bindings to gd library.
	issue make in the lua-gd library and then copy the gd.so to the /usr/local/lib/lua/5.1
    
xxi) download the mongodb c++ driver from - http://downloads.mongodb.org/cxx-driver/mongodb-linux-x86_64-v2.2-latest.tgz

	comment out the FILESYSTEM macro in the driver source to compile.
	change the C++ compiler to g++-4.7 by adding line "env.Replace(CXX='g++-4.7')" after "Environment" line.

iv) google gflags library 

v) google glog logging library 

vi) google webp library 

vii) libcurl3 library.



stock ubuntu 13.04 and installing gtk broadway:
----------------------------------------------

    sudo apt-get install build-essential 
    sudo apt-get install pkg-config 
    sudo apt-get install glib-2.0 
    sudo apt-get install libgtk-3.0 libgtk-3-dev 
    gtk-3.8 ; ./configure --enable-broadway-backend --enable-x11-backend ; make 

   set the environment variable SAL_USE_VCLPLUGIN=gtk3 for libreoffice to use the gtk3 broadway backend.

starting virtual box vm headless mode:
--------------------------------------
`sudo -H -u rk VBoxManage startvm btrfstestub1304  --type headless`

gotchas: 
---------
> add -fPIC to the mongo cxx driver to compile it for 64 bit.

setting up apt-repository on ubuntu:
-----------------------------------
<http://www.jejik.com/articles/2006/09/setting_up_and_managing_an_apt_repository_with_reprepro/>
<http://joseph.ruscio.org/blog/2010/08/19/setting-up-an-apt-repository/>

setting up a apache2 virtual site to host an apt-repository:
------------------------------------------------------------
<http://www.foscode.com/apache-virtual-host-ubuntu/>

redirecting iptables from 443 to 8080
-------------------------------------
`sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports 8080`

disabling ssl in apache2 for using 443 by antkorp.
--------------------------------------------------
`sudo a2dismod ssl; sudo a2dissite default-ssl; sudo service apache2 restart`

enabling ssl in apache2:
-----------------------
    sudo a2enmod ssl
    sudo a2ensite default-ssl
    sudo /etc/init.d/apache2 restart

compiling ceph on ubuntu :
-------------------------
    sudo apt-get install uuid-dev 
    sudo apt-get install libuuid1
    sudo apt-get install libkeyutils-dev  
    sudo apt-get install libnss3-dev 
    sudo apt-get install libedit-dev 
    sudo apt-get install libsnappy-dev 
    sudo apt-get install libleveldb-dev 
    sudo apt-get install libaio-dev 
    ./configure --without-fuse --without-tcmalloc --without-libatomic-ops 
    make ;

rsync command to copy the files with extended attributes:
--------------------------------------------------------
`sudo rsync -razvXe "ssh" --delete --progress --stats /opt/antkorp/homes root@192.168.1.100:/opt/antkorp/`

libreoffice build flags:
---------------------------
     ./autogen.sh --build=x86_64-linux-gnu --host=x86_64-linux-gnu  --target=x86_64-linux-gnu  --enable-gtk3 --with-system-libs --without-java --without-doxygen --without-system-libebook --without-system-libetonyek --without-system-libfreehand --without-system-libodfgen --without-system-libmwaw  --without-system-libcmis --without-system-libabw --without-system-firebird --without-system-mdds --without-system-graphite --without-system-orcus --without-system-lpsolve --disable-gstreamer-0-10 --without-system-boost ﻿--disable-dbus --disable-gconf --with-parallelism


Compiling libreoffice 4.0 series:
--------------------------------
    ./autogen.sh CC=clang CXX=clang++ --build=x86_64-linux-gnu --host=x86_64-linux-gnu  --target=x86_64-linux-gnu  --enable-gtk3 --without-system-libs --without-java --without-doxygen  --without-system-libcmis --without-system-mdds --without-system-graphite --without-system-orcus --without-system-lpsolve --disable-gstreamer-0-10 --without-system-boost --disable-dbus --disable-gconf --disable-cups --without-system-libxml --with-system-cairo --with-boost-date-time  --with-boost-system --disable-python   --with-parallelism --without-helppack-integration --without-myspell-dicts

Compiling 3.5.7.2
-----------------
    ./autogen.sh --build=x86_64-linux-gnu --host=x86_64-linux-gnu  --target=x86_64-linux-gnu  --enable-gtk3 --without-system-libs --without-java --without-doxygen  --without-system-libcmis --without-system-mdds --without-system-graphite --without-system-orcus --without-system-lpsolve --disable-gstreamer --without-system-boost --disable-dbus --disable-gconf --disable-cups --without-system-libxml --with-system-cairo --with-boost-date-time  --with-boost-system --disable-python   --with-parallelism --without-helppack-integration --without-myspell-dicts --without-system-openssl --disable-mozilla --disable-odk --disable-mathmldtd --disable-neon --enable-icecream --disable-nsplugin --disable-postgresql-sdbc --disable-ldap

