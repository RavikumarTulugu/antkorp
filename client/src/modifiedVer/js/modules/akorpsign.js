define("akorpsign", [ "jquery", "underscore", "backbone", "akpauth","akputils" ],
		function($, _, Backbone,auth,utils) {
			/*
			 * Adding Social Media authentication 
			 * providers and Providing own authentication
			 */
	
	/*
	 * How it works
	 * 
	 * I 1) Get providers list from the app
	 *   2) enable the providers from list,show loading
	 *   3) check status of providers
	 *   4) if anyone of the provider is connected gives getpass
	 *   5) else after checking all providers render Provider login system
	 *   
	 *   
	 * II 1) user clicks on provider show loading 
	 *    2) get status of the given information
	 *    3) if true gives gatepass
	 *    4) else again show providers login system
	 *    
	 * III 1) user clicks on register, hide providers
	 *     2) show register dialog
	 *     3) till oncomplete show animation
	 *     4) on success give gatepass
	 *     
	 *     
	 */
			
			var socialMedia = function(options){
				this.defaults={
						serivces:{self:true,
							facebook:true,
							gplus:true
							},
							
				}
				this.settings=options;
				this.authenticated=false;
				this.statusChecked=0;
				this.providers={};
				this.status={};
			}
			socialMedia.prototype.addProviders=function(providers){
				// setting up providers
				this.providers=providers;
				for(var i=0;i<providers.length;i++){
					if(providers[i]=="facebook"){
						enableFBProvider();
					}else if(providers[i] == "self"){
						enableSelfProvider();
					}
				}
			}
			socialMedia.prototype.putStatus=function(provider,status){
				//status saving
				
				if(status=="connected" && !this.authenticated){
					this.authenticated=true;
					
				}
				this.status[provider]=status;
				this.statusChecked++;
				
				
				if(this.statusChecked == this.providers.length){
					this.showProviderInterfaces();
				}
			}
			socialMedia.prototype.showProviderInterfaces=function(){
				
				
				var providers=this.providers;
				var count=providers.length;
				
				for(var i=0; i<count; i++){
					if(providers[i]=="facebook"){
						showFBLogin();
					}else if(providers[i]=="self"){
						showSelfLogin();
					}
				}
			}
			
			var integrator = new socialMedia();
			
			/*
			 * Login Interface
			 */
			
			function providersPanel(){
				var asi = $("<span/>").append("antkorp").addClass("asi");
				this.el = $('<div id="logboard" class=" modal loginsts"></div>')
				.append(asi).appendTo("body");
				utils.makeCenter("#logboard");
			}
			providersPanel.prototype.add=function(provider,callback){
				if(provider == "facebook"){
					
					var fbbtn = $("<button/>")
					.append("<i class='facebook_24'></i><span> Connect with facebook</span>")
					.addClass("facebook").bind('click',callback).css("display","none");
					
					this.el.append('<div id="fb-root"></div>').append(fbbtn);
					
				}else if(provider == "self"){
					
					
					var entryform = $("<form><input type=text placeholder='Enter your Name' />"+
							+"<input type=submit value='sign In' class=btn /></form>").submit(callback);
					
			      var loginform = $("<div/>").append(entryform).addClass("loginform").appendTo(this.el);
					
					
				}
			}
			
			var panel=new providersPanel();
			
			function openApp(e) {
				// e.preventDefault();
				$("#logOverlay,#logboard").hide();
				$(".akorp-ui").show();
			}
			
			
			
			/*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			 * self Login
			 * ********************************************************************************
			 */
			function enableSelfProvider(){
				//panel.add("self",selfLogin);
				selfProviderCheckStatus();
			}
			
			function showSelfLogin(){
				panel.add("self",selfLogin);
			}
			
			function selfProviderLogin(){
				return true;
			}
			
			function selfProviderCheckStatus(){
				//get from index DB
				//post it to handleSelfProviderStatus
				handleSelfProviderStatus({status:"not_autherized"});
			}
			function handleSelfProviderStatus(response){
				integrator.putStatus("self",response.status);
				return response.status;
			}
			
			
			
			
			
			
			
			
			/************************************************************************************
			 * Facebook login system
			 * **********************************************************************************
			 */
			var fbusername,fbstatus,fname,fbemail;
			
			
			function showFBLogin(){
				 panel.add("facebook",facebookLogin);
			}
			
			function enableFBProvider(){
				
	
				(function(d) {
					var js, id = 'facebook-jssdk';
					if (d.getElementById(id)) {
						return;
					}
					js = d.createElement('script');
					js.id = id;
					js.async = true;
					js.src = "http://connect.facebook.net/en_US/all.js";
					d.getElementsByTagName('head')[0]
							.appendChild(js);
				}(document));
				
				
				
	           //panel.add("facebook",facebookLogin);
			
				window.fbAsyncInit = function() {
					FB.init({
						appId : 102016259946645,
						cookie : true,
						xfbml : true,
						oauth : true
					});
					FB.getLoginStatus(handleFBstatus);
	
					FB.Event.subscribe('auth.login', function(
							response) {
						userfbCheck();
					});
	
					FB.Event.subscribe('auth.logout', function(
							response) {
						showFacebookLoginForm();
					});
				}
			}
			
			function handleFBstatus(response){
				integrator.putStatus("facebook",response.status);
					if (response.status === 'connected') {
						var uid = response.authResponse.userID;
						var accessToken = response.authResponse.accessToken;
						userfbCheck();
					} else if (response.status === 'not_authorized') {
						// the user isloggedin to Facebook,
						// but has not authenticated your app
						// alert("not loggedin into app");
						showFacebookLoginForm();
					} else {
						// the user isn't logged in to Facebook.
						// alert("user not loggedin into facebook ");
						showFacebookLoginForm();
					}
				
			}
			
			
			function showFacebookLoginForm(){
				$("button.facebook").show();
				$('#logboard, #logOverlay').fadeIn('fast');
			}
			function facebookLogin() {
				FB.login(handleFBlogin, {
					scope : 'email'
				});
			}
			function handleFBlogin(response) {
				if (response.authResponse) {
					// console.log('Authenticated!');

				} else {
					console.log('User cancelled login or did not fully authorize.');
				}
			}

			function handleDBResponse(response, textStatus,jqXHR) {
				var resp = JSON.parse(response);
				if (fbusername) {
					if (resp.message) {

						auth.adduser(fbusername, fname);
						
					} else {
						if (!auth.loginstate) {

							auth.loginuser(fbusername);
							
						}
						prflview = false;
					}
				} else {
					console.log("User name not available");
				}
			}

			function validateUser(data) {
				$.ajax({
					url : "fblogin.php",
					type : "post",
					data : {
						userProfile : JSON.stringify(data)
					},
					success : handleDBResponse,

					error : function(jqXHR, textStatus,errorThrown) {

						console.log("The following error occured: "+ textStatus,errorThrown);
					},
					complete : function() {
						// console.log("user authentication
						// successful.")
					}
				});
			}
			function formatInfo(res) {
				var homeaddress = res.location;
				var work = res.work;
				fbinfo = {
					"dob" : res.birthday,
					"dept" : '',
					middle_name : "",
					mob : "",
					organization : "",
					jobtitle : "",
					homeaddress : "",
					"email" : res.email,
					"first_name" : res.first_name,
					"last_name" : res.last_name,
					"sex" : res.gender,
				};

				if (homeaddress) {
					fbinfo.homeaddress = homeaddress.name;
				}
				if (work) {
					if (work[0].employer)
						fbinfo.organization = work[0].employer.name;
					if (work[0].position)
						fbinfo.jobtitle = work[0].position.name;
				}

				fbemail = res.email;
				fname = res.last_name;
				fbusername = fbemail.substring(0, fbemail.lastIndexOf('@'))+ res.id;
			}

			function userfbCheck() {
				//openApp();

				FB.api('/me', function(res) {

					formatInfo(res)
					var fbData = {
						id : res.id,
						name : res.username,
						email : res.email,
						location : res.location,
						username : fbusername
					}

					validateUser(fbData);

				});

			}
			
			
			
			
			/*
			 * End of Facebook Login
			 */
			
			
			
			return integrator;
			
			
		});