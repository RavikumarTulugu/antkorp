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

#include <boost/interprocess/sync/sharable_lock.hpp>
#include <boost/interprocess/sync/scoped_lock.hpp>
#include <boost/interprocess/sync/named_upgradable_mutex.hpp>
#include <boost/interprocess/managed_shared_memory.hpp>
#include <boost/interprocess/containers/map.hpp>
#include <boost/interprocess/allocators/allocator.hpp>
#include <boost/interprocess/containers/string.hpp>
#include <functional>
#include <utility>
#include "akorpdefs.h"
#include "ocache.hh"
#include "log.hh"

//Donot be fooled by the simple and small code in this file. much of the heavy 
//duty is done inside the boost library.
//example taken from the code @ 
//http://www.boost.org/doc/libs/1_51_0/doc/html/interprocess/quick_guide.html#interprocess.quick_guide.qg_interprocess_map
//XXX: for storing strings in the ocache use boost::interprocess::basic_string instead of std::string
//FIXME: replace all mutexes with robust mutexes on linux 
using namespace boost::interprocess;
boost::interprocess::permissions perms(0660);
static managed_shared_memory ocache(open_or_create, 
        AKORP_OBJECT_CACHE, 
        AKORP_OBJECT_CACHE_SIZE, 
        nullptr, 
        perms);

//Typedefinitions for the character and string allocation in the shared memory.
typedef boost::interprocess::allocator<char, \
boost::interprocess::managed_shared_memory::segment_manager> \
shmCharAllocatorT;

typedef boost::interprocess::basic_string<char, std::char_traits<char>, \
shmCharAllocatorT> shmStringT;

typedef boost::interprocess::allocator<shmStringT, \
boost::interprocess::managed_shared_memory::segment_manager> \
shmStringAllocatorT;

//Session map related type definitions and variables
//given a uid the map element returns the corresponding gid and clientId pair.
typedef std::pair<const int, std::pair<const int, int>> sessionValueT;
typedef boost::interprocess::allocator<sessionValueT, \
boost::interprocess::managed_shared_memory::segment_manager> \
sessionAllocatorT; 

typedef map<int, std::pair<const int, int>, std::less<int>, \
sessionAllocatorT> sessionMapT; //create an allocator of the above type

typedef std::pair<const int, shmStringT> nameTupleT;
typedef boost::interprocess::allocator<nameTupleT, \
managed_shared_memory::segment_manager> nameTupleAllocatorT;
typedef map<int, shmStringT, std::less<int>, nameTupleAllocatorT> nameMapT;

typedef std::pair<const int, int> membershipTupleT;
typedef boost::interprocess::allocator<membershipTupleT, \
boost::interprocess::managed_shared_memory::segment_manager> \
memberTupleAllocatorT; 
typedef map<int, int, std::less<int>, memberTupleAllocatorT> membershipMapT;

//instantiate all the allocators , remember the order.
//static shmCharAllocatorT shmCharAllocator(ocache.get_segment_manager());
static shmStringAllocatorT shmStringAllocator(ocache.get_segment_manager());
static nameTupleAllocatorT nameTupleAllocator(ocache.get_segment_manager());
static sessionAllocatorT sessionAllocator(ocache.get_segment_manager());
static memberTupleAllocatorT membershipAllocator(ocache.get_segment_manager());

//read write support mutex to protect the session map
static boost::interprocess::named_upgradable_mutex \
sessionMapMutex(boost::interprocess::open_or_create, OCACHE_SESSION_MAP_LOCK);
static boost::interprocess::named_upgradable_mutex \
unameMapMutex(boost::interprocess::open_or_create, OCACHE_UNAME_MAP_LOCK);
static boost::interprocess::named_upgradable_mutex \
gnameMapMutex(boost::interprocess::open_or_create, OCACHE_GNAME_MAP_LOCK);
static boost::interprocess::named_upgradable_mutex \
membershipMapMutex(boost::interprocess::open_or_create, OCACHE_MEMBERSHIP_MAP_LOCK);

static sessionMapT *sessionMap = nullptr;//should only be called by the akorp_auth on its startup
static nameMapT *unameMap = nullptr; //xlate uid to uname
static nameMapT *gnameMap = nullptr; //xlate gid to gname
static membershipMapT *membershipMap = nullptr;

