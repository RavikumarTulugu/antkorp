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

#ifndef __INC_TRIE_H__
#define __INC_TRIE_H__

#include <iostream>
#include <string>
#include <cstring>

template <typename T = int>
class Trie
{
	T data;
	Trie *next[256] = { nullptr };
	int charCount[256] = {0};
	int useCount = 0; // shoot the node when this drops to -ve.
    bool dynamic = false; //will be true if this is created by new.
    bool isLeaf = true; //every node is born a leaf.
	void _print(Trie *t, std::string &prefix)
    {
        for(unsigned int i = 0 ; i < 256 ; i++) 
            if(t->next[i] != t){
                prefix.push_back(i);
                _print(t->next[i], prefix);
                prefix.pop_back();
            }
        if(t->isLeaf) std::cerr<<"\n"<<prefix;
        return;
    }

    void _incinerate(Trie *t)
    {
        for(unsigned int i = 0; i < 256; i++)
            if(t->next[i] != t){
                Trie::_incinerate(t->next[i]);
                if(t->next[i]->dynamic) delete t->next[i];
                t->next[i] = t;
            }
        return;
    }

    public:
    Trie(T _data) 
        : 
            data(_data) 
    { 
        for(unsigned int i = 0 ; i < 256; i++) 
            next[i] = this; 
        return; 
    }
    Trie() 
    { 
        for(unsigned int i = 0 ; i < 256; i++) 
            next[i] = this; 
        return; 
    }
    ~Trie() 
    { 
        return; 
    }

	void insert(std::string &item, T _data)
	{
		Trie *pointer = this, *npointer = pointer;
		for(const char *key = item.c_str(); *key; key++){
			++pointer->useCount;
			++pointer->charCount[*key];
			pointer = pointer->next[*key];
			if(pointer == npointer){
                pointer->isLeaf = false;
                npointer->next[*key] = new Trie(_data);
                npointer->next[*key]->dynamic = true;
                pointer = npointer->next[*key];
            }
			npointer = pointer;
		}
		return;
	}
    
    //return the use count to the upper calls in chain so that they can deduct the 
    //use count from their counts accordingly.
    int _delete(Trie *t, const char *key)
    {
        int useCount = 0;
        if(t){
            if(strlen(key) == 1){ //i hate to do this but no other way :-(
                if (t->next[*key] != t){
                    int oldUseCount = t->next[*key]->useCount;
                    Trie::_incinerate(t->next[*key]);
                    delete t->next[*key];
                    t->next[*key] = t;
                    return oldUseCount;
                }
            }else{
                useCount = Trie::_delete(t->next[*key], key + 1);
                if (useCount){
                    t->charCount[*key] -= useCount;
                    t->useCount-= useCount;
                }
            }
        }
        return useCount;
    }

    //remove the key and recursively its children.
    //the item need not be an exact match it can be a substring match.
    void remove(std::string &item)
    {
        if (!isPresent(item)) return;
        _delete(this, item.c_str());
        return;
    }

    bool isPresent(std::string &item)
    {
		Trie *pointer = this, *shadow = nullptr;
		unsigned int length = 0;
        const char *key = item.c_str();
		for(; *key; key++){
            shadow = pointer;
			pointer = pointer->next[*key];
			if(pointer == shadow) break;
			length++;
		}
        return length == item.size();
    }

    bool getData(std::string &item, T *_data)
    {
		Trie *pointer = this, *shadow = nullptr;
		unsigned int length = 0;
        const char *key = item.c_str();
		for(; *key; key++){
            shadow = pointer;
			pointer = pointer->next[*key];
			if(pointer == shadow) break;
			length++;
		}
        if (length == item.size()){ 
            *_data = data;
            return true; 
        }
        return false;
    }

	void print()
	{
        std::string prefix = "";
		Trie::_print(this, prefix);
		return;
	}
};
#endif

typedef Trie<void*> genericTrieT;
genericTrieT gTrie;

typedef Trie<int> intTrie; 
intTrie iTrie;

