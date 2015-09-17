
/*
    thrift definition file for the authentication service.
*/
struct AddUserRequest
{
    1: i32 uid;
    2: string uname;
    3: string oid;
    4: string first_name;
    5: string password;
};

struct AddUserResponse
{
};

struct getUserRequest
{
    1: i32 uid;
};

struct getUserResponse
{
};

struct userSetInfo
{
    1: i32 uid;
    2: string dob;
    3: string email;
    4: string first_name;
    5: string last_name;
    6: string middle_name;
    7: string homeaddress;
    8: string sex;
    9: string mob;
    10: string workaddress;
    11: string jobtitle;
};
struct setUserRequest
{
    1: userSetInfo user;
};

struct setUserResponse
{
};

struct delUserRequest
{
    1: string uname;
    2: i32 uid;
};

struct delUserResponse
{
};

struct addGroupRequest
{
    1: string gname;
    2: i32 uid;
    3: string oid;
    4: bool join_by_approval;
};

struct addGroupResponse
{
};

struct getGroupRequest
{
    1: i32 gid;
};

struct getGroupResponse
{
};

struct group
{
    1: string description;
    2: bool join_by_approval;
    3: list<string> tags;
    4: list<string> categories;
    5: string organization;
};
struct setGroupRequest
{
    1: i32 gid;
    2: group group;
};

struct setGroupResponse
{
};

struct delGroupRequest
{
    1: i32 gid;
    2: i32 uid;
};

struct delGroupResponse
{
};

struct approveUserRequest
{
    1: i32 gid;
    2: i32 uid;
    3: i32 user;
};

struct approveUserResponse
{
};

struct disapproveUserRequest
{
    1: i32 gid;
    2: i32 uid;
    3: i32 user;
    4: string reason;
};

struct disapproveUserResponse
{
};

struct addGroupMemberRequest
{
    1: i32 gid;
    2: i32 uid;
};

struct addGroupMemberResponse
{
};

struct delGroupMemberRequest
{
    1: i32 gid;
    2: i32 uid;
};

struct delGroupMemberResponse
{
};

struct followGroupRequest
{
    1: i32 gid;
    2: i32 uid;
};

struct followGroupResponse
{
};

struct unfollowGroupRequest
{
    1: i32 gid;
    2: i32 uid;
};

struct unfollowGroupResponse
{
};

struct userLoginRequest
{
    1: string uname;
    2: string auth_token;
    3: string password;
    4: i32 rememberme;
};

struct userLoginResponse
{
};

struct userLogoutRequest
{
    1: i32 uid;
};

struct userLogoutResponse
{
};

struct statusUpdateRequest
{
    1: i32 user;
    2: string mesgtype;
    3: string eventtype;
    4: string status;
};

struct addBookmarkRequest
{
    1: i32 uid;
    2: string bookmark;
};

struct addBookmarkResponse
{
};

struct getBookmarkRequest
{
    1: i32 uid;
};

struct getBookmarkResponse
{
    1: list<string> bookmark_list;
};

struct delBookmarkRequest
{
    1: i32 uid;
    2: string bookmark;
};

struct delBookmarkResponse
{
};

struct addGroupCategoryRequest
{
    1: i32 uid;
    2: i32 gid;
    3: string category;
};

struct addGroupCategoryResponse
{
};


struct delGroupCategoryRequest
{
    1: i32 uid;
    2: i32 gid;
    3: string category;
};

struct delGroupCategoryResponse
{
};

struct checkNotificationRequest
{
    1: i32 uid;
};

struct checkNotificationResponse
{
};

struct relayNotificationRequest
{
    1: i32 uid; 
    2: i32 gid;
    3: string category;
    4: optional i32 marker;
};

struct relayNotificationResponse
{
};

struct markAllNotificationReadRequest
{
    1: i32 uid;
    2: string category;
};

struct markAllNotificationReadResponse
{
};

struct getNotificationCountersRequest
{
    1: i32 gid; 
    2: i32 uid; 
    3: string category;
};

struct getNotificationCountersResponse
{
};

struct orgCreateRequest
{
    1: string org;
};

struct orgCreateInfo 
{
    1: i32 id;
    2: list<string> group_list;
    3: list<string> user_list;
    4: i32 admin;
    5: string name;
    6: string create_timestamp;
    7: list<string> pending_email_invites;
    8: string domain;
    9: string stunserver;
    10: string small_image;
    11: string image_medium;
    12: string image_large;
    13: string image_original;
}
struct orgCreateResponse
{
    orgCreateInfo org;
};

struct orgDeleteRequest
{
    1: string oid;
};

struct orgDeleteResponse
{
};

struct orgEditRequest
{
};

struct orgEditResponse
{
};

struct getOrgRequest
{
    1: string oid;
};

struct orgInfo
{
    1: i32 id;
    2: list<string> group_list;
    3: list<string> user_list;
    4: i32 admin;
    5: string name;
    6: string create_timestamp;
    7: list<string> pending_email_invites;
    8: string domain;
    9: string stunserver;
    10: string small_image;
    11: string image_medium;
    12: string image_large;
    13: string image_original;
    14: i32 fsusage;
};
struct getOrgResponse
{
    orgInfo org;
};

struct resetPasswordRequest
{
    1: i32 uid;
    2: i32 user;
    3: string new_password;
};

struct resetPasswordResponse
{
};

struct resetAdminPasswordRequest
{
    1: string org;
    2: string new_password;
};

struct resetAdminPasswordResponse
{
};

struct changePasswordRequest
{
    1: i32 uid;
    2: string old_password;
    3: string new_password;
};

struct changePasswordResponse
{
};
