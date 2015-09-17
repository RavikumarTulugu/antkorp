--[[
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
]]

--[[
This file is not executable code.
This file contains common class definitions used across all the lua code. 
]]
local json = require ('cjson')
require ('akorp_utils')
require ('luabridge') 
local stp = require ('stack_trace_plus');
debug.traceback = stp.stacktrace;

--[[
Takes the org id and gives the name space of the organization. 
]]
function 
akorp_user_ns()
return "akorpdb.users"; 
end

--[[
Takes the gid and uid of the user in which the feed was requested and returns
the corresponding namespace.
]]
function 
akorp_kons_ns()     
return "akorpdb.kons";
end

--[[
Takes the orgid of the organization which the group belongs to and returns 
the namespace.
]]
function 
akorp_group_ns() 	  
return "akorpdb.groups";
end

--[[
Takes the organization id of the user and returns the organization im namespace.
im messages dont belong to any group. 
]]
function
akorp_im_ns()      
return "akorpdb.im";
end

--[[
Takes the groupid and the uid of the user and returns the corresponding namespace. 
]]
function
akorp_events_ns()    
return "akorpdb.events";
end

--[[
Takes the groupid and the uid of the user and returns the corresponding namespace. 
]]
function
akorp_request_ns()  
return "akorpdb.requests";
end

--[[
Just a static string nothing to compute or findout. 
]]
function
akorp_org_ns()    
return "akorpdb.orgs";
end

--[[
Takes a gid and returns the namespace of the group. 
]]
function
akorp_doc_ns() 
return "akorpdb.docs"; 
end

--[[
Nothing to compute just return the meta object namespace.
]]
function
akorp_meta_ns() 	
return "akorpdb.meta"; 
end

function 
akorp_notif_ns()
return "akorpdb.notif";
end

function 
akorp_activity_ns()
return "akorpdb.activity";
end

--[[ 
object representing the user, all the information pertaining to the user will be
held by this object.
]]
user_object  = {};
user_object.__index = user_object;

--[[ 
object representing the group, all the information pertaining to the group will be
held by this object.
]]
group_object = {};
group_object.__index = group_object;

--[[ 
notification object, on each event there will be a new notification object generated 
and the id of the notification object will be appended to the notification queue of 
the user.
]]
notification_object = {};
notification_object.__index = notification_object;


--[[
request object, on each request a request object is created and enqueued to the requestees
list. up on confirmation the request object is marked as confirmed. requests can be for
things like inviting to the meeting, request access to specific file or folder.
]]
request_object = {};
request_object.__index = request_object;

--[[
konversation object. 
]]
konv_object = {};
konv_object.__index = konv_object;

--[[
document object kind of replica for the C++ object. 
not much used in lua code. 
]]
doc_object = {};
doc_object.__index = doc_object;

--[[
mail object. 
]] 
mail_object = {};
mail_object.__index = mail_object;


--[[
activity object. 
]]
activity_object = {};
activity_object.__index = activity_object;


vevent_object = {};
vevent_object.__index = vevent_object;

im_log_object = {};
im_log_object.__index = im_log_object;

org_object = {};
org_object.__index = org_object;

