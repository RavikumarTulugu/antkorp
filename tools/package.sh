#!/bin/bash
#-----------
#/****************************************************************
# * Copyright (c) Neptunium Pvt Ltd., 2014.
# * Author: Neptunium Pvt Ltd..
# *
# * This unpublished material is proprietary to Neptunium Pvt Ltd..
# * All rights reserved. The methods and techniques described herein 
# * are considered trade secrets and/or confidential. Reproduction or 
# * distribution, in whole or in part, is forbidden except by express 
# * written permission of Neptunium.
# ****************************************************************/

if [ "$#" -ne 3 ]; then
  echo "Usage: package.sh (--deb | --rpm ) srcdir packagename ";
  exit 1
fi

echo "Calculating shared library dependencies.."
find $2 -type f -perm /a+x -exec ldd {} \; \
| grep so \
| sed -e '/^[^\t]/ d' \
| sed -e 's/\t//' \
| sed -e 's/.*=..//' \
| sed -e 's/ (0.*)//' \
| sort \
| uniq \
| sort -n \
| grep -v "not found" >> lib.list; 

case "$1" in
    --deb)
    dest_dir="$3";
       ;;

    --rpm)
    dest_dir="$HOME/rpmbuild";
        ;;
esac

#common logic for debian and rpm packages.
echo "Creating directory layout."
mkdir $dest_dir
mkdir -p $dest_dir/opt/
mkdir -p $dest_dir/opt/antkorp/
mkdir -p $dest_dir/opt/antkorp/certs/
mkdir -p $dest_dir/opt/antkorp/custom/
mkdir -p $dest_dir/opt/antkorp/custom/bin/
mkdir -p $dest_dir/opt/antkorp/custom/lib/
mkdir -p $dest_dir/opt/antkorp/custom/lua/
mkdir -p $dest_dir/opt/antkorp/foreign/
mkdir -p $dest_dir/opt/antkorp/foreign/bin/
mkdir -p $dest_dir/opt/antkorp/foreign/lib/
mkdir -p $dest_dir/opt/antkorp/foreign/lua/
mkdir -p $dest_dir/opt/antkorp/opensource/
mkdir -p $dest_dir/etc/
mkdir -p $dest_dir/etc/init/
mkdir -p $dest_dir/etc/antkorp/
mkdir -p $dest_dir/var/www/antkorp/
mkdir -p $dest_dir/var/log/antkorp/
mkdir -p $dest_dir/home/antkorp

echo "Copying files to package directories."
#copy the lua modules and their .so files.
cp -R /usr/local/lib/lua $dest_dir/opt/antkorp/foreign/lib/
cp -R /usr/local/share/lua $dest_dir/opt/antkorp/foreign/

#copy the antkorp 3rdparty libraries and modules and executables to foreign.
cp $2/3party/lualdap-1.1.0/src/lualdap.so $dest_dir/opt/antkorp/foreign/lib/
cp $2/3party/lua-gd/gd.so $dest_dir/opt/antkorp/foreign/lib/
cp $2/3party/luamongo-master/mongo.so $dest_dir/opt/antkorp/foreign/lib/
cp $2/3party/jemalloc-3.4.1/lib/libjemalloc.so.1 $dest_dir/opt/antkorp/foreign/lib/libjemalloc.so
cp $2/3party/jq-1.3/jq $dest_dir/opt/antkorp/foreign/bin/