//create the uname map.
void
createUnameMap(void)
{
	assert(!unameMap);
	try 
	{
        unameMap = ocache.find_or_construct<nameMapT>
            (OCACHE_UNAME_MAP)(std::less<int>(), 
                    nameTupleAllocator);
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//Add a mapping pair of uname and uid in to the uname map.
void 
addUnameAndUid(int uid, std::string _uname)
{
	try 
	{
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(unameMapMutex);
		if (!unameMap) createUnameMap();
		shmStringT uname(_uname.c_str(), shmStringAllocator);
		unameMap->insert(nameMapT::value_type(std::make_pair(uid, uname)));
	}
	catch(boost::interprocess::interprocess_exception &ex)
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//get the associated uname from the map given the uid.
//return an empty string with length 0 if there is no 
//mapping found.
std::string
getUnameForUid(int uid)
{
	try 
	{
        boost::interprocess::sharable_lock<boost::interprocess::named_upgradable_mutex> \
            lock(unameMapMutex);
        if (!unameMap) createUnameMap();
        std::string uname;
        for(nameMapT::iterator itr = unameMap->begin(); 
                itr != unameMap->end(); 
                itr++)
            if ((*itr).first == uid){ 
                uname = (*itr).second.c_str(); 
                break; 
            }
		return uname;
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
}

//remove the mapping for the uid from the uname map 
//if present.
void 
delUnameAndUid(int uid)
{
	try 
	{
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(unameMapMutex);
		if (!unameMap) createUnameMap();
		nameMapT::iterator itr = unameMap->begin(); 
		while(itr != unameMap->end()){
			if ((*itr).first == uid){
				_info<<"delUnameAndUid: deleted tuple for uid: "<<uid;
				nameMapT::iterator tItr = itr;
				++itr;
				unameMap->erase(tItr);
				return;
			}else{
				itr++;
			}
		}
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//create the gname map.
void
createGnameMap(void)
{
	assert(!gnameMap);
	try 
	{
        gnameMap = ocache.find_or_construct<nameMapT>
            (OCACHE_GNAME_MAP)(std::less<int>(), nameTupleAllocator);
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//Add a mapping pair of gname and gid in to the gname map.
void 
addGnameAndGid(int gid, std::string _gname)
{
	try 
	{	
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(gnameMapMutex);
		if (!gnameMap) createGnameMap();
		shmStringT gname(_gname.c_str(), shmStringAllocator);
		gnameMap->insert(nameMapT::value_type(std::make_pair(gid, gname)));
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//get the associated gname from the map given the gid.
//return an empty string with length 0 if there is no 
//mapping found.
std::string
getGnameForGid(int gid)
{
	try 
	{
        boost::interprocess::sharable_lock<boost::interprocess::named_upgradable_mutex> \
            lock(gnameMapMutex);
        if (!gnameMap) createGnameMap();
        std::string gname;
        for(nameMapT::iterator itr = gnameMap->begin(); 
                itr != gnameMap->end(); 
                itr++)
            if ((*itr).first == gid){ 
                gname = (*itr).second.c_str(); 
                break; 
            }
        return gname;
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
}

//remove the mapping pair from the gname map if present any.
void 
delGnameAndGid(int gid)
{
	try 
	{
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(gnameMapMutex);
		if (!gnameMap) createGnameMap();
		nameMapT::iterator itr = gnameMap->begin(); 
		while(itr != gnameMap->end()){
			if ((*itr).first == gid){
				_info<<"delGnameAndGid: deleted tuple for uid: "<<gid;
				nameMapT::iterator tItr = itr;
				++itr;
				gnameMap->erase(tItr);
				return;
			}else{
				itr++;
			}
		}
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//create the session map should only be called by the akorp_auth service.
void
createSessionMap(void)
{
	assert(!sessionMap);
	try 
	{
        sessionMap = ocache.find_or_construct<sessionMapT>(OCACHE_SESSION_MAP)
            (std::less<int>(), 
             sessionAllocator);
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception "<<ex.what(); 
		throw ex;
	}
	return;
}

//Try to get the reference to the session map reference.
sessionMapT* getSessionMapRef(void) { return sessionMap; }

//get the clientid given the uid of the user
int
getClientIdForUid(const int uid)
{
	try 
	{
        boost::interprocess::sharable_lock<boost::interprocess::named_upgradable_mutex> \
            lock(sessionMapMutex);
		if (!sessionMap) createSessionMap();
		assert(sessionMap);
        for(sessionMapT::iterator itr = sessionMap->begin(); 
                itr != sessionMap->end(); 
                itr++)
            if ((*itr).first == uid) 
                return ((*itr).second).second;
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	_error<<"getClientIdForUid:failed to find clientid for uid: "<<uid;
	return 0;
}

//get the uid for the given clientid
int
getUidForClientId(const int clientId)
{
	try 
	{
        boost::interprocess::sharable_lock<boost::interprocess::named_upgradable_mutex> \
            lock(sessionMapMutex);
        if (!sessionMap) createSessionMap();
        assert(sessionMap);
        for(sessionMapT::iterator itr = sessionMap->begin(); 
                itr != sessionMap->end(); 
                itr++)
            if (((*itr).second).second == clientId) 
                return (*itr).first;
    }
    catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	_error<<"getUidForClientId:failed to find uid for clientid: "<<clientId;
	return 0;
}

//store a mapping in to the session map
void
putSession(const int uid, const int clientId, const int gid)
{
	try 
	{
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(sessionMapMutex);
		if (!sessionMap) createSessionMap();
		assert(sessionMap);
        sessionMap->insert(sessionMapT::value_type(
                    std::make_pair(uid, 
                        std::make_pair(gid, clientId))));
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//delete a tuple from the session map
void
delSession(const int uid)
{
	try 
	{
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(sessionMapMutex);
		if (!sessionMap) createSessionMap();
		assert(sessionMap);
		sessionMapT::iterator itr = sessionMap->begin(); 
		while(itr != sessionMap->end()) {
			if ((*itr).first == uid) {
				_info<<"delSession:deleted tuple for uid: "<<uid;
				sessionMapT::iterator tItr = itr;
				++itr;
				sessionMap->erase(tItr);
				return;
			} else {
				itr++;
			}
		}
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	_error<<"delSession:failed to delete tuple for uid: "<<uid;
	return;
}

//delete a tuple from the session map
void
delSessionByClientId(const int cid)
{
	try 
	{
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(sessionMapMutex);
		if (!sessionMap) createSessionMap();
		assert(sessionMap);
		sessionMapT::iterator itr = sessionMap->begin(); 
		while(itr != sessionMap->end()){
			if (((*itr).second).second == cid){
				_info<<"delSession:deleted tuple for clientid: "<<cid;
				sessionMapT::iterator tItr = itr;
				++itr;
				sessionMap->erase(tItr);
				return;
			}else{
				itr++;
			}
		}
	}
	catch(boost::interprocess::interprocess_exception &ex)
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	_error<<"delSession:failed to delete tuple for clientid: "<<cid;
	return;
}

void
printSessionTbl(void)
{
	try 
	{
        boost::interprocess::sharable_lock<boost::interprocess::named_upgradable_mutex> \
            lock(sessionMapMutex);
		if (!sessionMap) createSessionMap();
		assert(sessionMap);
        for(sessionMapT::iterator itr = sessionMap->begin(); 
                itr != sessionMap->end(); 
                itr++)
            _info<<"uid:"<<(*itr).first<<
                " clientid:"<<((*itr).second).second<<
                " gid:"<<((*itr).second).first;
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//delete all the entries from the session table.
void
delSessionTbl(void)
{
	try 
	{
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(sessionMapMutex);
		if (!sessionMap) createSessionMap();
		assert(sessionMap);
        for(sessionMapT::iterator itr = sessionMap->begin(); 
                itr != sessionMap->end(); 
                itr++)
			sessionMap->erase(itr);
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
	return;
}

//FIXME: rewrite this as map of tuples.
//create the membership map if not present.
void 
createMembershipMap()
{
	try 
	{
        assert(!membershipMap);
        membershipMap = ocache.find_or_construct<membershipMapT>(OCACHE_MEMBERSHIP_MAP)
            (std::less<int>(), 
             membershipAllocator);
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
    return;
}

//populated by the auth daemon and used by all the services to check the membership 
//of the user, pretty heavily used by all the services.
void 
addUidAndGidMapping(int uid, int gid)
{
	try 
	{
        if(!membershipMap) createMembershipMap();
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex> \
            lock(membershipMapMutex);
		membershipMap->insert(membershipMapT::value_type(std::make_pair(uid, gid)));
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
    return;
}

void 
delUidAndGidMapping(int uid, int gid)
{
	try 
	{
        if(!membershipMap) createMembershipMap();
        boost::interprocess::scoped_lock<boost::interprocess::named_upgradable_mutex>\
            lock(membershipMapMutex);
		membershipMapT::iterator itr = membershipMap->begin(); 
        while(itr != membershipMap->end()){
            if ((*itr).first == uid){
                _info<<"delUidAndGidMapping:deleted tuple for uid: "<<uid;
                membershipMapT::iterator tItr = itr;
                ++itr;
                membershipMap->erase(tItr);
                return;
            }else{
                itr++;
            }
        }
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
    return;
}

bool
isGroupMember(int uid, int gid)
{
	try 
	{
        if(!membershipMap) createMembershipMap();
        boost::interprocess::sharable_lock<boost::interprocess::named_upgradable_mutex>\
            lock(membershipMapMutex);
		membershipMapT::iterator itr = membershipMap->begin();
        while(itr != membershipMap->end()){
            if (((*itr).first == uid) && ((*itr).second == gid)) 
                return true;
            else
                itr++;
        }
	}
	catch(boost::interprocess::interprocess_exception &ex) 
	{
		_error<<__FUNCTION__<<"() caught boost interprocess exception."<<ex.what(); 
		throw ex;
	}
	catch(std::exception &ex)
	{
		_error<<__FUNCTION__<<"() caught standard exception."<<ex.what(); 
		throw ex;
	}
    return false;
}
