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

#include "tpool.hh"

void Worker::operator()()
{
    std::function<void()> task;
    while(true)
    {
        {    
            std::unique_lock<std::mutex> lock(pool.queue_mutex);
            while(!pool.stop && pool.tasks.empty()) pool.condition.wait(lock);
            if(pool.stop) return;
            task = pool.tasks.front();
            pool.tasks.pop_front();
        }
        task();
    }
}

ThreadPool::ThreadPool(size_t threads) : stop(false)
{
    for(size_t i = 0;i<threads;++i)
        workers.push_back(std::thread(Worker(*this)));
}

ThreadPool::~ThreadPool()
{
    stop = true;
    condition.notify_all();
    for(size_t i = 0;i<workers.size();++i)
        workers[i].join();
}

void ThreadPool::enqueue(std::function<void()> f)
{
    {
        std::unique_lock<std::mutex> lock(queue_mutex);
        tasks.push_back(f);
    }
    condition.notify_one();
    return;
}