#cp $2/3party/gtk+-3.12.1/gdk/broadway/broadwayd $dest_dir/opt/antkorp/foreign/bin/
#cp $2/3party/gtk+-3.12.1/gtk/.libs/lt-gtk-query-immodules-3.0 $dest_dir/opt/antkorp/foreign/bin/
#cp $2/3party/gtk+-3.12.1/gtk/.libs/gtk-query-immodules-3.0 $dest_dir/opt/antkorp/foreign/bin/
#cp $2/3party/gtk+-3.12.1/gtk/.libs/gtk-launch $dest_dir/opt/antkorp/foreign/bin/
#cp $2/3party/gtk+-3.12.1/gtk/.libs/*.so* $dest_dir/opt/antkorp/foreign/lib/
#cp $2/3party/gtk+-3.12.1/gtk/.libs/*.la $dest_dir/opt/antkorp/foreign/lib/
#cp $2/3party/gtk+-3.12.1/gdk/.libs/*.so* $dest_dir/opt/antkorp/foreign/lib/
#cp $2/3party/gtk+-3.12.1/gdk/.libs/*.la $dest_dir/opt/antkorp/foreign/lib/
#cp $2/3party/gtk+-3.12.1/libgail-util/.libs/libgailutil-3.so $dest_dir/opt/antkorp/foreign/lib/
#cp $2/3party/gtk+-3.12.1/modules/input/.libs/*.so $dest_dir/opt/antkorp/foreign/lib/
#cp $2/3party/gtk+-3.12.1/modules/printbackends/lpr/.libs/libprintbackend-lpr.so $dest_dir/opt/antkorp/foreign/lib/
#cp $2/3party/gtk+-3.12.1/modules/printbackends/file/.libs/libprintbackend-file.so $dest_dir/opt/antkorp/foreign/lib/
#cp $2/3party/gtk+-3.12.1/modules/printbackends/file/.libs/libprintbackend-file.so $dest_dir/opt/antkorp/foreign/lib/

