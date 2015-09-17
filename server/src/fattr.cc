/****************************************************************
 * Copyright (c) Neptunium Pvt Ltd., 2014.
 * Author: Neptunium Pvt Ltd..
 *
 * This unpublished material is proprietary to Neptunium Pvt Ltd..
 * All rights reserved. The methods and techniques described herein 
 * are considered trade secrets and/or confidential. Reproduction or 
 * distribution, in whole or in part, is forbidden except by express 
 * written permission of Neptunium.
 ****************************************************************/

#include<iostream>
#include<string>
#include<vector>
#include "common.hh"
#include <sys/types.h>
#include <attr/xattr.h>
#include "nfmgr.hh"

//g++ -std=c++0x -I/home/rk/akorp/server/src/ -I/home/rk/akorp/3party/libjson/ -I/usr/local/include/boost fattr.cc -L/home/rk/akorp/server/src/obj  -lakorp -o fattr
int
main(int ac, char **av)
{
    #if 0
    fileAttribRecord file; 
    file.locked = false; 
    file.isPrivate = false; 
    file.fqpn = "/home/rk/"; 
    file.state ="open"; 
    file.kons ="abcdefghijklmn"; 
    file.markedPrivateBy = 1000; 
    file.lockedBy = 1000; 
    file.ownerUid = 1000; 
    file.ownerGid = 1000;

    file.taglist.push_back("shit");
    file.taglist.push_back("crap");
    file.taglist.push_back("junk");
    file.taglist.push_back("hopeless");

    file.followers.push_back(1000);
    file.followers.push_back(1001);
    file.followers.push_back(1002);
    std::string json = fileAttribRecord::toJson(file);
    std::cerr<<json;
    
    int rc  = setxattr(av[1], "user.file.meta", json.data(), json.length(), 0);
    if(rc < 0){ perror("setxattr failed:"); return -1; }
    std::cerr<<"json.length():"<<json.length();
    json.clear();
    #endif
    std::string json;
    char buf[1024];
    int rc = getxattr(av[1], "user.file.meta", buf, sizeof(buf));
    if(rc < 0){ perror("getxattr failed:"); return -1; }
    std::cerr<<"rc:"<<rc;
    json.assign(buf, rc);
    fileAttribRecord file2 = std::move(fileAttribRecord::fromJson(json));
    std::cerr<<"\nlocked: "<<file2.locked;
    std::cerr<<"\nisPrivate: "<<file2.isPrivate;
    std::cerr<<"\nfqpn: "<<file2.fqpn;
    std::cerr<<"\nstate: "<<file2.state;
    std::cerr<<"\nkons: "<<file2.kons;
    std::cerr<<"\nmarkedPrivateBy: "<<file2.markedPrivateBy;
    std::cerr<<"\nlockedBy: "<<file2.lockedBy;
    std::cerr<<"\nownerUid: "<<file2.ownerUid;
    std::cerr<<"\nownerGid: "<<file2.ownerGid;
    std::cerr<<"\nfollowers: \n";
    for(auto &itr : file2.followers) std::cerr<<itr<<",";
    std::cerr<<"\ntaglist: ";
    for(auto &itr : file2.taglist) std::cerr<<itr<<",";
    std::cerr<<"\nfolderLimitMsb: "<<file2.folderLimitMsb;
    std::cerr<<"\nfolderLimitLsb: "<<file2.folderLimitLsb;
    std::cerr<<"\nfolderUsageMsb: "<<file2.folderUsageMsb;
    std::cerr<<"\nfolderUsageLsb: "<<file2.folderUsageLsb;
    return 0;
}
