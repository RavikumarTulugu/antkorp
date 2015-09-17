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

//utility which can simulate a client connection for simulating client activities 
//can be used to create initial organization and user objects.
#include <unistd.h>
#include "clntsim.hh"
#include "common.hh"

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

// pull out the type of messages sent by our config
#ifdef AKORP_SSL_CAPABLE
typedef websocketpp::client<websocketpp::config::asio_tls_client> client;
typedef websocketpp::config::asio_tls_client::message_type::ptr message_ptr;
typedef websocketpp::lib::shared_ptr<boost::asio::ssl::context> context_ptr;
#else
typedef websocketpp::client<websocketpp::config::asio_client> client;
typedef websocketpp::config::asio_client::message_type::ptr message_ptr;
#endif

client c;
boost::asio::deadline_timer *responseWaitTimer = nullptr;
#ifdef AKORP_SSL_CAPABLE
static std::string uri = "ws://";
#else
static std::string uri = "wss://";
#endif
static std::string server, org = "", user, password, admin_passwd;
static bool userAdd = false, orgAdd = false, orgDelete = false, userDelete = false, adminPasswdReset = false;
static int respCount = 0;
static int requestCount = 0;

#ifdef AKORP_SSL_CAPABLE
static context_ptr 
on_tls_init(websocketpp::connection_hdl hdl) 
{
    std::chrono::high_resolution_clock::time_point m_tls_init = std::chrono::high_resolution_clock::now();
    context_ptr ctx(new boost::asio::ssl::context(boost::asio::ssl::context::tlsv1));

    try {
        ctx->set_options(boost::asio::ssl::context::default_workarounds |
                //boost::asio::ssl::context::no_sslv2 |
                boost::asio::ssl::context::single_dh_use);
    } catch (std::exception& e) {
        std::cout << e.what() << std::endl;
    }
    return ctx;
}
#endif
static void 
timeout_handler(boost::system::error_code ec)
{
    if (!ec){
        std::cerr<<"response timeout";
        exit(-1);
    }
    return;
}

static void
on_message(client* c, websocketpp::connection_hdl hdl, message_ptr msg) 
{
    respCount++;
    responseWaitTimer->cancel();
    std::cerr<<msg->get_payload();
    if(orgAdd){
        std::cerr<<"\nSending org creation message.";
        orgAdd = false;
        tupl tv[] = 
        {
            {"mesgtype", std::string("request")},
            {"request", std::string("create_org")},
            {"cookie"  , std::string("abcd")},
            {"org"  , org},
            {"email"  , std::string("rk@antkorp.in")},
        };
        size_t size = sizeof(tv)/sizeof(tupl);
        std::string payload = putJsonVal(tv, size);
        uint32_t length = payload.length();
        char header[36] =  {'\0'}, *ptr = header;
        memset(header, ' ', 32);
        strncpy(header, "auth", strlen("auth"));
        ptr += 32;
        length = htonl(length);
        mempcpy(ptr, &length, sizeof(uint32_t));
        string json(reinterpret_cast<char const*>(header), sizeof(header));
        json += payload;
        c->send(hdl, json, websocketpp::frame::opcode::binary);
        responseWaitTimer->async_wait(timeout_handler);
        std::cerr<<"\nawaiting response from server.";
    }
    if(userAdd){
        userAdd = false;
        if (org == "") { std::cerr<<"org name not given:"; exit(-1); }
        if (password == "") { std::cerr<<"password name not given:"; exit(-1); }
        std::cerr<<"\nSending user creation message.";
        tupl tv[] = 
        {
            {"mesgtype", std::string("request")},
            {"request", std::string("adduser")},
            {"cookie"  , std::string("abcdef")},
            {"uname"  , user},
            {"first_name"  , std::string("")},
            {"password"  , password},
            {"oid"  , org}
        };
        size_t size = sizeof(tv)/sizeof(tupl);
        std::string payload = putJsonVal(tv, size);
        uint32_t length = payload.length();
        char header[36] =  {'\0'}, *ptr = header;
        memset(header, ' ', 32);
        strncpy(header, "auth", strlen("auth"));
        ptr += 32;
        length = htonl(length);
        mempcpy(ptr, &length, sizeof(uint32_t));
        string json(reinterpret_cast<char const*>(header), sizeof(header));
        json += payload;
        c->send(hdl, json, websocketpp::frame::opcode::binary);
        responseWaitTimer->async_wait(timeout_handler);
    }
    if(userDelete){
        userDelete = false;
        std::string json;
        c->send(hdl, json, websocketpp::frame::opcode::binary);
        responseWaitTimer->async_wait(timeout_handler);
    }
    if(orgDelete){
        orgDelete = false;
        std::string json;
        c->send(hdl, json, websocketpp::frame::opcode::binary);
        responseWaitTimer->async_wait(timeout_handler);
    }

    if(adminPasswdReset){
        if (org == "") { std::cerr<<"org name not given:"; exit(-1); }
        adminPasswdReset = false;
        std::cerr<<"\nSending admin password reset message.";
        tupl tv[] = 
        {
            {"mesgtype", std::string("request")},
            {"request", std::string("reset_admin_password")},
            {"cookie"  , std::string("abcdef")},
            {"new_password", password},
            {"org", org}
        };
        size_t size = sizeof(tv)/sizeof(tupl);
        std::string payload = putJsonVal(tv, size);
        uint32_t length = payload.length();
        char header[36] =  {'\0'}, *ptr = header;
        memset(header, ' ', 32);
        strncpy(header, "auth", strlen("auth"));
        ptr += 32;
        length = htonl(length);
        mempcpy(ptr, &length, sizeof(uint32_t));
        string json(reinterpret_cast<char const*>(header), sizeof(header));
        json += payload;
        c->send(hdl, json, websocketpp::frame::opcode::binary);
        responseWaitTimer->async_wait(timeout_handler);
    }
    return;
}