#copy the antkorp libraries and executables 
cp $2/server/src/obj/akorp_ngw $dest_dir/opt/antkorp/custom/bin/ 
#cp $2/server/src/obj/akorp_broadway_tunneld $dest_dir/opt/antkorp/custom/bin/ 
cp $2/server/src/obj/akorp_fmgr $dest_dir/opt/antkorp/custom/bin/
cp $2/server/src/obj/clntsim $dest_dir/opt/antkorp/custom/bin/
cp $2/server/src/obj/fattr $dest_dir/opt/antkorp/custom/bin/
cp $2/server/src/obj/*.so $dest_dir/opt/antkorp/custom/lib/

#minify the lua source code and then copy the minified files to the custom 
#directory in the package.
#we have problems with the luaminifier with the starting interpreter line 
#so we remove the interpreter line and prepend it in the output file.
echo "Minifying javascript code.";
cd $2/client/src/antkorp;
grunt build;
cd -
echo "Minifying antkorp lua code.";
export LUA_PATH="$2/3party/LuaMinify-master/?.lua"
lua $2/3party/LuaMinify-master/CommandLineMinify.lua $2/server/src/lua/akorp_auth $dest_dir/opt/antkorp/custom/lua/akorp_auth
lua $2/3party/LuaMinify-master/CommandLineMinify.lua $2/server/src/lua/akorp_kons $dest_dir/opt/antkorp/custom/lua/akorp_kons
lua $2/3party/LuaMinify-master/CommandLineMinify.lua $2/server/src/lua/akorp_rtc $dest_dir/opt/antkorp/custom/lua/akorp_rtc
lua $2/3party/LuaMinify-master/CommandLineMinify.lua $2/server/src/lua/akorp_cron $dest_dir/opt/antkorp/custom/lua/akorp_cron
lua $2/3party/LuaMinify-master/CommandLineMinify.lua $2/server/src/lua/fmgr.lua $dest_dir/opt/antkorp/custom/lua/fmgr.lua
lua $2/3party/LuaMinify-master/CommandLineMinify.lua $2/server/src/lua/akorp_utils.lua $dest_dir/opt/antkorp/custom/lua/akorp_utils.lua
lua $2/3party/LuaMinify-master/CommandLineMinify.lua $2/server/src/lua/akorp_common.lua $dest_dir/opt/antkorp/custom/lua/akorp_common.lua
lua $2/3party/LuaMinify-master/CommandLineMinify.lua $2/server/src/lua/config.lua $dest_dir/opt/antkorp/custom/lua/config.lua

#echo "Generating certificates ..";
#openssl req -newkey rsa:2048 -new -x509 -subj "/C=IN/ST=KA/L=Bangalore/O=Dis/CN=www.nobody.com" -days XXX -nodes -out selfsigned.pem -keyout selfsigned.key 
#rc=$?
#if [[ $rc != 0 ]] ; then
#    echo "There was an error generating certificate and keyfiles, aborting packaging";
#    exit $rc 
#fi

echo "Copying files to package ...";
cp $2/certs/selfsigned.pem $dest_dir/opt/antkorp/certs/
cp $2/certs/selfsigned.key $dest_dir/opt/antkorp/certs/
cp $2/server/src/lua/stack_trace_plus.lua $dest_dir/opt/antkorp/custom/lua/
cp $2/init/upstart/antkorp.conf $dest_dir/etc/init/
cp $2/init/upstart/antkorp_ngw.conf $dest_dir/etc/init/
cp $2/init/upstart/antkorp_fmgr.conf $dest_dir/etc/init/
cp $2/init/upstart/antkorp_auth.conf $dest_dir/etc/init/
cp $2/init/upstart/antkorp_kons.conf $dest_dir/etc/init/
cp $2/init/upstart/antkorp_cron.conf $dest_dir/etc/init/
cp $2/init/upstart/antkorp_rtc.conf $dest_dir/etc/init/
#cp $2/init/upstart/antkorp_broadway.conf $dest_dir/etc/init/
#cp $2/init/upstart/antkorp_broadway_tunnel.conf $dest_dir/etc/init/
cp -R $2/client/src/antkorp/dist/*  $dest_dir/var/www/antkorp/
cp $2/license  $dest_dir/opt/antkorp/
cp $2/legal $dest_dir/opt/antkorp/
cp $2/eula.txt $dest_dir/opt/antkorp/
cp $2/release_notes.txt $dest_dir/opt/antkorp/
cp $2/tools/configui.sh $dest_dir/opt/antkorp/custom/bin/
cp $2/tools/createfirstorg.sh $dest_dir/opt/antkorp/custom/bin/
cp $2/tools/admin_passwd_reset.sh $dest_dir/opt/antkorp/custom/bin/
cp $2/tools/preinstall.sh $dest_dir/opt/antkorp/custom/bin/
cp $2/tools/postinstall.sh $dest_dir/opt/antkorp/custom/bin/
cp $2/tools/preremove.sh $dest_dir/opt/antkorp/custom/bin/
cp $2/tools/postremove.sh $dest_dir/opt/antkorp/custom/bin/
#copy all the foreign libraries.
for i in $(cat lib.list); do
    cp $i $dest_dir/opt/antkorp/foreign/lib/
done

#copy any opensource code modified by antkorp to the opensource folder in the package.
cp $2/patches/* $dest_dir/opt/antkorp/opensource/

case "$1" in 
    --deb)
	mkdir -p $dest_dir/DEBIAN/
	cp $2/deb/* $dest_dir/DEBIAN/
	chmod 0555 $dest_dir/DEBIAN/preinst $dest_dir/DEBIAN/postinst $dest_dir/DEBIAN/prerm $dest_dir/DEBIAN/postrm 
    echo "Building DEB package.";
	dpkg -b $dest_dir $dest_dir.deb
    ;;
 
    --rpm)
    for i in BUILD RPMS SOURCES SPECS SRPMS tmp; do 
        mkdir -p $dest_dir/${i};
    done
    echo "Building RPM package ..";
    rpmbuild --noclean --nocheck -bb $2/rpm/antkorp.spec --buildroot $dest_dir --target x86_64 --define "_topdir $dest_dir"
    cp $dest_dir/RPMS/x86_64/*.rpm $3.rpm
    echo "Cleaning up build directory";
    echo "package building completed.";
    ;;
esac 

echo "cleaning up build directory";
rm -rf $dest_dir;
rm -rf lib.list;
