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

#ifndef __INC_NFMGR_H__
#define __INC_NFMGR_H__
#include "JSON_Base64.h"
#include "common.hh"
#include <attr/xattr.h>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <boost/uuid/uuid_generators.hpp>

static inline std::string
genuuid()
{
    boost::uuids::uuid _u = boost::uuids::random_generator()();
    const std::string uidstr = boost::lexical_cast<std::string>(_u);
    return uidstr;
}

class fileAttribRecord
{
    public:
    int                         locked = false;
    int                         isPrivate = false;
    int                         isShared = false;
    int                         version = 0;
    std::string 				fqpn = "";
    std::string                 oid = ""; 
    std::string 				state = "open";
    std::string                 kons = "";
    std::string                 description = "";
    int 				        markedPrivateBy = 0;
    int 				        lockedBy = 0;
    int 				        ownerUid = 0;
    int 				        ownerGid = 0;
    std::vector<int>   			followers; //list of users who are following the file.
    std::vector<int>   			groupsSharedWith; //list of gids with which the file is shared with.
    std::vector<int>   			usersSharedWith; //list of uids with which the file is shared with.
    std::vector<std::string>    taglist;
    //XXX:
    //Since json doesnt have support for 32 bit unsigned and 64 bit integers
    //we store the uint64 as 2 int32_t's.
    int32_t                     folderLimitMsb;
    int32_t                     folderLimitLsb = 1073741824;
    int32_t                     folderUsageMsb;
    int32_t                     folderUsageLsb;

    static std::string
        toJson(fileAttribRecord &fattr)
        {
            JSONNode fileAttribNode(JSON_NODE);
            tupl tv[] = 
            {
                {"locked", fattr.locked},
                {"isPrivate", fattr.isPrivate},
                {"version", fattr.version},
                {"fqpn", fattr.fqpn},
                {"state", fattr.state},
                {"kons", fattr.kons},
                {"description", fattr.description},
                {"markedPrivateBy", fattr.markedPrivateBy},
                {"lockedBy", fattr.lockedBy},
                {"ownerUid", fattr.ownerUid},
                {"ownerGid", fattr.ownerGid},
                {"folderLimitMsb", fattr.folderLimitMsb},
                {"folderLimitLsb", fattr.folderLimitLsb},
                {"folderUsageMsb", fattr.folderUsageMsb},
                {"folderUsageLsb", fattr.folderUsageLsb}
            };
            JSONNode followersArray(JSON_ARRAY);
            followersArray.set_name("followers");
            for(auto &itr : fattr.followers) followersArray.push_back(JSONNode("", itr));
            fileAttribNode.push_back(followersArray);

            JSONNode taglistArray(JSON_ARRAY);
            taglistArray.set_name("taglist");
            for(auto &itr : fattr.taglist) taglistArray.push_back(JSONNode("", itr));
            fileAttribNode.push_back(taglistArray);

            JSONNode groupsSharedWithArray(JSON_ARRAY);
            groupsSharedWithArray.set_name("groupssharedwith");
            for(auto &itr : fattr.groupsSharedWith) groupsSharedWithArray.push_back(JSONNode("", itr));
            fileAttribNode.push_back(groupsSharedWithArray);

            JSONNode usersSharedWithArray(JSON_ARRAY);
            usersSharedWithArray.set_name("userssharedwith");
            for(auto &itr : fattr.usersSharedWith) usersSharedWithArray.push_back(JSONNode("", itr));
            fileAttribNode.push_back(usersSharedWithArray);

            return putJsonVal(tv, sizeof(tv)/sizeof(tupl), fileAttribNode);
        }