--[[
constructor for the new user object.
]]
function 
user_object.new()
	local self = {};
    setmetatable(self, user_object);
	self.mark_for_delete = false; -- zombie state and marked for delete.
	self.uid = 0;
    self.org = 0; -- id of the organization we are member of. 
	self.gid = 0; -- primary group of the user.
	self.groups = {}; --list of group ids the user belongs to.
	self.is_active = true; --change it to false on "handle_del_user".
	self.password = ""; --encrypted unicode password string 
    self.salt = ""; -- salt of the password hash.
	self.start_date = ""; --inception date of the member  displayed as "member since " 
	self.login = ""; -- unique login name of the user 
	self.first_name = ""; 
	self.last_name = ""; 
	self.middle_name = "";
	self.dept = ""; -- name of the department 
	self.mob = ""; -- mobile number of the user
	self.work = "";  -- telephone number of work 
	self.home = ""; -- telephone number of home 
	self.fax = "";
	self.sex = "male"; 
	self.interests = {}; -- list of interest tags which user can set, this will help in building context 
	self.pager = ""; 
	self.homeaddress = ""; -- address of the user 
	self.workaddress = ""; -- address of the work 
	self.dob = ""; -- date of birth of user 
	self.organization = ""; -- name of the organization 
	self.homedir = ""; -- home directory of the user 
	self.commithome = ""; -- directory of the svn home for the user 
	self.facebookid = ""; -- facebook id of the user 
	self.status = "offline"; -- status string which can be "online" , "offline" , "busy" 
	self.status_line = ""; -- status line of the user set by the user 
	self.email = ""; --primary email address of the user 
	self.homepage = "";
	self.manager = ""; -- uname of the manager 
	self.info = ""; -- a description of the user set by the user himself 
	self.jobtitle = "";
	self.likes = {}; -- list of likes, this list is a list if konv object ids
	self.like_count = 0; 
	self.dislikes = {}; -- list of dislikes 
	self.dislike_count = 0;
	self.friends = {}; -- list of friends, list is a list of ids 
	self.image_small  = ""; -- image in base 64 encoded form, 16x16
	self.image_medium = ""; -- image in base 64 encoded form, 32x32 
	self.image_large = ""; -- image in base 64 encoded form, 64x64
	self.image_original = ""; -- original image uploaded by the client.
	self.recv_stream = {}; -- in stream of the user 
	self.sent_stream = {}; -- out stream of the user 
	self.sent_kons = {}; -- kons started by the user.
	self.recv_kons = {}; -- recvd by the user
	self.activity_log = {}; -- activity log of the user 
	self.notification_queue = {}; --[[ queue of notifications pending for user, 
								  This should be displayed in a lifo kind of manner ]]
    self.stream_updates = {}; -- updates which are not seen yet by the user. will be
                              -- as and when we get the clear update from the client.
	self.im_log = {}; --[[ list of im_log_objects ]]
	self.offline_mq = {}; --[[ list of instant messages recieved when the user was offline ]]
	self.create_timestamp = luabridge.currenttime(); -- time stamp of creation 
	self.edit_timestamp = "";  --time stamp of last edit
    self.bookmarks = {};
    self.cookie_list = {}; -- list of persistent cookies, we use a list to represent multiple devices.
    self.auth_token = "";
	return self;
end

function 
user_object:update()
local ok, err = db:update(akorp_user_ns(), { uid = self.uid }, self, true, false);
if not ok then
	error(string.format("db:update failed with :%s",err));
	return ok, err;
end
return ok;
end

--[[
constructor for the new group object 
]]
function 
group_object.new()
	local self = {};
    setmetatable(self, group_object);
	self.mark_for_delete = false; -- zombie state and marked for delete.
	self.gid = 0;
    self.organization = ""; -- name of the organization we are member of.
	self.gname = "";  -- name of the group
	self.start_date = ""; -- inception date of the group 
	self.description = "";
	self.admin = 0; -- uid of the administrator of the group.
	self.homedir = ""; -- directory of the group where all group members have read and write permissions.
	self.members = {}; -- list of uids of all members in the group.
	self.member_count = 0; 
	self.join_by_approval = false;  --if the group can be joined only by approval 
	self.pending_approval_list = {}; -- list of users waiting for approval 
	self.stream = {}; -- feed of the group
	self.follower_count = 0; -- number of followers of this group.
	self.followers = {}; --followers are folks who hit the follow button to watch public updates on the group.
	self.tags = {}; -- list of tags to aid in building the context 
	self.create_timestamp = luabridge.currenttime(); -- time stamp of creation 
	self.edit_timestamp = "";  --time stamp of last edit
    self.categories = { "discussion", "question", "share", "news"};
    self.small_image = ""; -- small image thumbnail 
    self.image_medium = ""; -- image in base 64 encoded form, 32x32 
    self.image_large = ""; -- image in base 64 encoded form, 64x64
    self.image_original = ""; -- original image uploaded by the client.
	--XXX: more to come on need basis things like meetings, schedules, events etc.
	return self; 
end

function 
group_object:update()
local ok, err = db:update(akorp_group_ns(), { gid = self.gid }, self, true, false);
if not ok then
	error(string.format("db:update failed with :%s",err));
	return ok, err;
end
return ok;
end

--[[
delete the group object from the mongo database. 
]]
function
group_object_delete(oid)
local ok, err = db:remove(akorp_group_ns(), { gid = oid });
if not ok and err then
	error(string.format("db:remove failed with :%s", err));
	return ok, err;
