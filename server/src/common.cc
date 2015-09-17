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

#include "common.hh"

__thread char _estring[512];
syscallException exc;

bool
getJsonVal(const JSONNode &n, tupl *tv, int tvSz) //At the end of the parse the attrCount should be equal to the size of the vector
{ 
	int attrCount = 0;
	JSONNode::const_iterator i = n.begin();
	while ((i != n.end()) && (attrCount < tvSz)){
		std::string node_name = i -> name();
		for (int idx = 0 ; idx < tvSz; idx++){
			if (node_name == tv[idx]._attrName){
				if(tv[idx]._attrVal.type() == typeid(int*)){//get the value and copy to the value parameter
					attrCount++;
					*(boost::get<int*>(tv[idx]._attrVal)) = i->as_int();
					break;
				}else if (tv[idx]._attrVal.type() == typeid(json_string*)){
					attrCount++;
					*(boost::get<json_string*>(tv[idx]._attrVal)) = i->as_string();
					break;
				}else if (tv[idx]._attrVal.type() == typeid(float*)){
					attrCount++;
					*(boost::get<float*>(tv[idx]._attrVal)) = i->as_float();
					break;
				}else if (tv[idx]._attrVal.type() == typeid(std::string*)){
					attrCount++;
					*(boost::get<std::string*>(tv[idx]._attrVal)) = i->as_binary();
					break;
				}
			}
		}
		++i;//increment the iterator
	}

	return attrCount == tvSz; //should be true else we are missing an attribute
}

std::string
putJsonVal(tupl *tv, int tvSz) //At the end of the parse the attrCount should be equal to the size of the vector
{ 
	JSONNode n;
	for (int i = 0; i < tvSz; i++){
		if (tv[i]._attrVal.type() == typeid(int))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<int>(tv[i]._attrVal)));
		else if (tv[i]._attrVal.type() == typeid(float))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<float>(tv[i]._attrVal)));
		else if (tv[i]._attrVal.type() == typeid(json_string))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<json_string>(tv[i]._attrVal)));
		else if (tv[i]._attrVal.type() == typeid(std::string))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<std::string>(tv[i]._attrVal)));
		else if (tv[i]._attrVal.type() == typeid(long))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<long>(tv[i]._attrVal)));
	}
	return n.write_formatted();
}

std::string
putJsonVal(tupl *tv, int tvSz, JSONNode &n) //At the end of the parse the attrCount should be equal to the size of the vector
{ 
	for (int i = 0; i < tvSz; i++){
		if (tv[i]._attrVal.type() == typeid(int))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<int>(tv[i]._attrVal)));
		else if (tv[i]._attrVal.type() == typeid(float))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<float>(tv[i]._attrVal)));
		else if (tv[i]._attrVal.type() == typeid(json_string))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<json_string>(tv[i]._attrVal)));
		else if (tv[i]._attrVal.type() == typeid(std::string))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<std::string>(tv[i]._attrVal)));
		else if (tv[i]._attrVal.type() == typeid(long unsigned int))
            n.push_back(JSONNode(tv[i]._attrName, 
                        boost::get<long unsigned int>(tv[i]._attrVal)));
	}
	return n.write_formatted();
}

//NOTE: This cannot search json objects with arrays and 
//children at lower levels.
//return true if the attrName we are finding is found
bool
getJsonSingleVal(const JSONNode &n, const char *attrName, anonType valRef) 
{
	JSONNode::const_iterator i = n.begin();
	while (i != n.end()) {
		std::string node_name = i -> name();
		if (node_name == attrName){
			if(valRef.type() == typeid(int*)){//get the value and copy to the value parameter
				*(boost::get<int*>(valRef)) = i->as_int();
				return true;
			}else if (valRef.type() == typeid(json_string*)){
				*(boost::get<json_string*>(valRef)) = i->as_string();
				return true;
			}else if (valRef.type() == typeid(float*)){
				*(boost::get<float*>(valRef)) = i->as_float();
				return true;
			}else if (valRef.type() == typeid(std::string*)){
				*(boost::get<std::string*>(valRef)) = i->as_binary();
				return true;
			}
		}
		i++;
	}
	return false;
}

