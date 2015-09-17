
//This program counts the number of occurences of each word in the file.
//lifted from internet and modified to skip the symbolic characters.

#include <set>
#include <map>
#include <fstream>
#include <iostream>
#include <iterator>
#include <utility>
#include <ctype.h>

using namespace std;

//tell me whether word contains any non alpha numeric characters 
bool 
contains_symbols(string word)
{
    const char *ptr = word.c_str();
    while (*ptr) 
    { 
        if (!isalnum(*ptr) || 
            (*ptr == ')') || 
            (*ptr == '(') ||
            (*ptr == '#') ||
            (*ptr == '@') || 
            (*ptr == '^') || 
            (*ptr == '&') || 
            (*ptr == '*') || 
            (*ptr == '{') || 
            (*ptr == '}') || 
            (*ptr == '<') || 
            (*ptr == '>') || 
            (*ptr == '.') || 
            (*ptr == ',') || 
            (*ptr == '~') || 
            (*ptr == '%') || 
            (*ptr == '?') || 
            (*ptr == '+') || 
            (*ptr == '=') || 
            (*ptr == '-') || 
            (*ptr == ':') || 
            (*ptr == ';') || 
            (*ptr == ']') || 
            (*ptr == '[') || 
            (*ptr == '!') || 
            (*ptr == '$')) 
            return true; 
        ptr++; 
    } 
    return false;
}

int 
main(int ac, char** av)
{

    if(ac!= 2)
    {
        cout<<"Usage:"<<av[0]<<"filename"<<endl;
        return 1;
    }

    ifstream f(av[1]);

    //read and count words
    istream_iterator<string> i(f);
    multiset<string> s(i, istream_iterator<string>());

    //sort by count
    multimap<size_t, string> wordstats;
    for(multiset<string>::const_iterator i = s.begin(); i != s.end(); i = s.upper_bound(*i))
        if (!contains_symbols(*i)) wordstats.insert(make_pair( s.count(*i), *i));

    // output in decreasing order
    for( multimap<size_t, string>::const_reverse_iterator i = wordstats.rbegin(); i != wordstats.rend(); ++i)
        cout<<i->second<<"="<< i->first<<endl;

    return 0;
}