end
return ok;
end

--[[
constructor for the notification object. 
A user notification is intended for the consumption of the user, it is queued 
to the notification queue of the user and delivered as a form of event to the 
user if the user is online.
This object will be created for each user intended and the id of the object 
will be queued in the notification list of the user. The checked status 
indicates whether the notification is seen by user or not.
]]

--[[
file notifications:
---------------------
files added in directory.
files deleted from directory.
file updated in directory.
files shared.
files share removed.

konversation notifications:
----------------------------
kons added.
kons replied.
kons edited.
kons deleted.
kons locked.
kons unlocked.
users likes kons.
users dislikes kons.

calendar notifications:
-----------------------
meeting invite.
event invite.
reminder.

Task notifications:
--------------------
Task start date today.
Task end date today.
Task assigned to user.
Task deleted.
Subtask assigned.
Subtask deleted.
Task edited.
Subtask edited.

mail notifications: 
-------------------
inmail.

message notifications: 
----------------------
offline message.

]]
function
notification_object.new()
	local self = {};
    setmetatable(self, notification_object);
	self._id = mongo.ObjectId()[1]; -- id of the notification object same as the mongodb ObjectId. 
    self.id = self._id;
    self.owner_gid = 0; -- group id gives the context of things.
    self.notifiers = {}; -- user whose activity has generated the following notification.
	self.timestamp = 0; --timestamp of the notification.
	self.category = ""; -- type of notification, this can be a lot of types.
    self.notiftype = "";  -- the exact type of the notification.
    self.description = ""; -- a more elaborate description which is just displayed.
    self.preview = ""; -- preview text of 100 characters from the kons.
    self.recipients = {}; -- list of uids who are recieving the notification.
    self.kons = 0; -- id of the kons for which notification is queued. 
    self.file = ""; -- directory or location in which there is a change.
    self.date = ""; -- timestamp for which notification is being sent.
    self.vevent = 0; -- id of the vevent calendar object for which the notification is sent.
    self.task = 0; -- id of the task object.
    self.mail = 0; -- id of the mail
    self.checked = {}; -- list of users who have checked the notification.
    self.unchecked = {}; -- list of users who have not yet checked the notification.
    self.hierarchy = {}; -- hierarchy of the kons if the notification is for a kons.
	return self;
end

function
notification_object:update()
local ok, err = db:update(akorp_notif_ns(), { id = self.id }, self, true, false);
if not ok then
	error(string.format("db:update failed with :%s",err));
	return ok, err;
end
return ok;
end

function
getnotifobj(oid)
local notif = db:find_one(akorp_notif_ns(), { id = oid});
if notif then 
    setmetatable(notif, notification_object);
end
return notif;
end

function 
getnotifobjbyquery(querystr)
local notif = db:find_one(akorp_notif_ns(), querystr);
if notif then
    setmetatable(notif, notification_object);
end
return notif;
end

function 
konv_object.new()
	local self = {};
    setmetatable(self, konv_object);
    self._id = mongo.ObjectId()[1];
    self.id = self._id;
	self.owner_uid = 0; -- owner uid of the konv
	self.owner_gid = 0; -- owner gid of the konv
	self.uri = ""; -- uri of the kons object,
	self.has_parent = false; -- root of the tree.
	self.parent = 0; -- id of the immediate parent
    self.root   = 0; -- points to the root of the tree.
    self.category = ""; -- category of the feed.
	self.inline = false; --valid only when parent is valid
	self.inlinepos = 0; --valid only when child is an inline one 
	self.child_count = 0; -- number of children at the next level 
	self.children = {} ; --list of the children at the next level 
	self.likers = {}; 
	self.likecount = 0; 
	self.dislikers = {};
	self.dislikecount = 0;
	self.locked = false;
	self.preview = "" -- preview text which is actually sent while loading the konv
	self.content = ""; -- actual whole content of the konv, sent to the client on demand 
	self.taglist= {}; -- list of the tags which help in indexing the konv 
    self.limited = false; -- if this is a limited multicast.
	self.followers = {};
	self.private = true; --private means restricted only to the group 
    self.activity = 0; --increment this on every action on the konversation object.
	self.recipients = {}; --list of recipients, this is most of the times the members of the group plus some additional ppl. 
						  --list gets populated at the time of creation.
	self.ignorers = {}; -- list of people who ignored this.
	self.create_timestamp = luabridge.currenttime(); -- time stamp of creation 
	self.edit_timestamp = "";  --time stamp of last edit
    self.attachments = {}; -- list of attachments clicking on which will take you to the vault and open the directory location.
    self.favouriters = {}; -- list of users who have favourited this konversation.
    self.trackers = {}; -- list of users who are tracking this, only those users will be sent nofications on any activity.
    self.attached_object = 0; -- object which we are attached to, it can be a file, vevent or a task.
	return self; 