    static fileAttribRecord
        fromJson(std::string &json)
        {
            fileAttribRecord fattr;
            tupl tv[] = 
            {
                {"locked", &fattr.locked},
                {"isPrivate", &fattr.isPrivate},
                {"version", &fattr.version},
                {"fqpn", &fattr.fqpn},
                {"state", &fattr.state},
                {"kons", &fattr.kons},
                {"description", &fattr.description},
                {"markedPrivateBy", &fattr.markedPrivateBy},
                {"lockedBy", &fattr.lockedBy},
                {"ownerUid", &fattr.ownerUid},
                {"ownerGid", &fattr.ownerGid},
                {"folderLimitMsb", &fattr.folderLimitMsb},
                {"folderLimitLsb", &fattr.folderLimitLsb},
                {"folderUsageMsb", &fattr.folderUsageMsb},
                {"folderUsageLsb", &fattr.folderUsageLsb}
            };
            JSONNode n = libjson::parse(json);
            unsigned int sz = sizeof(tv)/sizeof(tupl);
            getJsonVal(n, tv, sz);

            JSONNode::const_iterator tItr = n.end(), fItr = n.end(), uItr = n.end(), gItr = n.end();
            for(JSONNode::const_iterator i = n.begin(); i != n.end(); i++){
                if((i->type() == JSON_ARRAY) && (i->name() == "taglist")) tItr = i;
                if((i->type() == JSON_ARRAY) && (i->name() == "followers")) fItr = i;
                if((i->type() == JSON_ARRAY) && (i->name() == "userssharedwith")) uItr = i;
                if((i->type() == JSON_ARRAY) && (i->name() == "groupssharedwith")) gItr = i;
            }

            if(tItr != n.end()){
                JSONNode array = *tItr;
                for(JSONNode::const_iterator index = array.begin();index != array.end();index++)
                    fattr.taglist.push_back(index->as_string()); 
            }

            if(fItr != n.end()){
                JSONNode array = *fItr;
                for(JSONNode::const_iterator index = array.begin();index != array.end();index++)
                    fattr.followers.push_back(index->as_int()); 
            }

            if(uItr != n.end()){
                JSONNode array = *uItr;
                for(JSONNode::const_iterator index = array.begin();index != array.end();index++)
                    fattr.usersSharedWith.push_back(index->as_int()); 
            }

            if(gItr != n.end()){
                JSONNode array = *gItr;
                for(JSONNode::const_iterator index = array.begin();index != array.end();index++)
                    fattr.groupsSharedWith.push_back(index->as_int()); 
            }
            return fattr;
        }
        
        fileAttribRecord(){ oid = genuuid(); return; }
        ~fileAttribRecord() { return; }
        fileAttribRecord(fileAttribRecord &&copy) :
                locked(copy.locked),
                isPrivate(copy.isPrivate),
                version(copy.version),
                fqpn(std::move(copy.fqpn)),
                state(std::move(copy.state)),
                oid(std::move(copy.oid)),
                kons(std::move(copy.kons)),
                markedPrivateBy(copy.markedPrivateBy),
                lockedBy(copy.lockedBy),
                ownerUid(copy.ownerUid),
                ownerGid(copy.ownerGid),
                folderLimitMsb(copy.folderLimitMsb),
                folderLimitLsb(copy.folderLimitLsb),
                folderUsageMsb(copy.folderUsageMsb),
                folderUsageLsb(copy.folderUsageLsb),
                taglist(std::move(copy.taglist)),
                followers(std::move(copy.followers)),
                usersSharedWith(std::move(copy.usersSharedWith)),
                groupsSharedWith(std::move(copy.groupsSharedWith))
                 { return; }

        fileAttribRecord(fileAttribRecord &copy) :
                locked(copy.locked),
                isPrivate(copy.isPrivate),
                version(copy.version),
                fqpn(copy.fqpn),
                state(copy.state),
                oid(copy.oid),
                kons(copy.kons),
                markedPrivateBy(copy.markedPrivateBy),
                lockedBy(copy.lockedBy),
                ownerUid(copy.ownerUid),
                ownerGid(copy.ownerGid),
                folderLimitMsb(copy.folderLimitMsb),
                folderLimitLsb(copy.folderLimitLsb),
                folderUsageMsb(copy.folderUsageMsb),
                folderUsageLsb(copy.folderUsageLsb),
                taglist(copy.taglist),
                followers(copy.followers),
                usersSharedWith(copy.usersSharedWith),
                groupsSharedWith(copy.groupsSharedWith)
                 { return; }

        fileAttribRecord operator=(const fileAttribRecord &copy)
        {
            locked = (copy.locked);
            isPrivate = (copy.isPrivate);
            version = (copy.version);
            fqpn = (copy.fqpn);
            state = (copy.state);
            oid = (copy.oid);
            kons = (copy.kons);
            markedPrivateBy = (copy.markedPrivateBy);
            lockedBy = (copy.lockedBy);
            ownerUid = (copy.ownerUid);
            ownerGid = (copy.ownerGid);
            folderLimitMsb = (copy.folderLimitMsb);
            folderLimitLsb = (copy.folderLimitLsb);
            folderUsageMsb = (copy.folderUsageMsb);
            folderUsageLsb = (copy.folderUsageLsb);
            taglist = (copy.taglist);
            followers = (copy.followers);
            usersSharedWith = (copy.usersSharedWith);
            groupsSharedWith = (copy.groupsSharedWith);
            return *this;
        }
};

//user land replica of stat.
struct statRecord
{
    bool dirty = true; //dirty bit if its true means a new stat call needs to go to the os.
    struct stat stat = {0}; //actual stat information fetched from the os.
    inline void markDirty() { dirty = true; } //mark the record as dirty.
    bool isDir() { return false; }
};

#endif
