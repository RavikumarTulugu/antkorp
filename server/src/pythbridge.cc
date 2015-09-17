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

#include <Python.h>
#include <object.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/signal.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <stdio.h>
#include <math.h>
#include <sys/types.h>
#include <unistd.h>
#include <syslog.h>
#include <netinet/in.h>
#include <pthread.h>
#include <assert.h>
#include <signal.h>
#include <stdlib.h>
#include <stdbool.h>
#include <strings.h>
#include <linux/capability.h>
#include <sys/prctl.h>
#include <linux/prctl.h>
#include <errno.h>
#include <iostream>
#include "akorpdefs.h"
#include "ocache.hh"
#include "svclib.hh"

#include <boost/date_time/posix_time/posix_time_types.hpp>
#include <string>
#include <gd.h>
#include "JSON_Base64.h"
#include <time.h>

using namespace std; 
static service *svc = nullptr;
static PyObject *dataRecvFuncIdx = nullptr;
static PyObject *ctrlRecvFuncIdx = nullptr; 
extern "C" 
{
    __attribute__((constructor))
        static void
        loadLibrary(void) 
        {
            //load the luabridge library and then get the svc symbol
            std::cerr<<"python bridge loaded";
            return;
        }

    __attribute__((destructor))
        static void
        unloadLibrary(void) 
        {
            std::cerr<<"python bridge unloaded";
            return;
        }

    //create a new service with the given name.
    static PyObject*
        createservice(PyObject *self, PyObject *args)
        {
            const char *svcname = nullptr;
            if (!PyArg_ParseTuple(args, "s", &svcname)) return Py_BuildValue("s", "Need a string argument service name");
            int len = strlen(svcname);
            if (!len){
                return Py_BuildValue("s", "invalid string given: string length 0");
            }else if(len > MAX_SERVICE_NAME_LEN){
                return Py_BuildValue("s", "invalid string given: string length must be less than 33.");
            }
            try
            {
                svc = new service(svcname);
            }
            catch(std::exception &e)
            {
                std::string error = "Unable to create service:";
                error += e.what();
                return Py_BuildValue("s", error.c_str());
            }
            return Py_None;
        }

    static PyObject*
        deleteservice(PyObject *self, PyObject *args)
        {
            try 
            {
                if(svc){
                    svc->stop();
                    delete svc;
                }else{
                    return Py_BuildValue("s", "no service to delete: create service first");
                }
            }
            catch(std::exception &e)
            {
                std::string error = "exception thrown in delete service:";
                error += e.what();
                return Py_BuildValue("s", error.c_str());
            }
            return Py_None;
        }

    static PyObject*
        run(PyObject *self, PyObject *args)
        {
            try 
            {
                if(svc) svc->run();
                else{
                    return Py_BuildValue("s", "no service to run: create service first");
                }
            }
            catch(std::exception &e)
            {
                std::string error = "exception thrown in service::run():";
                error += e.what();
                return Py_BuildValue("s", error.c_str());
            }
            return Py_None;
        }

    static PyObject*
        dispatch(PyObject *self, PyObject *args)
        {
            try 
            {
                if(svc) svc->dispatch();
                else{
                    return Py_BuildValue("s", "no service to call dispatch on: create service first");
                }
            }
            catch(std::exception &e)
            {
                std::string error = "Unable to delete service:";
                error += e.what();
                return Py_BuildValue("s", error.c_str());
            }
            return Py_None;
        }

    static PyObject*
        send2client(PyObject *self, PyObject *args)
        {
            int clientid, channelid;
            const char *data = nullptr;
            if (!PyArg_ParseTuple(args, "lls", &clientid, &channelid, &data)) 
                return Py_BuildValue("s", "Need 3 arguments clientid, channelid, datastring");
            try
            {
                if(svc && clientid) svc->sendToClient(clientid, channelid, data, strlen(data));
                else{
                    return Py_BuildValue("s", "no service to call dispatch on: create service first");
                }
            }
            catch(std::exception &e)
            {
                std::string error = "Unable to send data to client due to exception:";
                error += e.what();
                return Py_BuildValue("s", error.c_str());
            }
            return Py_None;
        }

    /* assume that table is on the stack top */
#if 0
    bool
        getintfield(PyObject *self, PyObject *args, const char *key, int *result)
        {
            lua_pushstring(l, key);
            lua_gettable(l, -2);
            if (!lua_isnumber(l, -1)){
                return false;
            }
            *result = (int)lua_tonumber(l, -1);
            lua_pop(l, 1);
            return true;
        }

    const char *
        getstringfield(PyObject *self, PyObject *args, const char *key)
        {
            const char *result = nullptr;
            lua_pushstring(l, key);
            lua_gettable(l, -2);
            if (!lua_isstring(l, -1)){
                return nullptr;
            }
            result = lua_tostring(l, -1);
            lua_pop(l, 1);
            return result;
        }

    static int
        send2gw(PyObject *self, PyObject *args)
        {
            if (!PyArg_ParseTuple(args, "", ))
                return NULL;
            try
            {
                //fill the control message according to the lua table.
                int mtype;
                const char *reason;
                int reason_len; 

                service::controlMessage cmsg;
                memset(&cmsg, 0, sizeof(service::controlMessage));
                if(!getintfield(l, "messageType", &mtype)) 
                    throw std::invalid_argument("messageType field missing in table");
                switch(mtype)
                {
                    case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DISCONNECT:
                        cmsg.messageType = mtype;
                        if(!getintfield(l, "clientid", &cmsg.clientDisconnect.clientid))
                            throw std::invalid_argument("clientid field missing in table");
                        if(!getintfield(l, "channelid", &cmsg.clientDisconnect.channelid))
                            throw std::invalid_argument("channelid field missing in table");
                        reason = getstringfield(l, "reason");
                        if(!reason) 
                            throw std::invalid_argument("reason field missing in table");
                        reason_len = strlen(reason);
                        memcpy(cmsg.clientDisconnect.reason, reason, reason_len < 128 ? reason_len : 128);
                        break;

                    default:
                        throw std::invalid_argument("invalid value for message type field");
                }
                if(svc) svc->sendToGw(cmsg);
                else{
                    lua_pushstring(l, "no service to call dispatch on: create service first");
                    return 1;
                }
            }
            catch(std::exception &e)
            {
                std::string error = "Unable to send message to gateway due to exception:";
                error += e.what();
                lua_pushstring(l, error.c_str());
                return 1;
            }
        }
#endif

    static PyObject*
        broadcast(PyObject *self, PyObject *args)
        {
            const char *data = nullptr;
            if (!PyArg_ParseTuple(args, "s", &data)) return Py_BuildValue("s", "0 arguments given, Need data argument");
            try 
            {
                if(svc) svc->broadcast(data, strlen(data));
                else{
                    return Py_BuildValue("s", "no service to call dispatch on: create service first");
                }
            }
            catch(std::exception &e)
            {
                std::string error = "Unable to send message to gateway due to exception:";
                error += e.what();
                return Py_BuildValue("s", error.c_str());
            }
            return Py_None;
        }

    static void
        handleRequest(PyObject *self, PyObject *args, service *svc, int clientid, int channelid, std::string &data)
        {
            PyObject *arglist = nullptr;
            arglist = Py_BuildValue("(iis)", clientid, channelid, data.c_str());/* Time to call the callback */
            PyEval_CallObject(dataRecvFuncIdx, arglist);
            Py_DECREF(arglist);
            //FIXME: how do we return the error here ? this is python can we throw a python exception here ? 
            return;
        }

    static PyObject*
        setdatarecvhandler(PyObject *self, PyObject *args)
        {
            PyObject *callback = nullptr;
            if (!PyArg_ParseTuple(args, "O", &callback)) return Py_BuildValue("s", "Need atleast one argument a python function");
            try
            {
                if(svc){
                    svc->setDataRecvHandler(std::bind(handleRequest, 
                                self,
                                args,
                                std::placeholders::_1,
                                std::placeholders::_2,
                                std::placeholders::_3,
                                std::placeholders::_4));
                    //store the lua function in the registry to be called later.
                    PyObject *temp = nullptr;
                    if (PyArg_ParseTuple(args, "O", &temp)){
                        if (!PyCallable_Check(temp)){
                            PyErr_SetString(PyExc_TypeError, "parameter must be callable");
                            return nullptr;
                        }
                        Py_XINCREF(temp);         /* Add a reference to new callback */
                        Py_XDECREF(dataRecvFuncIdx);  /* Dispose of previous callback */
                        dataRecvFuncIdx = temp;       /* Remember new callback */
                        Py_INCREF(Py_None); /* Boilerplate to return "None" */
                        return Py_None;
                    }
                }else{
                    return Py_BuildValue("s", "no service to call dispatch on: create service first");
                }
            }
            catch(std::exception &e)
            {
                std::string error = "Unable to set data receive handler due to exception:";
                error += e.what();
                return Py_BuildValue("s", error.c_str());
            }
            return Py_None;
        }

    //Build a dictionary for the structure and then add it to the argument tuple. 
    //and invoke the callback.
    static void
        handleControlMesg(PyObject *self, PyObject *args, service *svc, service::controlMessage &cmsg)
        {
            PyObject *dict = PyDict_New();
            if (!dict) return;
            PyObject *arglist = PyTuple_New(1); //remember to change this size when you changed the c structure.
            if (!arglist) return;

            PyDict_SetItem(dict, Py_BuildValue("s", "messageType"), Py_BuildValue("i", cmsg.messageType));
            switch(cmsg.messageType)
            {
                case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_ARRIVAL:
                case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_ADD:
                    PyDict_SetItem(dict, Py_BuildValue("s", "clientid"), Py_BuildValue("i", cmsg.clientArrival.clientid));
                    PyDict_SetItem(dict, Py_BuildValue("s", "channelid"), Py_BuildValue("i", cmsg.clientArrival.channelid));
                    break;

                case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CLIENT_DEPARTURE:
                case service::controlMessage::CONTROL_CHANNEL_MESSAGE_TYPE_CHANNEL_DELETE:
                    PyDict_SetItem(dict, Py_BuildValue("s", "clientid"), Py_BuildValue("i", cmsg.clientDeparture.clientid));
                    PyDict_SetItem(dict, Py_BuildValue("s", "channelid"), Py_BuildValue("i", cmsg.clientDeparture.channelid));
                    break;

                default:
                    std::cerr<<"Unknown control message type:";
                    return;
            }
            //call the lua function using lua_pcall.
            PyTuple_SetItem(arglist, 0, dict);
            PyEval_CallObject(dataRecvFuncIdx, arglist);
            Py_DECREF(dict);
            Py_DECREF(arglist);
            return;
        }


    static PyObject*
        setcontrolrecvhandler(PyObject *self, PyObject *args)
        {
            PyObject *callback = nullptr;
            if (!PyArg_ParseTuple(args, "O", &callback)) return Py_BuildValue("s", "Need atleast one argument a python function");
            try
            {
                if(svc){
                    svc->setControlRecvHandler(std::bind(handleControlMesg, self, args, std::placeholders::_1, std::placeholders::_2));
                    //store the lua function in the registry to be called later.
                    PyObject *temp = nullptr;
                    if (PyArg_ParseTuple(args, "O", &temp)){
                        if (!PyCallable_Check(temp)){
                            PyErr_SetString(PyExc_TypeError, "parameter must be callable");
                            return nullptr;
                        }
                        Py_XINCREF(temp);         /* Add a reference to new callback */
                        Py_XDECREF(ctrlRecvFuncIdx);  /* Dispose of previous callback */
                        ctrlRecvFuncIdx = temp;       /* Remember new callback */
                        Py_INCREF(Py_None); /* Boilerplate to return "None" */
                        return Py_None;
                    }
                }else{
                    return Py_BuildValue("s", "no service to call dispatch on: create service first");
                }
            }
            catch(std::exception &e)
            {
                std::string error = "Unable to set control receive handler due to exception:";
                error += e.what();
                return Py_BuildValue("s", error.c_str());
            }
            return Py_None;
        }

    //given the uid return the clientid
    static PyObject*
        getclientid(PyObject *self, PyObject *args)
        {
            int uid = 0;
            if (!PyArg_ParseTuple(args, "l", &uid)) return Py_BuildValue("s", "Need atleast one argument uid");
            if(uid){
                return Py_BuildValue("l", getClientIdForUid(uid));
            }
            return Py_BuildValue("ls", 0, "Invalid uid supplied uid cannot be 0 or -ve");
        }

    static PyObject*
        getuidforclientid(PyObject *self, PyObject *args)
        {
            int clientid = 0;
            if (!PyArg_ParseTuple(args, "l", &clientid)) return Py_BuildValue("s", "Need atleast one argument clientid");
            if(clientid){
                return Py_BuildValue("l", getUidForClientId(clientid));
            }
            return Py_BuildValue("ls", 0, "Invalid uid supplied uid cannot be 0 or -ve");
        }

    //send a message to a particular user, the message is a json object. 
    //the arguments are just a userid and the message and the length of 
    //the message.
    static PyObject*
        send2user(PyObject *self, PyObject *args)
        {
            int uid = 0;
            const char *msg = nullptr;
            if (!PyArg_ParseTuple(args, "ls", &uid, &msg)) return Py_BuildValue("s", "Need atleast 2 arguments 1:uid 2:string");
            int msgLen = strlen(msg);
            if(uid){
                int clientid = getClientIdForUid(uid);
                if (clientid && msgLen){
                    svc->sendToClient(clientid, -1, nonconst(msg), msgLen);
                    return Py_None;
                }
            }

            return Py_BuildValue("s", "invalid parameters given");
        }

    static PyMethodDef pythbridge_methods [] =
    {
        {"getclientid", getclientid, METH_VARARGS, "Get the clientid of the user given the uid"},
        {"getuidforclientid", getuidforclientid, METH_VARARGS, "Get the uid representing the clientid"},
        {"createservice", createservice, METH_VARARGS, "create a service , this should be called only once"},
        {"run", run, METH_VARARGS, "run the service, this is a blocking call"},
        {"dispatch", dispatch, METH_VARARGS, "dispatch the callbacks equivalent to calling run() once"},
        {"send2client", send2client, METH_VARARGS, "send data to client"},
        {"send2user", send2user, METH_VARARGS, "send data to user"},
        //{"send2gw", send2gw, METH_VARARGS, "send data to gateway"},
        {"setdatarecvhandler", setdatarecvhandler, METH_VARARGS, "set the data processing callback"},
        {"setcontrolrecvhandler", setcontrolrecvhandler, METH_VARARGS, "set the control message processing callback"},
        {"broadcast", broadcast, METH_VARARGS, "broadcast the message to all the users in the system"},
        {"deleteservice", deleteservice, METH_VARARGS, "delete the service"},
        { nullptr, nullptr, 0, nullptr}
    };

    PyMODINIT_FUNC initpythbridge(void)
    {
        PyObject *module = Py_InitModule("pythbridge", pythbridge_methods);
        assert(module);
    }
}
