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

#include "akorpdefs.h"
#include "common.hh"
#include "simple.hh"
#include "svclib.hh"
#include "log.hh"

static std::string sendBuf;
//a simple service to demonstrate the C++ platform apis.
//the service is simple we receive a ping and we send a pong back 
//simple isn't it ?
void
handleRequest(service *svc, int clientid, int channelid, std::string &data)
{
    _info<<"data message from"<<" clientid: "<<clientid<<" channelid: "<<channelid;
    _info<<"data recvd:"<<data;
    std::string pong("pong");
    tupl tv[] = {{"response", pong}};
    std::string json = putJsonVal(tv, sizeof(tv)/sizeof(tupl));
    svc->sendToClient(clientid, channelid, json);
    return;
}

void
handleControlMesg(service *svc, service::controlMessage &cmsg)
{
    _info<<"control message.";
    return;
}

static void
processSignals(service *svc, struct signalfd_siginfo *fdsi)
{
    if(fdsi->ssi_signo == SIGTERM) exit(0);
    return;
}

int
main(int ac, char **av)
{
    try
    {
        service svc("simple");
        svc.setDataRecvHandler(handleRequest);
        svc.setControlRecvHandler(handleControlMesg);
        svc.setSignalHandler(processSignals);
        svc.run();
    }
    catch(std::exception &e)
    {
        _error<<"service exited with exception:"<<e.what();
        return -1;
    }
    return 0;
}
