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
#ifndef __INC_AKORP_DEFS_H__
#define __INC_AKORP_DEFS_H__

//XXX: Just declare only things which are shared between C and C++ code. 
//This header is included by both C and C++ code.
#define AKORP_SVC_ENDPOINT "/tmp/akorp_svc_endpoint"
#define AKORP_GW_ENDPOINT  "akorp_gw_endpoint"
#define AKORP_GW_MQ_NAME   "/ngw.mq"

#define FILE_MANAGER_SERVICE_TAG "fmgr"
#define DOC_MANAGER_SERVICE_TAG  "dmgr"

#define OPTIMAL_BUF_SIZE 		 (1024*256)
#define AKORP_OBJECT_CACHE 	"akorp_object_cache1" 
#define AKORP_OBJECT_CACHE_SIZE (1024*1024*512)
#define OCACHE_SESSION_MAP		"ocache_session_map"
#define OCACHE_SESSION_MAP_LOCK "ocache_session_map_lock"
#define OCACHE_UNAME_MAP		"ocache_uname_map"
#define OCACHE_UNAME_MAP_LOCK 	"ocache_uname_map_lock"
#define OCACHE_GNAME_MAP		"ocache_gname_map"
#define OCACHE_GNAME_MAP_LOCK 	"ocache_gname_map_lock"
#define OCACHE_MEMBERSHIP_MAP   "ocache_membership_map"
#define OCACHE_MEMBERSHIP_MAP_LOCK "ocache_membership_map_lock"
#define MAX_SERVICE_NAME_LEN	 (32)
#define MAX_GROUPS_PER_USER		 (128)
#define POPEN_PARENT_CHILD_SYNCH_MUTEX_NAME "popenSynchMutex"
#define FILE_ATTRIB_META_DATA   "user.file.meta"
#define MAX_LIMITED_CONNECTION_COUNT 10

//converts a const pointer to non const pointer 
//NOTE: This is just a hack to pass C strings to C++ code and viceversa,
//if you try to modify the contents after converting const to nonconst 
//the os will throw a segfault at you.
#define nonconst(userptr) ({ union uptr { const char* cptr; char *ptr; } u; u.cptr = (userptr); (u.ptr); })

//Some definitions for the debug and trace framework 
/*
   Debug levels defined. 
   */
#define PANIC  0x0 
#define FATAL  0x1
#define ERROR  0x2
#define WARN   0x3 
#define INFO   0x4 
#define SYSERR 0x5 

/*
   Module id is a bit in the bitmap moddbg.
   */
#define NULL_MOD_ID (0x0)
#define WILD_CARD   (0xffffffff)

/*
   logging options whether to log to file or console or both.
   code in daemon mode is not supposed to log to console. 
   */
#define WRITE_TO_CONSOLE (0x1<<1)
#define WRITE_TO_SYSLOG  (0x1<<2)

#endif 