#if 0
int 
main(int ac, char **av)
{
    std::string f1("/home/rk");
    std::string f2("/home/rk/task.hh");
    std::string f3("/home/rk/var");
    std::string f4("/home/rk/iobuf.hh");
    std::string f5("/home/rk/visib.cc");
    std::string f6("/home/rk/logger.cc");
    std::string f7("/home/rk/clear");
    std::string f8("/home/rk/.gitconfig");
    std::string f9("/home/rk/akorp_svc_endpoint");
    std::string f10("/home/rk/simple_trie");
    std::string f11("/home/rk/simple_trie/.git");
    std::string f12("/home/rk/simple_trie/.git/info");
    std::string f13("/home/rk/simple_trie/.git/info/exclude");
    std::string f14("/home/rk/simple_trie/.git/packed-refs");
    std::string f15("/home/rk/simple_trie/.git/config");
    std::string f16("/home/rk/simple_trie/.git/hooks");
    std::string f17("/home/rk/simple_trie/.git/hooks/pre-commit.sample");
    std::string f18("/home/rk/simple_trie/.git/hooks/post-update.sample");
    std::string f19("/home/rk/simple_trie/.git/hooks/pre-rebase.sample");
    std::string f20("/home/rk/simple_trie/.git/hooks/pre-applypatch.sample");

    std::cerr<<
        "\n"<<f1<<
        "\n"<<f2<<
        "\n"<<f3<<
        "\n"<<f4<<
        "\n"<<f5<<
        "\n"<<f6<<
        "\n"<<f7<<
        "\n"<<f8<<
        "\n"<<f9<<
        "\n"<<f10<<
        "\n"<<f11<<
        "\n"<<f12<<
        "\n"<<f13<<
        "\n"<<f14<<
        "\n"<<f15<<
        "\n"<<f16<<
        "\n"<<f17<<
        "\n"<<f18<<
        "\n"<<f19<<
        "\n"<<f20;

    std::cerr<<"\ninserting f1:"<<f1;
    iTrie.insert(f1, -1);
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f2:"<<f2;
    iTrie.insert(f2, -1);
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f3:"<<f3;
    iTrie.insert(f3, -1);
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f4:"<<f4;
    iTrie.insert(f4, -1);
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f5:"<<f5;
    iTrie.insert(f5, -1);
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f6:"<<f6;
    iTrie.insert(f6, -1);
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f7:"<<f7;
    iTrie.insert(f7, -1);
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f8:"<<f8;
    iTrie.insert(f8, -1);
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f9:"<<f9;
    iTrie.insert(f9, -1);
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f10:"<<f10;
    iTrie.insert(f10, -1);
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f11:"<<f11;
    iTrie.insert(f11, -1);
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f12:"<<f12;
    iTrie.insert(f12, -1);
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f13:"<<f13;
    iTrie.insert(f13, -1);
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f14:"<<f14;
    iTrie.insert(f14, -1);
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f15:"<<f15;
    iTrie.insert(f15, -1);
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f16:"<<f16;
    iTrie.insert(f16, -1);
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f17:"<<f17;
    iTrie.insert(f17, -1);
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f18:"<<f18;
    iTrie.insert(f18, -1);
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f19:"<<f19;
    iTrie.insert(f19, -1);
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f20:"<<f20;
    iTrie.insert(f20, -1);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f20:"<<f20;
    iTrie.remove(f20);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f19:"<<f19;
    iTrie.remove(f19);
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f18:"<<f18;
    iTrie.remove(f18);
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f17:"<<f17;
    iTrie.remove(f17);
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f16:"<<f16;
    iTrie.remove(f16);
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f15:"<<f15;
    iTrie.remove(f15);
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f14:"<<f14;
    iTrie.remove(f14);
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f13:"<<f13;
    iTrie.remove(f13);
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f12:"<<f12;
    iTrie.remove(f12);
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f11:"<<f11;
    iTrie.remove(f11);
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f10:"<<f10;
    iTrie.remove(f10);
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f9:"<<f9;
    iTrie.remove(f9);
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f8:"<<f8;
    iTrie.remove(f8);
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f7:"<<f7;
    iTrie.remove(f7);
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f6:"<<f6;
    iTrie.remove(f6);
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f5:"<<f5;
    iTrie.remove(f5);
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f4:"<<f4;
    iTrie.remove(f4);
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f3:"<<f3;
    iTrie.remove(f3);
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f2:"<<f2;
    iTrie.remove(f2);
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f1:"<<f1;
    iTrie.remove(f1);
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");
    std::cerr<<"\ninserting f1:"<<f1;
    iTrie.insert(f1, -1);
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f2:"<<f2;
    iTrie.insert(f2, -1);
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f3:"<<f3;
    iTrie.insert(f3, -1);
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f4:"<<f4;
    iTrie.insert(f4, -1);
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f5:"<<f5;
    iTrie.insert(f5, -1);
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f6:"<<f6;
    iTrie.insert(f6, -1);
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f7:"<<f7;
    iTrie.insert(f7, -1);
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f8:"<<f8;
    iTrie.insert(f8, -1);
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f9:"<<f9;
    iTrie.insert(f9, -1);
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f10:"<<f10;
    iTrie.insert(f10, -1);
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f11:"<<f11;
    iTrie.insert(f11, -1);
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f12:"<<f12;
    iTrie.insert(f12, -1);
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f13:"<<f13;
    iTrie.insert(f13, -1);
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f14:"<<f14;
    iTrie.insert(f14, -1);
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f15:"<<f15;
    iTrie.insert(f15, -1);
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f16:"<<f16;
    iTrie.insert(f16, -1);
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f17:"<<f17;
    iTrie.insert(f17, -1);
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f18:"<<f18;
    iTrie.insert(f18, -1);
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f19:"<<f19;
    iTrie.insert(f19, -1);
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f20:"<<f20;
    iTrie.insert(f20, -1);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f20:"<<f20;
    iTrie.remove(f20);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f19:"<<f19;
    iTrie.remove(f19);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f18:"<<f18;
    iTrie.remove(f18);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f17:"<<f17;
    iTrie.remove(f17);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f16:"<<f16;
    iTrie.remove(f16);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f15:"<<f15;
    iTrie.remove(f15);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f14:"<<f14;
    iTrie.remove(f14);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f13:"<<f13;
    iTrie.remove(f13);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f12:"<<f12;
    iTrie.remove(f12);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f11:"<<f11;
    iTrie.remove(f11);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f10:"<<f10;
    iTrie.remove(f10);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f9:"<<f9;
    iTrie.remove(f9);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f8:"<<f8;
    iTrie.remove(f8);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f8:"<<f8;
    iTrie.remove(f8);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f8:"<<f8;
    iTrie.remove(f8);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f8:"<<f8;
    iTrie.remove(f8);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f8:"<<f8;
    iTrie.remove(f8);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f7:"<<f7;
    iTrie.remove(f7);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f6:"<<f6;
    iTrie.remove(f6);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f5:"<<f5;
    iTrie.remove(f5);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f4:"<<f4;
    iTrie.remove(f4);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f3:"<<f3;
    iTrie.remove(f3);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f2:"<<f2;
    iTrie.remove(f2);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f1:"<<f1;
    iTrie.remove(f1);
    std::cerr<<"\nchecking f20: "<<f20<<(iTrie.isPresent(f20) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f19: "<<f19<<(iTrie.isPresent(f19) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f18: "<<f18<<(iTrie.isPresent(f18) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f17: "<<f17<<(iTrie.isPresent(f17) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f16: "<<f16<<(iTrie.isPresent(f16) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f15: "<<f15<<(iTrie.isPresent(f15) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f14: "<<f14<<(iTrie.isPresent(f14) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f13: "<<f13<<(iTrie.isPresent(f13) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f12: "<<f12<<(iTrie.isPresent(f12) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f11: "<<f11<<(iTrie.isPresent(f11) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f10: "<<f10<<(iTrie.isPresent(f10) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f9: "<<f9<<(iTrie.isPresent(f9) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");
#endif

#if 0
    std::string f1("/a");
    std::string f2("/a/b");
    std::string f3("/a/b/c");
    std::string f4("/a/b/c/d");
    std::string f5("/a/b/c/d/e");
    std::string f6("/a/b/c/d/e/f");
    std::string f7("/a/b/c/d/e/f/g");
    std::string f8("/a/b/c/d/e/f/g/h");

    std::cerr<<"\ninserting f1:"<<f1;
    iTrie.insert(f1, -1);
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f2:"<<f2;
    iTrie.insert(f2, -1);
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f3:"<<f3;
    iTrie.insert(f3, -1);
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f4:"<<f4;
    iTrie.insert(f4, -1);
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f5:"<<f5;
    iTrie.insert(f5, -1);
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f6:"<<f6;
    iTrie.insert(f6, -1);
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f7:"<<f7;
    iTrie.insert(f7, -1);
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f8:"<<f8;
    iTrie.insert(f8, -1);
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");

    std::cerr<<"\nremoving f5:"<<f5;
    iTrie.remove(f5);
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f5:"<<f5;
    iTrie.insert(f5, -1);
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f6:"<<f6;
    iTrie.insert(f6, -1);
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f7:"<<f7;
    iTrie.insert(f7, -1);
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");

    std::cerr<<"\ninserting f8:"<<f8;
    iTrie.insert(f8, -1);
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f8: "<<f8<<(iTrie.isPresent(f8) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f7: "<<f7<<(iTrie.isPresent(f7) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f6: "<<f6<<(iTrie.isPresent(f6) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f5: "<<f5<<(iTrie.isPresent(f5) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f4: "<<f4<<(iTrie.isPresent(f4) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f3: "<<f3<<(iTrie.isPresent(f3) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f2: "<<f2<<(iTrie.isPresent(f2) ? " TRUE" : " FALSE");
    std::cerr<<"\nchecking f1: "<<f1<<(iTrie.isPresent(f1) ? " TRUE" : " FALSE");
    return 0;
}
#endif