end 

function
konv_object:update()
self.activity = self.activity + 1;
local ok, err = db:update(akorp_kons_ns(), { id = self.id }, self, true, false);
if not ok then
	error(string.format("db:update failed with :%s",err));
	return ok, err;
end
return ok;
end

function 
konv_object_delete(_id)
local ok, err = db:remove(akorp_kons_ns(), { id = _id });
if not ok and err then
    error(string.format("db:remove failed with err=%s", err));
    return;
end
end

--give a new doc object.
function
doc_object.new()
	local self = {};
    setmetatable(self, doc_object);
	self.name = ""; --fully qualified name of the document that is the full path of the file starting from its root dir
	self.checkouts = {}; --list of the users who have checked out this file, each entry will be the uid and the version he checked out.
	self.version = 0; --latest version of the document.
	self.locked = 0; --locked by the owner of the document.
	self.history = {}; --history of the document includes all the comments and timestamps and etc historic details.
	self.permissions = {}; --read and write permissions for specific users and groups.
	return self;
end

function getuserobj(u)
local user = db:find_one(akorp_user_ns(), {uid = u});
if user then 
	setmetatable(user, user_object);
end 
return user;
end

function getgroupobj(g)
local group = db:find_one(akorp_group_ns(), {gid = g});
if group then 
	setmetatable(group, group_object);
end
return group;
end

function getkonvobj(k)
local konv = db:find_one(akorp_kons_ns(), {id = k});
if konv then 
	setmetatable(konv, konv_object);
else
    error("failed to find object with id:", k);
end
return konv;
end

--[[
The im_log of the user will be a list of im_log objects described below. 
let the mongodb append the _id automatically.
]]

function
im_log_object.new()
	local self = {};
    setmetatable(self, im_log_object);
	self.originator = 0; -- originator of the im session.
	self.participants = {}; -- list of audience of the im session minus originator.
	self.timestamp = 0; -- UTC time stamp of the im session origin.
	self.content = {}; -- the whole text log of the im session. this will be of the 
                        -- form { uid : text , uid : text }.
    self.checked = {}; -- dictionary of the participants whether each recipient has checked 
                       -- the message or not. if the recipient is offline then the message 
                       -- is marked as false and it is set to true at the time of the relay.
	return self;
end

--[[
schema courtesy. 
http://wiki.zimbra.com/wiki/Account_mailbox_database_structure.
]]
function 
mail_object.new()
	local self = {};
    setmetatable(self, mail_object);
	self.mailbox_id  = 0;   
	self.id          = 0;  
	self.mtype       = 0; 
	self.parent_id   = 0;
	self.folder_id   = 0; 
	self.index_id    = 0; 
	self.imap_id     = 0; 
	self.date        = 0;
	self.size        = 0;
	self.volume_id   = 0; 
	self.blob_digest = 0; 
	self.unread      = 0;
	self.flags       = 0;
	self.tags        = {};
	self.sender      = "";
	self.subject     = "";
	self.name        = "";
	self.metadata    = "";
	self.mod_metadata = 0;
	self.change_date  = "";
	self.mod_content  = 0;
	return self;
end

--[[
activity object for all kinds of activities. extend this from time to time. 
using the add_new_field utility script. 
]]
function
activity_object.new()
	local self = {};
    setmetatable(self, activity_object);
	self.uid 		   = 0;
	self.gid 		   = 0;
    self._id           = mongo.ObjectId()[1];
    self.id            = self._id;
	self.timestamp 	   = luabridge.currenttime();
	self.activity_type = ""; -- type of the object class which we are tracking, it can be document, user, group, task, file etc.
	self.activity 	   = ""; -- description of the activity.
	return self;