void
dumptrace(void)
{
	int j, nptrs;
	void *buffer[100];
	char **strings;

	nptrs = backtrace(buffer, 100);
	fprintf(stderr, "backtrace() returned %d addresses\n", nptrs);
	strings = backtrace_symbols(buffer, nptrs);
	if (!strings){
		perror("backtrace_symbols");
		exit(EXIT_FAILURE);
	}   

	for (j = 0; j < nptrs; j++) 
        fprintf(stderr, "%s\n", strings[j]);
	free(strings);
	return;
}

//FIXME:
//Implement support for chroot support. 
//perform a chdir and then followed by a chroot. 
//before that do a bind mount of /proc in to the chroot directory.
//This is especially needed for the libreoffice instance to limit to the directory 
//where the file resides.
int
popenCustom(int *popenPipe, 
		pid_t *childPid, 
		const char *command, 
		char **args,
        std::string chrootPath)
{
	pid_t child;
	int in[2]; 
	int out[2];
	int err[2];

	int rc;
	_except(::pipe(in));
	_except(::pipe(out));
	_except(::pipe(err));

	child = _except(::fork());
	if (child){ //parent
		_eintr(::close(in[0]));
		_eintr(::close(out[1]));
		_eintr(::close(err[1]));

		popenPipe[0] = in[1];
		popenPipe[1] = out[0];
		popenPipe[2] = err[0];

		*childPid = child;

		//since the fds will be used with select, its better we set them
		//nonblocking mode. 
		_except(::fcntl(popenPipe[1], F_SETFL, O_NONBLOCK));
		_except(::fcntl(popenPipe[2], F_SETFL, O_NONBLOCK));
	}else if(child == 0){ //child
		_eintr(::close(in[1]));
		_eintr(::close(out[0]));
		_eintr(::close(err[0]));

		_eintr(::close(0)); 
		_eintr(::dup(in[0]));
		_eintr(::close(1)); 
		_eintr(::dup(out[1]));
		_eintr(::close(2)); 
		_eintr(::dup(err[1]));
		int rc = _except(::execv(command, args)); //finally spawn the command 
	}else{
		perror("fork failure:"); 
		goto fork_error; 
	}

	return 0; 

fork_error:
	_eintr(::close(err[1]));
	_eintr(::close(err[0]));
	_eintr(::close(out[1]));
	_eintr(::close(out[0]));
	_eintr(::close(in[1]));
	_eintr(::close(in[0]));
	return -1;
}

//call the command with the arguments
//stdout_callback is invoked with the contents put on stdout by child 
//stderr_callback is invoked with the contents put on stderr by child 
//both the callbacks are passed the fd to the child_stdin so that they 
//can write to the child input basing on the contents of child's stdout
//or stderr.
int 
spawnCommand(int *popenPipe, 
		const char *command,
		char **args,
		int *childExitCode,
		void(*stdout_callback)(int child_stdin, const char *buf, size_t size),
		void(*stderr_callback)(int child_stdin, const char *buf, size_t size)
		)
{
	int childStatus;
	int rc = 0;

	pid_t child;
	if(popenCustom(popenPipe, &child, command, args) < 0)  return -1;

	//listen on the stdout and stderr of the child
	fd_set childOutFds, workingSet;
	FD_ZERO(&childOutFds);
	FD_SET(popenPipe[1], &childOutFds);
	FD_SET(popenPipe[2], &childOutFds);
	int max = popenPipe[1] > popenPipe[2] ? popenPipe[1] : popenPipe[2];

	while (1){
		memset(&workingSet, 0, sizeof(fd_set));
		memcpy(&workingSet, &childOutFds, sizeof(fd_set));

		int rc = 0;
		struct timeval tv = {120, 0}; //2 min is significantly a long timeout
		rc = _eintr(::select(max+1, &workingSet, nullptr, nullptr, &tv));
		if (rc < 0){
			perror("select failed:");
			break;
		} else if (rc){
			if(FD_ISSET(popenPipe[1], &workingSet)){
				int rc = 0;
				//Try to drain the pipe 
				do{
					char childOutput[2048] = {'\0'};
					//rc = _except(read(popenPipe[1], childOutput, sizeof(childOutput)));
					rc = _eintr(::read(popenPipe[1], childOutput, sizeof(childOutput)));
					if (rc < 0){
						if ((errno != EAGAIN) || (errno != EWOULDBLOCK)){
							perror("read on childout failed"); 
							return -1;
						}
					}
					else if (rc){
						if (stdout_callback)
							stdout_callback(popenPipe[0], childOutput, rc); 
					}
					//other end has exited and read returned 0 bytes here 
					//just close the pipes and get the fuck out of here 
					else goto collect_wait_status;
				} while(rc > 0);
			}

			if(FD_ISSET(popenPipe[2], &workingSet)){
				int rc = 0;
				//Try to drain the pipe
				do{
					char childOutput[2048] = {'\0'};
					//rc = _except(read(popenPipe[2], childOutput, sizeof(childOutput)));
					rc = _eintr(::read(popenPipe[2], childOutput, sizeof(childOutput)));
					if (rc < 0){
						if ((errno != EAGAIN) || (errno != EWOULDBLOCK)){
							perror("read on childerr failed");
							return -1;
						}
					}
					else if (rc){
						if (stderr_callback)
							stderr_callback(popenPipe[0], childOutput, rc); 
					}
					//other end has exited and read returned 0 bytes here 
					//just close the pipes and get the fuck out of here 
					else goto collect_wait_status;
				}while(rc > 0);
			}
		}else{
			int rc = 0;
			rc = _eintr(::waitpid(child, &childStatus, WNOHANG));
			if (rc == 0) continue;  //move on with select
			else{
				if (rc < 0) perror("waitpid failed");
				goto closefds_and_exit;
			}
		}
	}

	//close the pipe descriptors and return
collect_wait_status:
	rc = _eintr(::waitpid(child, &childStatus, 0));
	assert(rc); //we are here coz of the child exit 
				//so the return value of waitpid has 
				//to be nonzero.
closefds_and_exit:
	_eintr(::close(popenPipe[0]));
	_eintr(::close(popenPipe[1]));
	_eintr(::close(popenPipe[2]));
	*childExitCode = WEXITSTATUS(childStatus);
	return 0;
}

