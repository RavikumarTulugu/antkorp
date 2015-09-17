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

#ifndef __T_POOL_H__
#define __T_POOL_H__

#include <thread>
#include <mutex>
#include <deque>
#include <vector>
#include <condition_variable>

class ThreadPool;

// our worker thread objects
class Worker 
{
    public:
        Worker(ThreadPool &s) : pool(s){}
        void operator()();
    private:
        ThreadPool &pool;
};

// the actual thread pool
class ThreadPool
{
    public:
        ThreadPool(size_t);
        //template<class F> void enqueue(F f);
        void enqueue(std::function<void()> f);
        ~ThreadPool();
    private:
        friend class Worker;
        std::vector<std::thread> workers;
        std::deque<std::function<void()>> tasks;
        std::mutex queue_mutex;
        std::condition_variable condition;
        bool stop;
};

#endif 
