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

//shared memory utilities which are used to store objects in the shared memory
//cache.
#ifndef __INC_OCACHE_HH 
#define __INC_OCACHE_HH

extern int getClientIdForUid(const int uid);
extern int getUidForClientId(const int clientId);
extern void putAddress(const int uid, const int clientId, const int gid);
extern void putSession(const int uid, const int clientId, const int gid);
extern void delSession(const int uid);
extern void delSessionByClientId(const int cnid);
extern void printSessionTbl(void);
extern void delSessionTbl(void);
extern void addGnameAndGid(int gid, std::string _gname);
extern void addUnameAndUid(int uid, std::string _uname);
extern std::string getGnameForGid(int gid);
extern std::string getUnameForUid(int uid);
extern bool isGroupMember(int uid, int gid);
extern void addUidAndGidMapping(int uid, int gid);
extern void delUidAndGidMapping(int uid, int gid);
#endif 