int 
pcloseCustom(int *rwePipe)
{
	_eintr(::close(rwePipe[0]));
	_eintr(::close(rwePipe[1]));
	_eintr(::close(rwePipe[2]));
	return 0;
}

/*
   courtesy:steven dake
   fills the given string with the current time including microseconds and
   returns the pointer to the same string.
   shamelessly lifted from steven dakes code ;-). 
   */
char * 
current_time(char *cur_time)
{
    struct timeval tv = {0x0};
    char time[256];
    ::gettimeofday(&tv,nullptr);
    strftime(time,sizeof(time),"%b:%e %k:%M:%S",localtime(&tv.tv_sec));
    sprintf(cur_time,"%s:%06ld",time,(long)tv.tv_usec);
    return cur_time;
}

/*
   A macro to generate a time spec given an interval. Interval is given in
   milliseconds.This is useful for POSIX routines where they demand an
   absolute time in future. 
   */
void 
msec2TimeSpec(unsigned int interval, struct timespec *ts)   
{
    int rc = 0x0;
    struct timespec now = {0x0 , 0x0};
    rc = clock_gettime(CLOCK_REALTIME, &now);
    assert (rc == 0x0);
    ts->tv_sec = (interval / 1000) + now.tv_sec;
    ts->tv_nsec = ((interval % 1000) * 1000000) + now.tv_nsec;
    return;
}

/*
   initialize log interface of the module.
   signature is a string attached to every log message logged in the
   /var/log/messages file. only applicable when syslog is in use. 
   */
void 
loginit(char *signature)
{
    openlog(signature, LOG_CONS|LOG_NDELAY, LOG_DAEMON);
    return;
}