end

function
activity_object:update()
local ok, err = db:update(akorp_activity_ns(), { id = self.id }, self, true, false);
if not ok and err then
	error(string.format("db:update failed with :%s",err));
	return ok, err;
end
return ok;
end

function
activity_object:insert()
local ok, err = db:insert(akorp_activity_ns(), self);
if not ok and err then
	error(string.format("db:insert failed with :%s",err));
	return ok, err;
end
return ok;
end

function
get_activity_object(_oid)
local activity, err = db:find_one(akorp_activity_ns(), { id = _oid });
if activity then
	setmetatable(activity, activity_object);
else
    if err then
        error(string.format("db:find_one failed with err:%s", err));
    end
end
return activity;
end


--[[
Tag can be VEVENT, VTODO, VJOURNAL, VCARD, VTIMEZONE, VFREEBUSY, VALARM, VTIMEZONE.
]]
function
vevent_object.new()
    local self = {};
    setmetatable(self, vevent_object);
    self._id = mongo.ObjectId()[1]; -- _id is an internal field used by mongodb donot use it in other sections of the code.
    self.id = self._id; -- id of the vevent object, same as the mongodb object id.
    self.personal = false; -- whether this is a personal event.
    self.owner_uid = 0;
    self.owner_gid = 0;
    self.category = ""; -- can be todo, meeting, reminder, task.
    self.create_timestamp = luabridge.currenttime(); -- timestamp of the object when it was created.
    self.edit_timestamp = 0; -- timestamp of the object when it was created.
    self.public = true; -- private or public is for user/group. people out side the group cannot see the calendar.
    self.url = ""; -- url of the caldav object. 
    self.caldav_data = ""; -- caldav representation of the data.
    self.kons = 0; -- id of the kons object attached if any.
    self.attachments = {}; -- list of the files attached with the event object if any.
    self.recurring = "none"; -- if this event is recurring. values can be "none", "daily", "weekly", "monthly".
    self.clones = {}; -- list of clones if we are the original event.
    self.clone = false; -- if we are a clone of a recurring event
    self.original_event = 0; -- reference to the original event, incase this event is a recurring one.
    self.tstart = 0;  --event start date.
    self.tend = 0;  --event end date.
    self.tstart_unix_time = 0; -- utc time stamp in unix time_t format, easy for comparing. 
    self.tend_unix_time = 0; -- utc time stamp in unix time_t format, easy for comparing. 
    self.summary = ""; -- summary of the event.
    self.calendar = 0; -- id of the container calendar object which we belong to.
    self.title = ""; -- title of the event.
    self.invited = {}; -- list of people who are invited. 
    self.accepted = {}; -- list of people who have accepted the invitation.
    self.denied = {}; -- list of people who have explicitly denied the invitation. 
    self.reminders = {}; -- list of persons who have set the reminders for this event to be reminded. 
    self.timezone = ""; -- time zone of the user who created the event.
    self.allday = false; -- whether the event is a day long one.
    self.limited = true;
    return self;
end

--[[
make a new object from the copy. 
]]
function
vevent_object_new_from_copy(copy)
    local self = {};
    self = listcopy(copy);
    self._id = mongo.ObjectId()[1]; -- _id is an internal field used by mongodb donot use it in other sections of the code.
    self.id = self._id; -- id of the vevent object, same as the mongodb object id.
    setmetatable(self, vevent_object);
    return self;
end

function
vevent_object:update()
local ok, err = db:update(akorp_events_ns(), { id = self.id }, self, true, false);
if not ok and err then
	error(string.format("db:update failed with :%s",err));
	return ok, err;
end
return ok;
end

function
get_vevent_object(eid)
local vevent, err = db:find_one(akorp_events_ns(), { id = eid });
if vevent then
	setmetatable(vevent, vevent_object);
else
    if err then 
        error(string.format("db:find_one failed with err:%s", err));
    end
end
return vevent;
end

function
vevent_object_delete(oid)
local ok, err = db:remove(akorp_events_ns(), { id = oid });
if not ok and err then
	error(string.format("db:remove failed with :%s",err));
	return ok, err;
end
return ok;
end

