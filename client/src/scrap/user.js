
//This file contains the user management and user class implementation 
userList = {}; //list of all user objects 
function addUserDb(userObj) { userList[userObj.getName()]; }//Add user to the list 
function getUser(userName) { return userList[userName]; }//Give user name and get a user object back 
function getUserInfoFromServer(userName) { return ; } //Get user info from server 

//XXX: some of the parameters will be filled on demand basis especially the connection.
function User()
{
	this.department = "";
	this.fax = 0;
	this.firstname  = "";
	this.lastname = "";
	this.info = "";
	this.mail = "";
	this.mobile	 = 0;
	this.title	= "";
	this.url	= "";
	this.picture = null; //image blob of the user
	this.uname = ""; //uname is the login id of the user 
	this.gname = ""; //gname is the group id of the user 
	this.uid = 0; //numerical id of the user 
	this.gid = 0; //numerical id of the group  
	this.homedir = ""; 
	this.groups =  {}; //list of groups user belongs to 
	this.statusLine = ""; //can be "Online", "Offline" , "DonotDisturb" etc.
	this.statusMesg = "";// Additional status mesg which is detailed message set by the user.
	this.peerConnection = null; //our peer connection to this particular user.
	this.peerConnected = false; //is our peer connected to us already.
	this.connectionStatus = "notconnected"; //notconnected---->connecting ---> connected or failed.
	this.sdp = null; 
	this.stream = null; 
	this.dataChannel = null;
	this.callPending = false; 
	this.iceStarted = false; 
	this.iceComplete = false; 
	this.streamRecvd = false;

	//Connection routines
	this.addIceCanditate = function () { return; }  //Add ice canditate callback 
	this.connect = function () { return; }//this establishes a peer connection to the user.
};