long long dbgbmap; //daemons should override this variable during initialization
int logoptions;    //daemons should reset this variable to override that of library
void dprintf( 
        const int modId, /*private to each module statically initialized in
                           the module file. */
        const int dbgLevel, const char *file, 
        const int line, const char *fmt, 
        ... )
{
    static const char *levels[] = {"pan","fat","err","war","inf","sys"};
    va_list  ap;
    char time[512]={'\0'};
    char logstring[512];

    if(dbgbmap & modId)
    {
        va_start(ap,fmt);
        sprintf(logstring,"\n[%3s] %s %s:%d",levels[dbgLevel],current_time(time),file,line);
        vsprintf(logstring+strlen(logstring),fmt,ap);
        va_end(ap);

        int priority = 0x0;
        switch(dbgLevel) 
        {
            case INFO:
                priority = LOG_INFO;
                break;
            case WARN:
                priority = LOG_WARNING;
                break;
            case ERROR:
                priority = LOG_ERR;
                break;
            case SYSERR:
                {
                    extern int errno;
                    char reason[256];
                    strerror_r(errno,reason,256);
                    strcat(logstring,reason); 
                    errno = 0x0;
                    priority = LOG_ERR;
                }
                break;
            case PANIC:
                fprintf(stderr,"%s",logstring);
                syslog(LOG_EMERG,"%s",logstring);
                abort();
            case FATAL:
                fprintf(stderr,"%s",logstring);
                syslog(LOG_CRIT,"%s",logstring);
                exit(-1); 
        }

        if(logoptions & WRITE_TO_SYSLOG)
            syslog(priority,"%s",logstring);
        else if(logoptions & WRITE_TO_CONSOLE)
            fprintf(stderr,"%s",logstring);
    }
    return;
}

void 
_aprint(bool _eval, ... )
{
    va_list  ap1;
    char *fmt = nullptr;
    va_start(ap1,_eval);
    fmt=va_arg(ap1,char*);
    vfprintf(stderr,fmt,ap1);
    vsyslog(LOG_EMERG, fmt, ap1);
    va_end(ap1);
	return;
}

//our own equivalent of strDup with "new" operator 
char *
strDup(const char *istr) 
{
	int len = strlen(istr);
	char *ostr = static_cast<char*>(operator new(len+1));
	assert(ostr);
	strcpy(ostr, istr);
	return ostr;
}

//A modified version of splice which tries to flush all the output to the pipe 
//All the file descriptors given to the splice_all should be nonblocking else 
//splice_all returns an error.
int
splice_all(int fd_in, 
		loff_t *off_in, 
		int fd_out, 
		loff_t *off_out, 
		size_t len, 
		unsigned int flags)
{
	size_t toBeSpliced = len;
	ssize_t spliced = 0;
	do {
		spliced = ::splice(fd_in, off_in, fd_out, off_out, toBeSpliced, flags);
		if (spliced < 0) return -1;
		toBeSpliced -= spliced;
	} while (toBeSpliced);
	return len;
}

//verify whether the address string is a valid ipv4 address.
//regular expression courtesy: http://regex-for.com/ip/#At_a_Glance_Table_of_Regular_Expressions_for_IP_Addresses.
//FIXME: change to std::regex once it is supported by the g++.
bool 
isValidIpv4(std::string &address)
{
	boost::regex rx("([01]?\\d\\d?|2[0-4]\\d|25[0-5])(\\.([01]?\\d\\d?|2[0-4]\\d|25[0-5])){3}");
	try
	{
		if(boost::regex_match(address, rx))
			return true;
	}
	catch(boost::regex_error &ex)
	{
		return false;
	}
	return false;
}

//verify whether the address string is a valid ipv6 address.
bool
isValidIpv6(std::string &address)
{
	boost::regex rx("(:(:|(:[\\dA-Fa-f]{1,4}){1,7}))|([\\dA-Fa-f]{1,4}:(:|(:[\\dA-Fa-f]{1,4}){1,6}))|(([\\dA-Fa-f]{1,4}:){2}(:|(:[\\dA-Fa-f]{1,4}){1,5}))|(([\\dA-Fa-f]{1,4}:){3}(:|(:[\\dA-Fa-f]{1,4}){1,4}))|(([\\dA-Fa-f]{1,4}:){4}(:|(:[\\dA-Fa-f]{1,4}){1,3}))|(([\\dA-Fa-f]{1,4}:){5}(:|(:[\\dA-Fa-f]{1,4}){1,2}))|(([\\dA-Fa-f]{1,4}:){6}(:|(:[\\dA-Fa-f]{1,4})))|(([\\dA-Fa-f]{1,4}:){7}(:|[\\dA-Fa-f]{1,4}))|((:(:|(:[\\dA-Fa-f]{1,4}){1,5}:))|([\\dA-Fa-f]{1,4}:(:|(:[\\dA-Fa-f]{1,4}){1,4}:))|(([\\dA-Fa-f]{1,4}:){2}(:|(:[\\dA-Fa-f]{1,4}){1,3}:))|(([\\dA-Fa-f]{1,4}:){3}(:|(:[\\dA-Fa-f]{1,4}){1,2}:))|(([\\dA-Fa-f]{1,4}:){4}(:|:[\\dA-Fa-f]{1,4}:))|(([\\dA-Fa-f]{1,4}:){5}:)|(([\\dA-Fa-f]{1,4}:){6}))([01]?\\d\\d?|2[0-4]\\d|25[0-5])(\\.([01]?\\d\\d?|2[0-4]\\d|25[0-5])){3}");
	try
	{
		return (boost::regex_match(address, rx));
	}
	catch(boost::regex_error &ex)
	{
		return false;
	}
	return false;
}