function
emit_notification(notifier, group, category, notiftype, oid, recievers, description, preview)
--info("allocating new notification");
local querystr = "{category : ".."\""..category.."\""..",notiftype:".."\""..notiftype.."\"".."," .. category .. ":".."\"".. oid .."\"".."}";
info(querystr);
local old = getnotifobjbyquery(querystr);
if old then
    info("There is an old notification already for the event updating it ");
    --[[ if the notifier is not present already in the list then add him to the list .]]
    if not item_present(old.notifiers, notifier) then
        info("notifier added to the list");
        table.insert(old.notifiers, notifier);
    end
    for i,uid in ipairs(old.notifiers) do 
        info(uid);
    --[[ move all the old notifiers in the list other than the current notifier 
         to unchecked list. so that they get a new notification]]
        if uid ~= notifier then
            info("tracker moving him to unchecked", uid);
            if item_present(old.checked, uid) then remove_item(old.checked, uid); end
            if not item_present(old.unchecked, uid) then table.insert(old.unchecked, uid); end
        end
    end
    old.timestamp = luabridge.currenttime();
    old:update();
    return old;
end
local notif = nil;
notif = notification_object.new();
if notif then
    notif.owner_gid = group;
    notif.preview = preview;
    notif.notiftype = notiftype;
    notif.category = category;
    notif.description = description;
    if category == "kons" then
        notif.kons = oid;
    elseif category == "calendar" then 
        notif.vevent = oid;
    elseif category == "file" then 
        notif.file = oid;
    end
    table.insert(notif.notifiers, notifier);
    notif.timestamp = luabridge.currenttime();
    notif.recipients = listcopy(recievers);
    remove_item(notif.recipients, notifier);
    notif.unchecked = listcopy(recievers);
    remove_item(notif.unchecked, notifier);
    notif:update();
    --info("allocating new notification success");
    return notif;
end
--info("allocating new notification failure");
return nil;
end

--[[
if the user is online then send him the notification straight away 
enqueue the notification to the users notification queue.
create a new notification and keep it in the database. set the 
properties of the notification broadcast it to the recipients and 
then update the notification in the database.
]]
function
notify(notifier, notification)
info("sending notification");
local notif = {};
notif.mesgtype = "notification";
notif.notification = {};
notif.notification = listcopy(notification);
notif.notification.active = true;
local nbuf,err = json.encode(notif);
if nbuf then
for i,uid in ipairs(notification.recipients) do
    if uid ~= notifier then -- the notifier is not the notified.
        if luabridge.getclientid(uid) ~= 0 then 
            luabridge.send2user(uid, nbuf);
        end
    end
end
else
    error(string.format("failed to encode the notification message to json buffer: err=%s", err));
end
return;
end

--[[
generate and send the notification to all the recipients.
]]
function
send_notification(notifier, group, category, notiftype, oid, recievers, description, preview)
local notif = emit_notification(notifier, group, category, notiftype, oid, recievers, description, preview);
if notif then 
    local err = notify(notifier, notif);
    if err then
        error("failed to notify users error:%s", err);
    end
end
return 0;
end

function
request_object.new()
local self = {};
setmetatable(self, request_object);
self._id = mongo.ObjectId()[1];
self.id = self._id;
self.owner_gid = 0;
self.requestor = 0;
self.requestee = {}; -- list of requestees
self.request = ""; -- what is this request ?
self.category = ""; -- can be kons, fmgr or calendar, group etc.
self.oid = 0; -- id of the object we are acting on behalf.
self.active = true; -- whether request is active means not answered yet.
self.granted = {}; -- whether granted.
self.denied = {}; -- explicitly denied.
self.description = ""; -- textual description of the request in detail.
self.create_timestamp  = luabridge.currenttime(); -- time stamp of the request object.
self.muted = {}; -- list of muters, ppl who asked not to load this on every login.
return self;
end

function
request_object:update()
local ok, err = db:update(akorp_request_ns(), { id = self.id }, self, true, false);
if not ok and err then
	error(string.format("db:update failed with :%s",err));
	return ok, err;
end
return ok;
end

function
get_request_object(eid)
local request, err = db:find_one(akorp_request_ns(), { id = eid });
if request then
	setmetatable(request, request_object);
else
    error(string.format("db:find_one failed with err:%s", err));
    return nil,err;
end
return request;
end

