/**
 * @author Rajukonga
 */
define(
		"akpTour",
		[ "jquery", "underscore", "backbone", "akputils" ],
		function($, _, Backbone, utils) {
			
			
			var descView = Backbone.View.extend({
				el : $(".tourcard"),
				events : {
					"click span.tourclsbtn" : "close"
				},
				initialize : function() {

					this.firstVisit = {
						"container" : true,
						//"dstore" : true,
						"kons" : true,
						"planner" : true,
						//"pinit" : true,
						"men" : true,
						"pdt" : true
					};

					this.positions = {
						"container" : {
							"top" : "20%",
							"left" : "30%"
						},
						
						"kons" : {
							"top" : "20%",
							"left" : "40%"
						},
						"planner" : {
							"top" : "50%",
							"left" : "20%"
						},
						/*"pinit" : {
							"top" : "40%",
							"left" : "60%"
						},"dstore" : {
							"top" : "50%",
							"left" : "60%"
						},*/

					}

					this.cards = {
						"container" : ".card1",
						
						"kons" : ".card2",
						"planner" : ".card5",
						/*"pinit" : ".card6",
						"dstore" : ".card4",
*/
					}

				},
				render : function(tabId) {

					$(".card").hide();
					$(".tourcard").hide();
					if (this.firstVisit[tabId]) {
						$(".tourcard").css(
								this.positions[tabId]).show();
						$(this.cards[tabId]).show('fade');
					}

				},
				close : function() {

					var id = $(".card:visible").data("cardid");
					this.firstVisit[id] = false;

					$(".card").hide();
					$(".tourcard").hide();

				}

			});
			return descView;
			
		
		});