void
squeeze_white_spaces(char *line_buf)
{
    char temp_buf[2000], *ptr1 = temp_buf, *ptr2 = line_buf;
    bool leading = false, space_found = false;

    /* count one or more tabs and spaces as one */
    if ((ptr2[0] == '\t') || (ptr2[0] == ' ')) {
        leading = true;
    }

skip_ws:
    /* skip white space , tabs */
    while(((*ptr2 == ' ') || (*ptr2 == '\t')) && (*ptr2 != '\0')) {
        ptr2++;
        space_found = true;
    }


    if (*ptr2 == '\0') { /* we are done with squeezing */
        *ptr1 = '\0';
        /* remove the trailing white space just before the '\0' character replace it with '\0' */
        if(temp_buf[strlen(temp_buf)] == ' ') temp_buf[strlen(temp_buf)] = '\0';
        strcpy(line_buf, temp_buf);
        return;
    }

    if (space_found) {
        if (!leading) {
            *ptr1++ = ' '; /* if its not leading then put space */
        } else {
            leading = false;
        }
        space_found = false;
    }


    *ptr1++ = *ptr2++;
    goto skip_ws;
}

//generate passwords of length 10 characters with just letters
static char alpha[] =
{'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t',\
    'u','v','w','x','y','z',\
 'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T', \
 'U','V','W','X','Y','Z'};

//rand function to give us a number between 0 and 52
static unsigned int
randr(unsigned int min, unsigned int max)
{
    double scaled = (double)rand()/RAND_MAX;
    unsigned int res = ((max - min +1)*scaled + min);
    return res;
}

//Algorithm uses current time stamp as the seed and the string only varies after a second. 
//Its taken forgranted that we will only get one request per second and wont be giving 
//predictable passwords.
static char *
genpass(char *passwd, int len)
{
    srand(time(nullptr));
    memset(passwd, '\0', len);
    int i = 0;
    for (i = 0 ; i < 10 ; i++) passwd[i] = alpha[randr(0,51)];
    return passwd;
}

static int 
mini(int x, int y)
{ 
    return(y^((x^y) & -(x<y))); 
}

//calculate the damerau-levenshtein-distance between the arguments and
//return it. a return of 0 means the strings are equal.
static int
get_dld_distance(char *s, char *t)
{
    int n = strlen(s), m = strlen(t);

    if(!(n && m)) return -1;

    int p[n+1], d[n+1], _d[n+1], cost, i, j;
    char t_j;

    for (i = 0; i<=n; i++) p[i] = i;

    for (j = 1; j<=m; j++) {
        t_j = *strchr(t,t[j-1]);
        d[0] = j;
        for (i=1; i<=n; i++) {
            cost = (*strchr(s,s[i-1])==t_j) ? 0 : 1;
            d[i] = mini(mini(d[i-1]+1, p[i]+1),  p[i-1]+cost);  
        }

        memcpy(_d, p, sizeof(p));
        memcpy(p, d, sizeof(p));
        memcpy(d, _d, sizeof(p));
    }

    return p[n];
}

//convert a given number to its string form.
std::string 
num2String(int num)
{
    std::ostringstream convert;
    convert << num;
    return convert.str();
}

void
setCapability(int caps)
{
    __user_cap_header_struct u = {_LINUX_CAPABILITY_VERSION_3, getpid()};
    __user_cap_data_struct   d;
    memset(&d, 0, sizeof(__user_cap_data_struct));
    return;
}

bool
isCapabilitySet(int caps)
{
    __user_cap_header_struct u = {_LINUX_CAPABILITY_VERSION_3, getpid()};
    __user_cap_data_struct   d;
    memset(&d, 0, sizeof(__user_cap_data_struct));
    return false;
}