function
request_object_delete(oid)
local ok, err = db:remove(akorp_request_ns(), { id = oid });
if not ok and err then
	error(string.format("db:remove failed with :%s",err));
	return ok, err;
end
return ok;
end


--[[
create  a new organization object.
]]
function
org_object.new()
local self = {};
self._id = mongo.ObjectId()[1];
self.id = self._id;
self.group_list = {}; --list of groups owned by the organization.
self.user_list = {}; -- list of users in the organization, these may be idle users who are not part of any groups yet.
self.admin = 0; -- uid of the admin of the organization.
self.admin_pass = ""; --admin password
self.name = ""; -- name of the organization.
self.user_limit = 10; -- number of the users that can be created in the organization.
self.group_limit = 5; -- number of the groups that can be created in the organization.
self.create_timestamp = luabridge.currenttime(); -- time of creation of the organization.
self.edit_timestamp = ""; -- time of creation of the organization.
self.pending_email_invites = ""; -- list of email invites which are issued to the users via email.
                                 --[[Every user is invited by the admin via email, the system sends a invitation mail to the 
                                     email with a link to click on. when the user clicks the email id then the page is redirected
                                     to a user account creation page where the user account is created. after which the user is 
                                     let in to the organization page.
                                    ]]
self.hosted = true; -- if hosted in the cloud.
self.domain = ""; --host name of the organization to connect.
self.stunserver = "";  --address of the stun server, default will be www.antkorp.in:.
self.filesystempath = ""; -- filesystem path of the organization.
self.ldap = ""; -- address of the ldap server, if hosted it will be internal ldap server.
self.image_small  = ""; -- image in base 64 encoded form, 16x16
self.image_medium = ""; -- image in base 64 encoded form, 32x32 
self.image_large = ""; -- image in base 64 encoded form, 64x64
self.image_original = ""; -- original image uploaded by the client.
setmetatable(self, org_object);
return self;
end

function
org_object:update()
local ok, err = db:update(akorp_org_ns(), { id = self.id }, self, true, false);
if not ok and err then
	error(string.format("db:update failed with :%s",err));
	return ok, err;
end
return ok;
end

function 
get_org_object(oid)
local org, err = db:find_one(akorp_org_ns(), { id = oid });
if org then
	setmetatable(org, org_object);
else
    error(string.format("db:find_one failed with err:%s", err));
    return nil,err;
end
return org;
end

function 
get_org_object_by_name(_name)
local org, err = db:find_one(akorp_org_ns(), { name = _name });
if org then
	setmetatable(org, org_object);
else
    error("db:find_one failed with err:", err);
    return nil,err;
end
return org;
end

function
org_object_delete(oid)
local ok, err = db:remove(akorp_org_ns(), { id = oid });
if not ok and err then
	error(string.format("db:remove failed with :%s",err));
	return ok, err;
end
return ok;
end

function
org_object_delete_by_name(_name)
local ok, err = db:remove(akorp_org_ns(), { name = _name});
if not ok and err then
	error(string.format("db:remove failed with :%s",err));
	return ok, err;
end
return ok;
end

--[[
set the service handle of the service, this is helpful in cases the C/C++ code is 
calling in to lua and the service is already created by the C++ code. 
]]
function
setservicehandle(servicehandle)
info("setting service handler");
luabridge.setservicehandle(servicehandle);
return;
end

file_object = {};
file_object.__index = file_object;

function
get_file_object(fqpn)
info("get file object()");
local file = json.decode(luabridge.getfileobject(fqpn));
if file then
    setmetatable(file, file_object);
else
    error("failed to getfileobject ");
end
return file;
end

function
file_object:update()
info("file update()");
luabridge.setfileobject(self.fqpn, json.encode(self));
return;
end


--[[
get the user object with the token authenticated last time. 
]]
function
getuserwithtoken(token)
local user, err = db:find_one(akorp_user_ns(), {auth_token = token});
if not user then
    error("\ndb:find_one() for token:  failed", token);
    return nil;
end
setmetatable(user, user_object);
return user;
end

--[[
get the user object with the token authenticated last time. 
]]
function
getuserwithname(name)
local user, err = db:find_one(akorp_user_ns(), {uname = name});
if not user then
    error("\ndb:find_one() for token:  failed", token);
    return nil;
end
setmetatable(user, user_object);
return user;
end
