/**
 * @author Rajukonga
 */
define("feedback",
		[ "jquery", "underscore", "backbone", "akputils", "akpauth" ],
		function($, _, Backbone, utils, auth) {

			var FeedbackView = Backbone.View.extend({
				el : "#feedback_dialog",
				events : {
					"submit #feedback_form" : "preventAction",

				},
				initialize : function() {
					_.bindAll(this, "handleSuccess");
				},
				render : function() {

				},
				preventAction : function(e) {
					e.preventDefault();
					var obj = {
						uid : auth.loginuserid,
						oid:auth.org.id,
						stmt : this.$(".fdbk_stmt").val(),
						email : this.$(".fdbk_email").val(),
						name : auth.activeuser.first_name,
					}

					$.ajax({
						url : "https://www.antkorp.in/php/feedback.php",
						type : "post",
						data : {
							userFeedback : obj, //JSON.stringify(obj),
						},
						success : this.handleSuccess,

						error : function(jqXHR, textStatus, errorThrown) {

							console.log("The following error occured: "
									+ textStatus);
							console.log(errorThrown);
						},

					});
				},
				handleSuccess : function(response) {
					var resp=response;

					//resp = JSON.parse(response);
					if (resp) {
						this.$(".fdbk_stmt").val("");
						this.$(".fdbk_email").val("");
						this.$el.modal("hide");
					}
				}
			});

			return FeedbackView;
		});