int
main(int ac, char* av[]) 
{
    try 
    {
        if(getuid() != 0) { std::cerr<<"You must be root to run this program"; return -1; }
        boost::program_options::options_description desc("Allowed options");
        desc.add_options()
            ("help", "produce help message")
            ("certificate", boost::program_options::value<std::string>(), "ssl certificate location file path.")
            ("server", boost::program_options::value<std::string>(), "antkorp network gateway along with port.")
            ("org", boost::program_options::value<std::string>(), "organization name to be used for creating/deleting user.")
            ("org-create", boost::program_options::value<std::string>(), "organization name to be created.")
            ("org-delete", boost::program_options::value<std::string>(), "organization name to be deleted.")
            ("user-create", boost::program_options::value<std::string>(), "user name to be created.")
            ("user-delete", boost::program_options::value<std::string>(), "user name to be deleted.")
            ("admin-passwd-reset", boost::program_options::value<std::string>(), "admin password reset")
            ("password", boost::program_options::value<std::string>(), "password of the user for user creation/reset.")
        ;

        boost::program_options::variables_map vm;
        boost::program_options::store(boost::program_options::parse_command_line(ac, av, desc), vm);
        boost::program_options::notify(vm);

        if(vm.count("server")){ server = vm["server"].as<std::string>(); }
        if(vm.count("org-create")){ org = vm["org-create"].as<std::string>(); orgAdd = true; requestCount++; }
        if(vm.count("org")){ org = vm["org"].as<std::string>(); }
        if(vm.count("user-create")){ user = vm["user-create"].as<std::string>(); userAdd = true; requestCount++;}
        if(vm.count("password")) password = vm["password"].as<std::string>();
        if(vm.count("org-delete")){ org = vm["org-delete"].as<std::string>(); orgDelete = true; requestCount++; }
        if(vm.count("user-delete")){ user = vm["user-delete"].as<std::string>(); userDelete = true; requestCount++; }
        if(vm.count("admin-passwd-reset")){ admin_passwd = vm["admin-passwd-reset"].as<std::string>(); adminPasswdReset = true; requestCount++; }
        if (vm.count("help") || (ac == 1)){ std::cerr << desc << "\n"; return 0; }

        boost::asio::io_service iosvc;
        responseWaitTimer = new boost::asio::deadline_timer(iosvc);
        responseWaitTimer->expires_from_now(boost::posix_time::seconds(3));
        responseWaitTimer->async_wait(timeout_handler);
        c.init_asio(&iosvc);
        c.set_message_handler(bind(&on_message,&c,::_1,::_2));
#ifdef AKORP_SSL_CAPABLE
        c.set_tls_init_handler(bind(&on_tls_init, ::_1));
#endif
        websocketpp::lib::error_code ec;
        server = uri + server + "/services=ngw,auth,fmgr,kons,rtc,calendar";
        std::cerr<<"opening connection to : "<<server;
        client::connection_ptr con = c.get_connection(server, ec);
        c.connect(con);
        while(respCount < (requestCount + 1)) c.run_one(); //1 extra for the registration response.
    }
    catch (const std::exception &e){ std::cerr << e.what() << std::endl; return -1; }
    catch (websocketpp::lib::error_code e){ std::cerr << e.message() << std::endl; return -1; }
    catch (...){ std::cerr << "other exception" << std::endl; return -1; }
    return 0;
}
