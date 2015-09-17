/***************************************
 * Getting Started with antkorp server.
 
 */

Client 
*****************************


Import akpWS.js to connect to the server


example usage akpWS


var services=["fmgr","dstore","kons","auth"]; // services list

var akp_ws= new akpWS(
statusHandler, //handle service  and connection status *required  -function
messageHandler, //handle messages from registed services *required -function
services, //list of services to register for client *required -Array
);



function statusHandler(){


}
function messageHandler(){
}
