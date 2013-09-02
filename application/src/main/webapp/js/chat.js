
var chatApplication = new ChatApplication();

(function($){

  $(document).ready(function(){

    /**
     * Init Chat
     */
    var $chatApplication = $("#chat-application");
    chatApplication.setJuzuLabelsElement($chatApplication);
    chatApplication.attachWeemoExtension(weemoExtension);

    chatApplication.username = $chatApplication.attr("data-username");
    chatApplication.token = $chatApplication.attr("data-token");
    var chatServerURL = $chatApplication.attr("data-chat-server-url");
    chatApplication.chatIntervalChat = $chatApplication.attr("data-chat-interval-chat");
    chatApplication.chatIntervalSession = $chatApplication.attr("data-chat-interval-session");
    chatApplication.chatIntervalStatus = $chatApplication.attr("data-chat-interval-status");
    chatApplication.chatIntervalUsers = $chatApplication.attr("data-chat-interval-users");

    chatApplication.publicModeEnabled = $chatApplication.attr("data-public-mode-enabled");
    var chatPublicMode = ($chatApplication.attr("data-public-mode")=="true");
    var chatView = $chatApplication.attr("data-view");
    chatApplication.chatFullscreen = $chatApplication.attr("data-fullscreen");
    chatApplication.isPublic = (chatPublicMode == "true" && chatView == "public");
    chatApplication.jzInitChatProfile = $chatApplication.jzURL("ChatApplication.initChatProfile");
    chatApplication.jzCreateDemoUser = $chatApplication.jzURL("ChatApplication.createDemoUser");
    chatApplication.jzMaintainSession = $chatApplication.jzURL("ChatApplication.maintainSession");
    chatApplication.jzUpload = $chatApplication.jzURL("ChatApplication.upload");
    chatApplication.jzGetStatus = chatServerURL+"/getStatus";
    chatApplication.jzSetStatus = chatServerURL+"/setStatus";
    chatApplication.jzChatWhoIsOnline = chatServerURL+"/whoIsOnline";
    chatApplication.jzChatSend = chatServerURL+"/send";
    chatApplication.jzChatRead = chatServerURL+"/read";
    chatApplication.jzChatSendMeetingNotes = chatServerURL+"/sendMeetingNotes";
    chatApplication.jzChatGetRoom = chatServerURL+"/getRoom";
    chatApplication.jzChatGetCreator = chatServerURL+"/getCreator";
    chatApplication.jzChatToggleFavorite = chatServerURL+"/toggleFavorite";
    chatApplication.jzChatUpdateUnreadMessages = chatServerURL+"/updateUnreadMessages";
    chatApplication.jzUsers = chatServerURL+"/users";
    chatApplication.jzDelete = chatServerURL+"/delete";
    chatApplication.jzEdit = chatServerURL+"/edit";
    chatApplication.jzSaveTeamRoom = chatServerURL+"/saveTeamRoom";
    chatApplication.room = "";

    chatApplication.initChat();
    chatApplication.initChatProfile();

    /**
     * Init Global Variables
     *
     */
    //needed for #chat text area
    var keydown = -1;
    //needed for #edit-modal-text area
    var keydownModal = -1;
    //needed for Fluid Integration
    var labelAvailable = $chatApplication.attr("data-label-available");
    var labelAway = $chatApplication.attr("data-label-away");
    var labelDoNotDisturb = $chatApplication.attr("data-label-donotdisturb");
    var labelInvisible = $chatApplication.attr("data-label-invisible");



    /**
     ##################                           ##################
     ##################                           ##################
     ##################   JQUERY UI EVENTS        ##################
     ##################                           ##################
     ##################                           ##################
     */

    $("#PlatformAdminToolbarContainer").addClass("no-user-selection");



    $.fn.setCursorPosition = function(position){
      if(this.length === 0) return this;
      return $(this).setSelection(position, position);
    };

    $.fn.setSelection = function(selectionStart, selectionEnd) {
      if(this.length === 0) return this;
      input = this[0];

      if (input.createTextRange) {
        var range = input.createTextRange();
        range.collapse(true);
        range.moveEnd('character', selectionEnd);
        range.moveStart('character', selectionStart);
        range.select();
      } else if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(selectionStart, selectionEnd);
      }

      return this;
    };

    $.fn.focusEnd = function(){
      this.setCursorPosition(this.val().length);
      return this;
    };

    $(window).unload(function() {
      chatApplication.hidePanels();
    });

    $('#msg').focus(function() {
  //    console.log("focus on msg : "+chatApplication.targetUser+":"+chatApplication.room);
      chatApplication.updateUnreadMessages();
    });

    $('#msg').keydown(function(event) {
  //    console.log("keydown : "+ event.which+" ; "+keydown);
      if ( event.which == 18 ) {
        keydown = 18;
      }
    });

    $('#msg').keyup(function(event) {
      var msg = $(this).val();
  //    console.log("keyup : "+event.which + ";"+msg.length+";"+keydown);
      if ( event.which === 13 && keydown !== 18 && msg.length>1) {
        //console.log("sendMsg=>"+username + " : " + room + " : "+msg);
        if(!msg)
        {
          return;
        }
  //      console.log("*"+msg+"*");
        chatApplication.sendMessage(msg);

      }
      if ( keydown === 18 ) {
        keydown = -1;
      }
      if ( event.which === 13 && msg.length === 1) {
        document.getElementById("msg").value = '';
      }

    });



    $(".meeting-action-toggle").on("click", function() {
      $(".meeting-action-popup").hide();
    });

    $(".meeting-action-link").on("click", function() {
      var toggleClass = $(this).attr("data-toggle");

      if (toggleClass === "meeting-action-flag-panel" || toggleClass === "meeting-action-event-panel" || toggleClass === "meeting-action-task-panel") return;

      $(".meeting-action-panel").hide();
      $(".input-with-value").each(function() {
        $(this).val($(this).attr("data-value"));
        $(this).addClass("input-default");
      });
      var $toggle = $("."+toggleClass);
      var pheight = $toggle.attr("data-height");
      var ptitle = $toggle.attr("data-title");

      var $popup = $(".meeting-action-popup");
      $popup.css("height", pheight+"px");
      $popup.css("top", (-Math.abs(pheight)-4)+"px");
      $toggle.show();
      $(".meeting-action-title").html(ptitle);
      $popup.show();


      if (toggleClass === "meeting-action-file-panel") {
        chatApplication.getUsers(chatApplication.targetUser, function (users) {

          $(function(){

            var targetUser = chatApplication.targetUser;
            if (targetUser.indexOf("team-")>-1) {
              targetUser = users;
            }
            $('#dropzone').remove();
            var dropzone = '<div class="progressBar" id="dropzone">'
                            +'<div class="progress">'
                              +'<div class="bar" style="width: 0.0%;"></div>'
                              +'<div class="label">Drop your file here</div>'
                            +'</div>'
                          +'</div>';
            $('#dropzone-container').html(dropzone);

            $('#dropzone').filedrop({
//          fallback_id: 'upload_button',   // an identifier of a standard file input element
              url: chatApplication.jzUpload,              // upload handler, handles each file separately, can also be a function taking the file and returning a url
              paramname: 'userfile',          // POST parameter name used on serverside to reference file
              data: {
                room: chatApplication.room,
                targetUser: targetUser,
                targetFullname: chatApplication.targetFullname
              },
              error: function(err, file) {
                switch(err) {
                  case 'BrowserNotSupported':
                    alert('browser does not support HTML5 drag and drop')
                    break;
                  case 'TooManyFiles':
                    // user uploaded more than 'maxfiles'
                    break;
                  case 'FileTooLarge':
                    // program encountered a file whose size is greater than 'maxfilesize'
                    // FileTooLarge also has access to the file which was too large
                    // use file.name to reference the filename of the culprit file
                    break;
                  case 'FileTypeNotAllowed':
                  // The file type is not in the specified list 'allowedfiletypes'
                  default:
                    break;
                }
              },
              allowedfiletypes: [],   // filetypes allowed by Content-Type.  Empty array means no restrictions
              maxfiles: 1,
              maxfilesize: 100,    // max file size in MBs
              uploadStarted: function(i, file, len){
                console.log("upload started : "+i+" : "+file+" : "+len);
                // a file began uploading
                // i = index => 0, 1, 2, 3, 4 etc
                // file is the actual file of the index
                // len = total files user dropped
              },
              uploadFinished: function(i, file, response, time) {
                console.log("upload finished : "+i+" : "+file+" : "+time+" : "+response.status+" : "+response.name);
                // response is the data you got back from server in JSON format.
                var msg = response.name;
                var options = response;
                options.type = "type-file";
                options.username = chatApplication.username;
                options.fullname = chatApplication.fullname;
                chatApplication.chatRoom.sendMessage(msg, options, "true", function() {
                  $("#dropzone").find('.bar').width("0%");
                  $("#dropzone").find('.bar').html("");
                  hideMeetingPanel();
                });

              },
              progressUpdated: function(i, file, progress) {
                console.log("progress updated : "+i+" : "+file+" : "+progress);
                $("#dropzone").find('.bar').width(progress+"%");
                $("#dropzone").find('.bar').html(progress+"%");
                // this function is used for large files and updates intermittently
                // progress is the integer value of file being uploaded percentage to completion
              }
            });

          });


        }, true);

      }


    });

    function hideMeetingPanel() {
      $(".meeting-action-popup").css("display", "none");
    }

    $(".input-with-value").on("click", function() {
      if ($(this).hasClass("input-default")) {
        $(this).val("");
        $(this).removeClass("input-default");
      }
    });

    $(".meeting-close-panel").on("click", function() {
      hideMeetingPanel();
    });

    $(".share-link-button").on("click", function() {
      var $uiText = $("#share-link-text");
      var text = $uiText.val();
      if (text === "" || text === $uiText.attr("data-value")) {
        return;
      }

      var options = {
        type: "type-link",
        link: text,
        from: chatApplication.username,
        fullname: chatApplication.fullname
      };
      var msg = "";

      chatApplication.chatRoom.sendMessage(msg, options, "true");
      hideMeetingPanel();

    });

    $(".raise-hand-button").on("click", function() {
      var $uiText = $("#raise-hand-comment-text");
      var text = $uiText.val();
      if (text === $uiText.attr("data-value")) {
        text = "";
      }

      var options = {
        type: "type-hand",
        from: chatApplication.username,
        fullname: chatApplication.fullname
      };
      var msg = text;

      chatApplication.chatRoom.sendMessage(msg, options, "true");
      hideMeetingPanel();

    });

    $(".question-button").on("click", function() {
      var $uiText = $("#question-text");
      var text = $uiText.val();
      if (text === "" || text === $uiText.attr("data-value")) {
        return;
      }

      var options = {
        type: "type-question",
        from: chatApplication.username,
        fullname: chatApplication.fullname
      };
      var msg = text;

      chatApplication.chatRoom.sendMessage(msg, options, "true");
      hideMeetingPanel();

    });



    $(".chat-status-chat").on("click", function() {
      var $chatStatusPanel = $(".chat-status-panel");
      if ($chatStatusPanel.css("display")==="none")
        $chatStatusPanel.css("display", "inline-block");
      else
        $chatStatusPanel.css("display", "none");
    });

    $("div.chat-menu").click(function(){
      var status = $(this).attr("status");
      chatApplication.setStatus(status, function() {
        $(".chat-status-panel").css('display', 'none');
      });
    });

    $(".msg-emoticons").on("click", function() {
      var $msgEmoticonsPanel = $(".msg-emoticons-panel");
      if ($msgEmoticonsPanel.css("display")==="none")
        $msgEmoticonsPanel.css("display", "inline-block");
      else
        $msgEmoticonsPanel.css("display", "none");
    });

    $(".emoticon-btn").on("click", function() {
      var sml = $(this).attr("data");
      $(".msg-emoticons-panel").css("display", "none");
      $msg = $('#msg');
      var val = $msg.val();
      if (val.charAt(val.length-1)!==' ') val +=" ";
      val += sml + " ";
      $msg.val(val);
      $msg.focusEnd();

    });

    $(".room-detail-fullname").on("click", function() {
      if (chatApplication.isMobileView()) {
        $(".uiLeftContainerArea").css("display", "block");
        $(".uiRightContainerArea").css("display", "none");
      }
    });


    $('#chat-search').keyup(function(event) {
      var filter = $(this).val();
      chatApplication.search(filter);
    });

    $('#team-add-user').keyup(function(event) {
      if ( event.which === 13 ) { // ENTER
        $(".team-user").each(function() {
          if ($(this).hasClass("team-user-selected")) {
            var name = $(this).attr("data-name");
            var fullname = $(this).attr("data-fullname");
            addTeamUserLabel(name, fullname);
          }
        });
      } else if ( event.which === 40 || event.which === 38) { // 40:DOWN || 38:UP
        var isUp = (event.which === 38);
        var total = $(".team-user").size();
        var done = false;
        $(".team-user").each(function(index) {
          if (!done && $(this).hasClass("team-user-selected")) {
            done = true;
            $(".team-user").removeClass("team-user-selected");
            if (isUp) {
              if (index === 0)
                $(".team-user").last().addClass("team-user-selected");
              else
                $(this).prev().addClass("team-user-selected");
            } else {
              if (index === total-1)
                $(".team-user").first().addClass("team-user-selected");
              else
                $(this).next().addClass("team-user-selected");
            }
          }
        });
        return;
      }
      var filter = $(this).val();
      if (filter === "") {
        var $userResults = $(".team-users-results");
        $userResults.css("display", "none");
        $userResults.html("");
      } else {
        chatApplication.getAllUsers(filter, function (jsonData) {
          var users = TAFFY(jsonData.users);
          var users = users();
          var $userResults = $(".team-users-results");
          $userResults.css("display", "none");
          var html = "";
          users = users.filter({name:{"!is":chatApplication.username}});
          $(".team-user-label").each(function() {
            var name = $(this).attr("data-name");
            users = users.filter({name:{"!is":name}});
          });

          users.order("fullname").limit(5).each(function (user, number) {
            $userResults.css("display", "block");
            if (user.status == "offline") user.status = "invisible";
            var classSel = "";
            if (number === 0) classSel = "team-user-selected"
            html += "<div class='team-user "+classSel+"' data-name='"+user.name+"' data-fullname='"+user.fullname+"'>";
            html += "  <span class='team-user-logo'><img src='/rest/jcr/repository/social/production/soc:providers/soc:organization/soc:"+user.name+"/soc:profile/soc:avatar' width='30px' style='width:30px;'></span>";
            html += "  <span class='chat-status-team chat-status-"+user.status+"'></span>";
            html += "  <span class='team-user-fullname'>"+user.fullname+"</span>";
            html += "  <span class='team-user-name'>"+user.name+"</span>";
            html += "</div>";
          });
          $userResults.html(html);

          $('.team-user').on("mouseover", function() {
            $(".team-user").removeClass("team-user-selected");
            $(this).addClass("team-user-selected");
          });

          $('.team-user').on("click", function() {
            var name = $(this).attr("data-name");
            var fullname = $(this).attr("data-fullname");
            addTeamUserLabel(name, fullname);
          });

        });
      }
    });

    function addTeamUserLabel(name, fullname) {
      var $usersList = $('.team-users-list');
      var html = $usersList.html();
      html += "<span class='label team-user-label' data-name='"+name+"'>"+fullname+"&nbsp;&nbsp;<i class='icon-remove icon-white team-user-remove'></i></span>";
      $usersList.html(html);
      var $teamAddUser = $('#team-add-user');
      $teamAddUser.val("");
      $teamAddUser.focus();
      var $userResults = $(".team-users-results");
      $userResults.css("display", "none");
      $userResults.html("");

      $(".team-user-remove").on("click", function() {
        $(this).parent().remove();
      });

    }

    function strip(html)
    {
      var tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent||tmp.innerText;
    }



    $(".team-edit-button").on("click", function() {
      var $uitext = $("#team-modal-name");
      $uitext.val(chatApplication.targetFullname);
      $uitext.attr("data-id", chatApplication.targetUser);

      chatApplication.getUsers(chatApplication.targetUser, function (jsonData) {
        $(".team-user-label").remove();

        var users = TAFFY(jsonData.users);
        var users = users();
        users.order("fullname").each(function (user, number) {
          if (user.name !== chatApplication.username) {
            addTeamUserLabel(user.name, user.fullname);
          }
        });

        jQuery('#team-modal').modal({"backdrop": false});
        $uitext.focus();

      });

    });

    $(".team-modal-cancel").on("click", function() {
      jQuery('#team-modal').modal('hide');
      var $uitext = $("#team-modal-name");
      $uitext.val("");
      $uitext.attr("data-id", "---");
    });

    $(".team-modal-save").on("click", function() {
      var $uitext = $("#team-modal-name");
      var teamName = $uitext.val();
      var teamId = $uitext.attr("data-id");
      jQuery('#team-modal').modal('hide');

      var users = chatApplication.username;
      $(".team-user-label").each(function(index) {
        var name = $(this).attr("data-name");
        users += ","+name;
      });

      chatApplication.saveTeamRoom(teamName, teamId, users, function(data) {
        var teamName = data.name;
        var roomId = "team-"+data.room;
        chatApplication.refreshWhoIsOnline(roomId, teamName);
      });

      $uitext.val("");
      $uitext.attr("data-id", "---");

    });


    $(".btn-weemo").on("click", function() {
      if (!$(this).hasClass("disabled"))
        chatApplication.createWeemoCall();
    });

    $(".btn-weemo-conf").on("click", function() {
      if (!$(this).hasClass("disabled"))
        chatApplication.joinWeemoCall();
    });

    $(".text-modal-close").on("click", function() {
      $('#text-modal').modal('hide');
    });

    $(".edit-modal-cancel").on("click", function() {
      $('#edit-modal').modal('hide');
      $("#edit-modal-area").val("");
    });

    $(".edit-modal-save").on("click", function() {
      var $uitext = $("#edit-modal-area");
      var id = $uitext.attr("data-id");
      var message = $uitext.val();
      $uitext.val("");
      $('#edit-modal').modal('hide');

      chatApplication.editMessage(id, message, function() {
        chatApplication.chatRoom.refreshChat(true);
      });

    });

    $('#edit-modal-area').keydown(function(event) {
  //    console.log("keydown : "+ event.which+" ; "+keydown);
      if ( event.which == 18 ) {
        keydownModal = 18;
      }
    });

    $('#edit-modal-area').keyup(function(event) {
      var id = $(this).attr("data-id");
      var msg = $(this).val();
  //    console.log("keyup : "+event.which + ";"+msg.length+";"+keydown);
      if ( event.which === 13 && keydownModal !== 18 && msg.length>1) {
        //console.log("sendMsg=>"+username + " : " + room + " : "+msg);
        if(!msg)
        {
          return;
        }
  //      console.log("*"+msg+"*");
        $(this).val("");
        $('#edit-modal').modal('hide');

        chatApplication.editMessage(id, msg, function() {
          chatApplication.chatRoom.refreshChat(true);
        });

      }
      if ( keydownModal === 18 ) {
        keydownModal = -1;
      }
      if ( event.which === 13 && msg.length === 1) {
        $(this).val('');
      }

    });


    if (window.fluid!==undefined) {
      chatApplication.activateMaintainSession();
    }


    function initFluidApp() {
      if (window.fluid!==undefined) {
        window.fluid.addDockMenuItem(labelAvailable, chatApplication.setStatusAvailable);
        window.fluid.addDockMenuItem(labelAway, chatApplication.setStatusAway);
        window.fluid.addDockMenuItem(labelDoNotDisturb, chatApplication.setStatusDoNotDisturb);
        window.fluid.addDockMenuItem(labelInvisible, chatApplication.setStatusInvisible);
      }
    }
    initFluidApp();


    function reloadWindow() {
      var sURL = unescape(window.location.href);
      //console.log(sURL);
      window.location.href = sURL;
      //window.location.reload( false );
    }

    // We change the current history by removing get parameters so they won't be visible in the popup
    // Having a location bar with ?noadminbar=true is not User Friendly ;-)
    function removeParametersFromLocation() {
      var sURL = window.location.href;
      if (sURL.indexOf("?")>-1) {
        sURL = sURL.substring(0,sURL.indexOf("?"));
        window.history.replaceState("#", "Chat", sURL);
      }
    }

    //removeParametersFromLocation();


    String.prototype.endsWith = function(suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };



  });

})(jq183);

/**
 ##################                           ##################
 ##################                           ##################
 ##################   CHAT APPLICATION        ##################
 ##################                           ##################
 ##################                           ##################
 */

/**
 * ChatApplication Class
 * @constructor
 */
function ChatApplication() {
  this.isLoaded = false;
  this.labels = new JuzuLabels();
  this.weemoExtension = "";
  this.isPublic = false;
  this.publicModeEnabled = false;
  this.chatFullscreen = "false";

  this.chatRoom;
  this.room = "";
  this.rooms = "";
  this.username = "";
  this.fullname = "";
  this.targetUser = "";
  this.targetFullname = "";
  this.token = "";
  this.jzInitChatProfile = "";
  this.jzWhoIsOnline = "";
  this.jzChatGetRoom = "";
  this.jzChatGetCreator = "";
  this.jzChatToggleFavorite = "";
  this.jzCreateDemoUser = "";
  this.jzChatUpdateUnreadMessages = "";
  this.jzChatSend = "";
  this.jzChatRead = "";
  this.jzChatSendMeetingNotes = "";
  this.jzGetStatus = "";
  this.jzSetStatus = "";
  this.jzMaintainSession = "";
  this.jzUsers = "";
  this.jzDelete = "";
  this.jzEdit = "";
  this.jzSaveTeamRoom = "";
  this.userFilter = "";    //not set
  this.chatIntervalChat = "";
  this.chatIntervalUsers = "";
  this.chatIntervalSession = "";
  this.chatIntervalStatus = "";

  this.chatSessionInt = -1; //not set
  this.filterInt;
  this.messages = [];

  this.chatOnlineInt = -1;
  this.notifStatusInt = -1;
  this.ANONIM_USER = "__anonim_";
  this.SUPPORT_USER = "__support_";
  this.isAdmin = false;
  this.isTeamAdmin = false;

  this.old = '';
  this.firstLoad = true;

  this.profileStatus = "offline";
  this.whoIsOnlineMD5 = 0;
  this.totalNotif = 0;
  this.oldNotif = 0;

  this.showFavorites = true;
  this.showPeople = true;
  this.showSpaces = true;
  this.showTeams = true;


}

/**
 * Set Labels
 * @param element : a dom element with data- labels
 */
ChatApplication.prototype.setJuzuLabelsElement = function(element) {
  this.labels.setElement(element);
};

/**
 * Attach Weemo Extension
 * @param weemoExtension WeemoExtension Object
 */
ChatApplication.prototype.attachWeemoExtension = function(weemoExtension) {
  this.weemoExtension = weemoExtension;
};


/**
 * Create demo user
 *
 * @param fullname
 * @param email
 */
ChatApplication.prototype.createDemoUser = function(fullname, email) {

  setTimeout($.proxy(this.showSyncPanel, this), 1000);
  $.ajax({
    url:this.jzCreateDemoUser,
    data: {
      "fullname": fullname,
      "email": email,
      "isPublic": this.isPublic
    },
    dataType: "json",
    context: this,
    success: function(data) {
      //console.log("username : "+data.username);
      //console.log("token    : "+data.token);

      jzStoreParam("anonimUsername", data.username, 600000);
      jzStoreParam("anonimFullname", fullname, 600000);
      jzStoreParam("anonimEmail", email, 600000);

      this.username = data.username;
      this.labels.set("username", this.username);
      this.token = data.token;
      this.labels.set("token", this.token);


      $(".label-user").html(fullname);
      $(".avatar-image:first").attr("src", gravatar(email));
      this.hidePanels();

      this.refreshWhoIsOnline();
      this.initStatusChat();

      if (this.isPublic) {
        this.targetUser = this.SUPPORT_USER;
        this.targetFullname = this.labels.get("label-support-fullname");
      }

      this.loadRoom();

    }
  });

};

/**
 * Update Unread Messages
 *
 * @param callback
 */
ChatApplication.prototype.updateUnreadMessages = function(callback) {
  $.ajax({
    url: this.jzChatUpdateUnreadMessages,
    data: {"room": this.room,
      "user": this.username,
      "token": this.token,
      "timestamp": new Date().getTime()
    },

    success:function(response){
      //console.log("success");
      if (typeof callback === "function") {
        callback();
      }
    },

    error:function (xhr, status, error){

    }

  });

};

/**
 * Delete the message with id in the room
 *
 * @param id
 * @param callback
 */
ChatApplication.prototype.deleteMessage = function(id, callback) {
  $.ajax({
    url: this.jzDelete,
    data: {"room": this.room,
      "user": this.username,
      "token": this.token,
      "messageId": id
    },

    success:function(response){
      //console.log("success");
      if (typeof callback === "function") {
        callback();
      }
    },

    error:function (xhr, status, error){

    }

  });

};

/**
 * Edit the message with id with a new message
 *
 * @param id
 * @param newMessage
 * @param callback
 */
ChatApplication.prototype.editMessage = function(id, newMessage, callback) {
  $.ajax({
    url: this.jzEdit,
    data: {"room": this.room,
      "user": this.username,
      "token": this.token,
      "messageId": id,
      "message": newMessage
    },

    success:function(response){
      //console.log("success");
      if (typeof callback === "function") {
        callback();
      }
    },

    error:function (xhr, status, error){

    }

  });

};

/**
 * Saves a Team room for current user
 *
 * @param teamName
 * @param room
 * @param callback : callback method with roomId as a parameter
 */
ChatApplication.prototype.saveTeamRoom = function(teamName, room, users, callback) {
  $.ajax({
    url: this.jzSaveTeamRoom,
    dataType: "json",
    data: {"teamName": teamName,
      "room": room,
      "users": users,
      "user": this.username,
      "token": this.token
    },

    success:function(response){
      //console.log("success");
      if (typeof callback === "function") {
        callback(response);
      }
    },

    error:function (xhr, status, error){

    }

  });

};

ChatApplication.prototype.resize = function() {
  if (chatApplication.chatFullscreen == "true") {
    $("#PlatformAdminToolbarContainer").css("display", "none");
  }

  var $chatApplication = $("#chat-application");
  var top = $chatApplication.offset().top;
  var height = $(window).height();
  var off = 80;
  var heightChat = height - top - off;

  $chatApplication.height(heightChat);
  $("#chats").height(heightChat - 105 - 61);
  $("#chat-users").height(heightChat - 44);

};

/**
 * Init Status Chat Loop
 */
ChatApplication.prototype.initStatusChat = function() {
  this.notifStatusInt = window.clearInterval(this.notifStatusInt);
  this.notifStatusInt = setInterval($.proxy(this.refreshStatusChat, this), this.chatIntervalStatus);
  this.refreshStatusChat();
};

/**
 * Init Chat Interval
 */
ChatApplication.prototype.initChat = function() {

  this.chatRoom = new ChatRoom(this.jzChatRead, this.jzChatSend, this.jzChatGetRoom, this.jzChatSendMeetingNotes, this.chatIntervalChat, this.isPublic, this.labels);
  this.chatRoom.onRefresh(this.onRefreshCallback);
  this.chatRoom.onShowMessages(this.onShowMessagesCallback);

  var homeLinkHtml = $("#HomeLink").html();
  homeLinkHtml = '<a href="#" class="btn-home-responsive"></a>'+homeLinkHtml;
  $("#HomeLink").html(homeLinkHtml);

  $(".btn-home-responsive").on("click", function() {
    var $leftNavigationTDContainer = $(".LeftNavigationTDContainer");
    if ($leftNavigationTDContainer.css("display")==="none") {
      $leftNavigationTDContainer.animate({width: 'show', duration: 200});
    } else {
      $leftNavigationTDContainer.animate({width: 'hide', duration: 200});
    }
  });


  this.resize();
  $(window).resize(function() {
    chatApplication.resize();
  });

  this.initChatPreferences();

  this.chatOnlineInt = clearInterval(this.chatOnlineInt);
  this.chatOnlineInt = setInterval($.proxy(this.refreshWhoIsOnline, this), this.chatIntervalUsers);
  this.refreshWhoIsOnline();

  if (this.username!==this.ANONIM_USER) setTimeout($.proxy(this.showSyncPanel, this), 1000);
};



/**
 * Init Chat Preferences
 */
ChatApplication.prototype.initChatPreferences = function() {
  this.showFavorites = true;
  if (jzGetParam("chatShowFavorites"+this.username) === "false") this.showFavorites = false;
  this.showPeople = true;
  if (jzGetParam("chatShowPeople"+this.username) === "false") this.showPeople = false;
  this.showSpaces = true;
  if (jzGetParam("chatShowSpaces"+this.username) === "false") this.showSpaces = false;
  this.showTeams = true;
  if (jzGetParam("chatShowTeams"+this.username) === "false") this.showTeams = false;
};

/**
 * Init Chat Profile
 */
ChatApplication.prototype.initChatProfile = function() {
  //var thiss = chatApplication; // TODO: IMPROVE THIS

  if (this.username===this.ANONIM_USER) {
    var anonimFullname = jzGetParam("anonimFullname");
    var anonimUsername = jzGetParam("anonimUsername");
    var anonimEmail = jzGetParam("anonimEmail");

    if (anonimUsername===undefined || anonimUsername===null) {
      this.showDemoPanel();
    } else {
      this.createDemoUser(anonimFullname, anonimEmail);
    }
  } else {
    $.ajax({
      url: this.jzInitChatProfile,
      dataType: "json",
      context: this,
      success: function(data){
        //console.log("Chat Profile Update : "+data.msg);
        //console.log("Chat Token          : "+data.token);
        //console.log("Chat Fullname       : "+data.fullname);
        //console.log("Chat isAdmin        : "+data.isAdmin);
        this.token = data.token;
        this.fullname = data.fullname;
        this.isAdmin = (data.isAdmin=="true");
        this.isTeamAdmin = (data.isTeamAdmin=="true");

        var $chatApplication = $("#chat-application");
        $chatApplication.attr("data-token", this.token);
        var $labelUser = $(".label-user");
        $labelUser.text(data.fullname);

        this.refreshWhoIsOnline();
        this.refreshStatusChat();

      },
      error: function (response){
        //retry in 3 sec
        setTimeout($.proxy(this.initChatProfile, this), 3000);
      }
    });
  }
};

/**
 * Maintain Session : Only on Fluid app context
 */
ChatApplication.prototype.maintainSession = function() {
  $.ajax({
    url: this.jzMaintainSession,
    context: this,
    success: function(response){
      //console.log("Chat Session Maintained : "+response);
    },
    error: function(response){
      this.chatSessionInt = clearInterval(this.chatSessionInt);
    }
  });
};

/**
 * Get the users of the space
 *
 * @param spaceId : the ID of the space
 * @param callback : return the json users data list as a parameter of the callback function
 */
ChatApplication.prototype.getUsers = function(roomId, callback, asString) {
  $.ajax({
    url: this.jzUsers,
    data: {"room": roomId,
      "user": this.username,
      "token": this.token
    },
    dataType: "json",
    context: this,
    success: function(response){
      if (typeof callback === "function") {
        var users = response;
        if (asString) {
          var userst = TAFFY(response.users);
          users = "";
          userst().each(function (user, number) {
            if (number>0) users += ",";
            users += user.name;
          });
        }

        callback(users);
      }
    },
    error: function() {
      if (typeof callback === "function") {
        callback();
      }
    }
  });
};

/**
 * Get all users corresponding to filter
 *
 * @param filter : the filter (ex: Ben Pa)
 * @param callback : return the json users data list as a parameter of the callback function
 */
ChatApplication.prototype.getAllUsers = function(filter, callback) {
  $.ajax({
    url: this.jzUsers,
    data: {"filter": filter,
      "user": this.username,
      "token": this.token
    },
    dataType: "json",
    context: this,
    success: function(response){
      if (typeof callback === "function") {
        callback(response);
      }
    }
  });
};

/**
 * Activate Maintain Session Loop
 */
ChatApplication.prototype.activateMaintainSession = function() {
  this.chatSessionInt = clearInterval(this.chatSessionInt);
  this.chatSessionInt = setInterval($.proxy(this.maintainSession, this), this.chatIntervalSession);
};




/**
 * Refresh Current Chat Status
 */
ChatApplication.prototype.refreshStatusChat = function() {
  var thiss = this;
  snack.request({
    url: thiss.jzGetStatus,
    data: {
      "user": thiss.username,
      "token": thiss.token,
      "timestamp": new Date().getTime()
    }
  }, function (err, response){
    if (err) {
      thiss.changeStatusChat("offline");
    } else {
      thiss.changeStatusChat(response);
    }
  });

};

/**
 * Change Current Chat Status
 * @param status
 */
ChatApplication.prototype.changeStatusChat = function(status) {
  this.profileStatus = status;
  var $statusLabel = $(".chat-status-label");
  $statusLabel.html(this.labels.get("label-current-status")+" "+this.getStatusLabel(status));
  var $chatStatus = $("span.chat-status");
  $chatStatus.removeClass("chat-status-available-black");
  $chatStatus.removeClass("chat-status-donotdisturb-black");
  $chatStatus.removeClass("chat-status-invisible-black");
  $chatStatus.removeClass("chat-status-away-black");
  $chatStatus.removeClass("chat-status-offline-black");
  $chatStatus.addClass("chat-status-"+status+"-black");
  var $chatStatusChat = $(".chat-status-chat");
  $chatStatusChat.removeClass("chat-status-available");
  $chatStatusChat.removeClass("chat-status-donotdisturb");
  $chatStatusChat.removeClass("chat-status-invisible");
  $chatStatusChat.removeClass("chat-status-away");
  $chatStatusChat.removeClass("chat-status-offline");
  $chatStatusChat.addClass("chat-status-"+status);
};

/**
 * Get Status label
 * @param status : values can be : available, donotdisturb, away or invisible
 * @returns {*}
 */
ChatApplication.prototype.getStatusLabel = function(status) {
  switch (status) {
    case "available":
      return this.labels.get("label-available");
    case "donotdisturb":
      return this.labels.get("label-donotdisturb");
    case "away":
      return this.labels.get("label-away");
    case "invisible":
      return this.labels.get("label-invisible");
    case "offline":
      return "Offline";
  }
};

ChatApplication.prototype.updateTotal = function(total) {
  this.totalNotif = total;//Math.abs(this.getOfflineNotif())+Math.abs(this.getOnlineNotif())+Math.abs(this.getSpacesNotif());
};

ChatApplication.prototype.updateTitle = function() {
  if (this.totalNotif>0) {
    document.title = "Chat ("+this.totalNotif+")";
  } else {
    document.title = "Chat";
  }
};

/**
 * Refresh Who Is Online : server call
 */
ChatApplication.prototype.refreshWhoIsOnline = function(targetUser, targetFullname) {
  var withSpaces = jzGetParam("chat.button.space", "true");
  var withUsers = jzGetParam("chat.button.user", "true");
  var withPublic = jzGetParam("chat.button.public", "false");
  var withOffline = jzGetParam("chat.button.offline", "false");

  if (this.username.indexOf(this.ANONIM_USER)>-1) {
    withUsers = "true";
    withSpaces = "true";
    withPublic = "false";
    withOffline = "false";
  }

  if (this.username !== this.ANONIM_USER && this.token !== "---") {
    $.ajax({
      url: this.jzChatWhoIsOnline,
      dataType: "json",
      data: { "user": this.username,
        "token": this.token,
        "filter": this.userFilter,
        "isAdmin": this.isAdmin,
        "timestamp": new Date().getTime()},
      context: this,
      success: function(response){
        if (targetUser !== undefined && targetFullname !== undefined) {
          this.targetUser = targetUser;
          this.targetFullname = targetFullname;
          jzStoreParam("lastUsername"+this.username, this.targetUser, 60000);
          jzStoreParam("lastFullName"+this.username, this.targetFullname, 60000);
          jzStoreParam("lastTS"+this.username, "0");
          this.firstLoad = true;
        }
//        console.log("refreshWhoIsOnline : "+this.targetUser+" : "+this.targetFullname);

        var tmpMD5 = response.md5;
        if (tmpMD5 !== this.whoIsOnlineMD5) {
          var rooms = TAFFY(response.rooms);
          this.whoIsOnlineMD5 = tmpMD5;
          this.isLoaded = true;
          this.hidePanel(".chat-error-panel");
          this.hidePanel(".chat-sync-panel");
          this.showRooms(rooms);



          this.updateTotal(Math.abs(response.unreadOffline)+Math.abs(response.unreadOnline)+Math.abs(response.unreadSpaces)+Math.abs(response.unreadTeams));
          if (window.fluid!==undefined) {
            if (this.totalNotif>0)
              window.fluid.dockBadge = this.totalNotif;
            else
              window.fluid.dockBadge = "";
            if (this.totalNotif>this.oldNotif && this.profileStatus !== "donotdisturb" && this.profileStatus !== "offline") {
              window.fluid.showGrowlNotification({
                title: this.labels.get("label-title"),
                description: this.labels.get("label-new-messages"),
                priority: 1,
                sticky: false,
                identifier: "messages"
              });
            }
          } else if (window.webkitNotifications!==undefined) {
            if (this.totalNotif>this.oldNotif && this.profileStatus !== "donotdisturb" && this.profileStatus !== "offline") {

              var havePermission = window.webkitNotifications.checkPermission();
              if (havePermission == 0) {
                // 0 is PERMISSION_ALLOWED
                var notification = window.webkitNotifications.createNotification(
                  '/chat/img/chat.png',
                  this.labels.get("label-title"),
                  this.labels.get("label-new-messages")
                );

                notification.onclick = function () {
                  window.open("http://localhost:8080/portal/intranet/chat");
                  notification.close();
                }
                notification.show();
              } else {
                window.webkitNotifications.requestPermission();
              }
            }
          }
          this.oldNotif = this.totalNotif;
          this.updateTitle();
        }
        if (this.isTeamAdmin) {
          $(".btn-top-add-actions").css("display", "inline-block");
        }

      },
      error: function (response){
        //console.log("chat-users :: "+response);
        setTimeout($.proxy(this.errorOnRefresh, this), 1000);
      }
    });
  }
};



/**
 * Show rooms : convert json to html
 * @param rooms : a json object
 */
ChatApplication.prototype.showRooms = function(rooms) {
  this.rooms = rooms;
  var roomPrevUser = "";
  var out = '<table class="table list-rooms">';
  var classArrow;
  var totalFavorites = 0, totalPeople = 0, totalSpaces = 0, totalTeams = 0;

  out += "<tr class='header-room header-favorites'><td colspan='3' style='border-top: 0;'>";
  if (this.showFavorites) classArrow="uiIconArrowDown"; else classArrow = "uiIconArrowRight";
  out += "<div class='nav pull-left uiDropdownWithIcon'><div class='uiAction'><i class='"+classArrow+" uiIconLightGray'></i></div></div>";
  out += chatApplication.labels.get("label-header-favorites");
  out += '<span class="room-total total-favorites"></span>';
  out += "</td></tr>"

  var roomsFavorites = rooms();
  roomsFavorites = roomsFavorites.filter({isFavorite:{is:"true"}});
  roomsFavorites.order("isFavorite desc, timestamp desc, escapedFullname logical").each(function (room) {
//    console.log("FAVORITES : "+room.escapedFullname);
    var rhtml = chatApplication.getRoomHtml(room, roomPrevUser);
    if (rhtml !== "") {
      roomPrevUser = room.user;
      if (chatApplication.showFavorites) {
        out += rhtml;
      } else {
        if (Math.round(room.unreadTotal)>0) {
          totalFavorites += Math.round(room.unreadTotal);
        }
      }
    }
  });


  out += "<tr class='header-room header-people'><td colspan='3'>";
  if (this.showPeople) classArrow="uiIconArrowDown"; else classArrow = "uiIconArrowRight";
  out += "<div class='nav pull-left uiDropdownWithIcon'><div class='uiAction'><i class='"+classArrow+" uiIconLightGray'></i></div></div>";
  out += chatApplication.labels.get("label-header-people");
  out += '<span class="room-total total-people"></span>';
  out += "</td></tr>";

  var roomsPeople = rooms();
  roomsPeople = roomsPeople.filter({status:{"!is":"space"}});
  roomsPeople = roomsPeople.filter({status:{"!is":"team"}});
  roomsPeople = roomsPeople.filter({isFavorite:{"!is":"true"}});
  roomsPeople.order("isFavorite desc, timestamp desc, escapedFullname logical").each(function (room) {
//    console.log("PEOPLE : "+room.escapedFullname);
    var rhtml = chatApplication.getRoomHtml(room, roomPrevUser);
    if (rhtml !== "") {
      roomPrevUser = room.user;
      if (chatApplication.showPeople) {
        out += rhtml;
      } else {
        if (Math.round(room.unreadTotal)>0) {
          totalPeople += Math.round(room.unreadTotal);
        }
      }
    }
  });


  out += "<tr class='header-room header-spaces'><td colspan='3'>";
  if (this.showSpaces) classArrow="uiIconArrowDown"; else classArrow = "uiIconArrowRight";
  out += "<div class='nav pull-left uiDropdownWithIcon'><div class='uiAction'><i class='"+classArrow+" uiIconLightGray'></i></div></div>";
  out += chatApplication.labels.get("label-header-spaces");
  out += '<span class="room-total total-spaces"></span>';
  out += "</td></tr>";

  var roomsSpaces = rooms();
  roomsSpaces = roomsSpaces.filter({status:{"is":"space"}});
  roomsSpaces = roomsSpaces.filter({isFavorite:{"!is":"true"}});
  roomsSpaces.order("isFavorite desc, timestamp desc, escapedFullname logical").each(function (room) {
//    console.log("SPACES : "+room.escapedFullname);
    var rhtml = chatApplication.getRoomHtml(room, roomPrevUser);
    if (rhtml !== "") {
      roomPrevUser = room.user;
      if (chatApplication.showSpaces) {
        out += rhtml;
      } else {
        if (Math.round(room.unreadTotal)>0) {
          totalSpaces += Math.round(room.unreadTotal);
        }
      }
    }
  });

  out += "<tr class='header-room header-teams'><td colspan='3'>";
  if (this.showTeams) classArrow="uiIconArrowDown"; else classArrow = "uiIconArrowRight";
  out += "<div class='nav pull-left uiDropdownWithIcon'><div class='uiAction'><i class='"+classArrow+" uiIconLightGray'></i></div></div>";
  out += chatApplication.labels.get("label-header-teams");
  out += '<span class="room-total total-teams"></span>';
  out += "<ul class='nav pull-right uiDropdownWithIcon btn-top-add-actions' style='margin-right: 5px;'><li><div class='uiActionWithLabel btn-add-team' href='javaScript:void(0)'><i class='uiIconSimplePlusMini uiIconLightGray'></i></div></li></ul>";
  out += "</td></tr>";

  var roomsTeams = rooms();
  roomsTeams = roomsTeams.filter({status:{"is":"team"}});
  roomsTeams = roomsTeams.filter({isFavorite:{"!is":"true"}});
  roomsTeams.order("isFavorite desc, timestamp desc, escapedFullname logical").each(function (room) {
//    console.log("TEAMS : "+room.escapedFullname);
    var rhtml = chatApplication.getRoomHtml(room, roomPrevUser);
    if (rhtml !== "") {
      roomPrevUser = room.user;
      if (chatApplication.showTeams) {
        out += rhtml;
      } else {
        if (Math.round(room.unreadTotal)>0) {
          totalTeams += Math.round(room.unreadTotal);
        }
      }
    }
  });

  out += '</table>';

  $("#chat-users").html(out);

  this.jQueryForUsersTemplate();


  if (chatApplication.isTeamAdmin) {
    $(".btn-top-add-actions").css("display", "inline-block");
  }

  if (totalFavorites>0) {
    $(".total-favorites").html(totalFavorites);
    $(".total-favorites").css("display", "inline-block");
  }

  if (totalPeople>0) {
    $(".total-people").html(totalPeople);
    $(".total-people").css("display", "inline-block");
  }

  if (totalSpaces>0) {
    $(".total-spaces").html(totalSpaces);
    $(".total-spaces").css("display", "inline-block");
  }

  if (totalTeams>0) {
    $(".total-teams").html(totalTeams);
    $(".total-teams").css("display", "inline-block");
  }

};

ChatApplication.prototype.getRoomHtml = function(room, roomPrevUser) {
  var out = "";
  if (room.user!==roomPrevUser) {
    out += '<tr id="users-online-'+room.user.replace(".", "-")+'" class="users-online">';
    out += '<td class="td-status">';
    out += '<span class="';
    if (room.isFavorite == "true") {
      out += 'user-favorite';
    } else {
      out += 'user-status';
    }
    if (room.status === "space" || room.status === "team") {
      out += ' user-space-front';
    }
    out +='" user-data="'+room.user+'"></span><span class="user-'+room.status+'"></span>';
    out += '</td>';
    out +=  '<td>';
    if (room.isActive=="true") {
      out += '<span user-data="'+room.user+'" room-data="'+room.room+'" class="room-link" data-fullname="'+room.escapedFullname+'">'+room.escapedFullname+'</span>';
    } else {
      out += '<span class="room-inactive">'+room.user+'</span>';
    }
    out += '</td>';
    out += '<td>';
    if (Math.round(room.unreadTotal)>0) {
      out += '<span class="room-total" style="float:right;" data="'+room.unreadTotal+'">'+room.unreadTotal+'</span>';
    }
    out += '</td>';
    out += '</tr>';
  }
  return out;
};

/**
 * Load Room : server call
 */
ChatApplication.prototype.loadRoom = function() {
  //console.log("TARGET::"+this.targetUser+" ; ISADMIN::"+this.isAdmin);
  if (this.targetUser!==undefined) {
    $(".users-online").removeClass("info");
    if (this.isDesktopView()) {
      var $targetUser = $("#users-online-"+this.targetUser.replace(".", "-"));
      $targetUser.addClass("info");
      $(".room-total").removeClass("room-total-white");
      $targetUser.find(".room-total").addClass("room-total-white");
    }

    $("#room-detail").css("display", "block");
    $(".team-button").css("display", "none");
    $(".target-user-fullname").text(this.targetFullname);
    if (this.targetUser.indexOf("space-")===-1 && this.targetUser.indexOf("team-")===-1)
    {
//      $(".meeting-actions").css("display", "none");
      $(".target-avatar-link").attr("href", "/portal/intranet/profile/"+this.targetUser);
      $(".target-avatar-image").attr("src", "/rest/jcr/repository/social/production/soc:providers/soc:organization/soc:"+this.targetUser+"/soc:profile/soc:avatar");
    }
    else if (this.targetUser.indexOf("team-")===-1)
    {
//      $(".meeting-actions").css("display", "inline-block");
      $(".meeting-action-event").css("display", "block");
      $(".meeting-action-task").css("display", "block");
      var spaceName = this.targetFullname.toLowerCase().replace(" ", "_");
      $(".target-avatar-link").attr("href", "/portal/g/:spaces:"+spaceName+"/"+spaceName);
      $(".target-avatar-image").attr("src", "/rest/jcr/repository/social/production/soc:providers/soc:space/soc:"+spaceName+"/soc:profile/soc:avatar");
    }
    else
    {

      $.ajax({
        url: this.jzChatGetCreator,
        data: {"room": this.targetUser,
          "user": this.username,
          "token": this.token
        },
        context: this,
        success: function(response){
          //console.log("SUCCESS::getRoom::"+response);
          var creator = response;
          if (creator === this.username) {
            $(".team-button").css("display", "block");
          }
        },
        error: function(xhr, status, error){
          //console.log("ERROR::"+xhr.responseText);
        }
      });
//      $(".meeting-actions").css("display", "inline-block");
      $(".meeting-action-event").css("display", "none");
      $(".meeting-action-task").css("display", "none");
      $(".target-avatar-link").attr("href", "#");
      $(".target-avatar-image").attr("src", "/social-resources/skin/images/ShareImages/SpaceAvtDefault.png");
    }

    var thiss = this;
    this.chatRoom.init(this.username, this.token, this.targetUser, this.targetFullname, this.isAdmin, function(room) {
      thiss.room = room;
      var $msg = $('#msg');
      $msg.removeAttr("disabled");
      if (thiss.weemoExtension.isConnected) {
        $(".btn-weemo").removeClass('disabled');
      }
      if (thiss.isDesktopView()) $msg.focus();

    });

  }
};

ChatApplication.prototype.onRefreshCallback = function(code) {
  if (code === 0) { // SUCCESS
    chatApplication.hidePanel(".chat-login-panel");
    chatApplication.hidePanel(".chat-error-panel");
  } else if (code === 1) { //ERROR
/*
    if ( $(".chat-error-panel").css("display") == "none") {
      chatApplication.showLoginPanel();
    } else {
      chatApplication.hidePanel(".chat-login-panel");
    }
*/
  }
}

ChatApplication.prototype.onShowMessagesCallback = function(out) {

  var $chats = $("#chats");
  $chats.html('<span>'+out+'</span>');
  sh_highlightDocument();
  $chats.animate({ scrollTop: 20000 }, 'fast');

  $(".msg-text").mouseover(function() {
    if ($(".msg-actions", this).children().length > 0) {
      $(".msg-date", this).css("display", "none");
      $(".msg-actions", this).css("display", "inline-block");
    }
  });

  $(".msg-text").mouseout(function() {
    $(".msg-date", this).css("display", "inline-block");
    $(".msg-actions", this).css("display", "none");
  });

  $(".msg-action-quote").on("click", function() {
    var $uimsg = $(this).siblings(".msg-data");
    var msgHtml = $uimsg.html();
    //if (msgHtml.endsWith("<br>")) msgHtml = msgHtml.substring(0, msgHtml.length-4);
    msgHtml = msgHtml.replace(/<br>/g, '\n');
    var msgFullname = $uimsg.attr("data-fn");
    $("#msg").focus().val('').val("[quote="+msgFullname+"]"+msgHtml+" [/quote] ");

  });

  $(".msg-action-delete").on("click", function() {
    var $uimsg = $(this).siblings(".msg-data");
    var msgId = $uimsg.attr("data-id");
    chatApplication.deleteMessage(msgId, function() {
      chatApplication.chatRoom.refreshChat(true);
    });
    //if (msgHtml.endsWith("<br>")) msgHtml = msgHtml.substring(0, msgHtml.length-4);

  });

  $(".msg-action-edit").on("click", function() {
    var $uimsg = $(this).siblings(".msg-data");
    var msgId = $uimsg.attr("data-id");
    var msgHtml = $uimsg.html();
    msgHtml = msgHtml.replace(eval("/<br>/g"), "\n");

    $("#edit-modal-area").val(msgHtml);
    $("#edit-modal-area").attr("data-id", msgId);
    $('#edit-modal').modal({"backdrop": false});

  });

  $(".send-meeting-notes").on("click", function () {
    $(this).animate({
      opacity: "toggle"
    }, 200, function() {
      var room = $(this).attr("data-room");
      var from = $(this).attr("data-from");
      var to = $(this).attr("data-to");
      var id = $(this).attr("data-id");

      from = Math.round(from)-1;
      to = Math.round(to)+1;
      chatApplication.chatRoom.sendMeetingNotes(room, from, to, function (response) {
        if (response === "sent") {
          console.log("sent");
          $("#"+id).animate({
            opacity: "toggle"
          }, 200 , function() {
            $(this).animate({
              opacity: "toggle"
            }, 3000);
          });
        }
      });

    });

  });

}

/**
 * Error On Refresh
 */
ChatApplication.prototype.errorOnRefresh = function() {
  this.isLoaded = true;
  this.hidePanel(".chat-sync-panel");
  this.hidePanel(".chat-login-panel");
  this.changeStatusChat("offline");
  this.showErrorPanel();
};

/**
 * Toggle Favorite : server call
 * @param targetFav : the user or space to put/remove in favorite
 */
ChatApplication.prototype.toggleFavorite = function(targetFav) {
  console.log("FAVORITE::"+targetFav);
  $.ajax({
    url: this.jzChatToggleFavorite,
    data: {"targetUser": targetFav,
      "user": this.username,
      "token": this.token,
      "timestamp": new Date().getTime()
    },
    context: this,
    success: function(response){
      this.refreshWhoIsOnline();
    },
    error: function(xhr, status, error){
    }
  });
};

/**
 * jQuery bindings on dom elements created by Who Is Online methods
 */
ChatApplication.prototype.jQueryForUsersTemplate = function() {
  var value = jzGetParam("lastUsername"+this.username);
  var thiss = this;

  if (value && this.firstLoad) {
    //console.log("firstLoad with user : *"+value+"*");
    this.targetUser = value;
    this.targetFullname = jzGetParam("lastFullName"+this.username);
    if (this.username!==this.ANONIM_USER) {
      this.loadRoom();
    }
    this.firstLoad = false;
  }

  if (this.isDesktopView() && this.targetUser!==undefined) {
    var $targetUser = $("#users-online-"+this.targetUser.replace(".", "-"));
    $targetUser.addClass("info");
    $(".room-total").removeClass("room-total-white");
    $targetUser.find(".room-total").addClass("room-total-white");
  }

  $(".header-room").on("click", function() {
    if ($(this).hasClass("header-favorites"))
      chatApplication.showFavorites = !chatApplication.showFavorites;
    else if ($(this).hasClass("header-people"))
      chatApplication.showPeople = !chatApplication.showPeople;
    else if ($(this).hasClass("header-spaces"))
      chatApplication.showSpaces = !chatApplication.showSpaces;
    else if ($(this).hasClass("header-teams"))
      chatApplication.showTeams = !chatApplication.showTeams;

    jzStoreParam("chatShowFavorites"+chatApplication.username, chatApplication.showFavorites, 600000);
    jzStoreParam("chatShowPeople"+chatApplication.username, chatApplication.showPeople, 600000);
    jzStoreParam("chatShowSpaces"+chatApplication.username, chatApplication.showSpaces, 600000);
    jzStoreParam("chatShowTeams"+chatApplication.username, chatApplication.showTeams, 600000);

    chatApplication.showRooms(chatApplication.rooms);

  });

  $(".btn-add-team").on("click", function() {
    chatApplication.showTeams = true;
    jzStoreParam("chatShowTeams"+chatApplication.username, chatApplication.showTeams, 600000);
    chatApplication.showRooms(chatApplication.rooms);

    var $uitext = $("#team-modal-name");
    $uitext.val("");
    $uitext.attr("data-id", "---");
    $(".team-user-label").remove();
    $('#team-modal').modal({"backdrop": false});
    $uitext.focus();
  });


  $('.users-online').on("click", function() {
    thiss.targetUser = $(".room-link:first",this).attr("user-data");
    thiss.targetFullname = $(".room-link:first",this).attr("data-fullname");
    thiss.loadRoom();
    if (thiss.isMobileView()) {
      $(".right-chat").css("display", "block");
      $(".left-chat").css("display", "none");
      $(".room-name").html(thiss.targetFullname);
    }
  });


  $('.room-link').on("click", function() {
    thiss.targetUser = $(this).attr("user-data");
    thiss.targetFullname = $(this).attr("data-fullname");
    thiss.loadRoom();
    if (thiss.isMobileView()) {
      $(".uiRightContainerArea").css("display", "block");
      $(".uiLeftContainerArea").css("display", "none");
//      $(".room-name").html(thiss.targetFullname);
    }
  });

  $('.user-status').on("click", function() {
    var targetFav = $(this).attr("user-data");
    thiss.toggleFavorite(targetFav);
  });
  $('.user-favorite').on("click", function() {
    var targetFav = $(this).attr("user-data");
    thiss.toggleFavorite(targetFav);
  });
};

/**
 * Search and filter (filter on users or spaces if starts with @
 * @param filter
 */
ChatApplication.prototype.search = function(filter) {
  if (filter == ":aboutme" || filter == ":about me") {
    this.showAboutPanel();
  }
  if (filter.indexOf("@")!==0) {
    this.chatRoom.highlight = filter;
    this.chatRoom.showMessages();
  } else {
    this.userFilter = filter.substr(1, filter.length-1);
    this.filterInt = clearTimeout(this.filterInt);
    this.filterInt = setTimeout($.proxy(this.refreshWhoIsOnline, this), 500);
  }
};

/**
 * Check Browser Viewport Status
 * @returns {boolean}
 */
ChatApplication.prototype.checkViewportStatus = function() {
  return ($("#NavigationPortlet").css("display")==="none");
};

ChatApplication.prototype.isMobileView = function() {
  return this.checkViewportStatus();
};

ChatApplication.prototype.isDesktopView = function() {
  return !this.checkViewportStatus();
};


/**
 * Set Current Status
 * @param status
 * @param callback
 */
ChatApplication.prototype.setStatus = function(status, callback) {

  if (status !== undefined) {
    //console.log("setStatus :: "+status);

    $.ajax({
      url: this.jzSetStatus,
      data: { "user": this.username,
        "token": this.token,
        "status": status,
        "timestamp": new Date().getTime()
      },
      context: this,

      success: function(response){
        //console.log("SUCCESS:setStatus::"+response);
        this.changeStatusChat(response);
        if (typeof callback === "function") {
          callback(response);
        }

      },
      error: function(response){
        this.changeStatusChat("offline");
        if (typeof callback === "function") {
          callback("offline");
        }
      }

    });
  }

};

ChatApplication.prototype.showAsText = function() {

  this.chatRoom.showAsText(function(response) {
    //console.log("SUCCESS:setStatus::"+response);
    $("#text-modal-area").html(response);
    $('#text-modal-area').on("click", function() {
      this.select();
    });
    $('#text-modal').modal({"backdrop": false});
  });

};

ChatApplication.prototype.setStatusAvailable = function() {
  chatApplication.setStatus("available");
};

ChatApplication.prototype.setStatusAway = function() {
  chatApplication.setStatus("away");
};

ChatApplication.prototype.setStatusDoNotDisturb = function() {
  chatApplication.setStatus("donotdisturb");
};

ChatApplication.prototype.setStatusInvisible = function() {
  chatApplication.setStatus("invisible");
};

ChatApplication.prototype.createWeemoCall = function() {
  console.log("targetUser : "+chatApplication.targetUser);
  console.log("targetFullname   : "+chatApplication.targetFullname);

  var chatMessage = {
    "url" : chatApplication.jzChatSend,
    "user" : chatApplication.username,
    "fullname" : chatApplication.fullname,
    "targetUser" : chatApplication.targetUser,
    "room" : chatApplication.room,
    "token" : chatApplication.token
  };
  weemoExtension.createWeemoCall(chatApplication.targetUser, chatApplication.targetFullname, chatMessage);

  //this.weemoExtension.createWeemoCall(this.targetUser, this.fullname);
};

ChatApplication.prototype.joinWeemoCall = function() {
  console.log("targetUser : "+chatApplication.targetUser);
  console.log("targetFullname   : "+chatApplication.targetFullname);

  var chatMessage = {
    "url" : chatApplication.jzChatSend,
    "user" : chatApplication.username,
    "fullname" : chatApplication.fullname,
    "targetUser" : chatApplication.targetUser,
    "room" : chatApplication.room,
    "token" : chatApplication.token
  };
  weemoExtension.joinWeemoCall(chatMessage);
};

/**
 * Send message to server
 * @param msg : the msg to send
 * @param callback : the method to execute on success
 */
ChatApplication.prototype.sendMessage = function(msg, callback) {


  var isSystemMessage = (msg.indexOf("/")===0 && msg.length>2) ;
  var options = {};
  var sendMessageToServer = true;
  if (isSystemMessage) {
    sendMessageToServer = false;
    if (msg.indexOf("/me")===0) {
//      msg = msg.replace("/me", this.fullname);
      options.type = "type-me";
      options.username = this.username;
      options.fullname = this.fullname;
      sendMessageToServer = true;
    } else if (msg.indexOf("/call")===0) {
      this.createWeemoCall();
    } else if (msg.indexOf("/join")===0) {
      this.joinWeemoCall();
    } else if (msg.indexOf("/terminate")===0) {
      ts = Math.round(new Date().getTime() / 1000);
      msg = "Call terminated";
      options.timestamp = ts;
      options.type = "call-off";
      this.weemoExtension.setCallOwner(false);
      this.weemoExtension.setCallActive(false);
      sendMessageToServer = true;
    } else if (msg.indexOf("/export")===0) {
      this.showAsText();
    }
  }

  $("#msg").val("");
  if (sendMessageToServer) {
    this.chatRoom.sendMessage(msg, options, isSystemMessage, callback);
  }

};



/**
 ##################                           ##################
 ##################                           ##################
 ##################   CHAT PANELS             ##################
 ##################                           ##################
 ##################                           ##################
 */

ChatApplication.prototype.hidePanel = function(panel) {
  var $uiPanel = $(panel);
  $uiPanel.width($('#chat-application').width()+40);
  $uiPanel.height($('#chat-application').height());
  $uiPanel.css("display", "none");
  $uiPanel.html("");
};

ChatApplication.prototype.hidePanels = function() {
  this.hidePanel(".chat-sync-panel");
  this.hidePanel(".chat-error-panel");
  this.hidePanel(".chat-login-panel");
  this.hidePanel(".chat-about-panel");
  this.hidePanel(".chat-demo-panel");
};

ChatApplication.prototype.showSyncPanel = function() {
  if (!this.isLoaded) {
    this.hidePanels();
    var $chatSyncPanel = $(".chat-sync-panel");
    $chatSyncPanel.html("<img src=\"/chat/img/sync.gif\" width=\"64px\" class=\"chatSync\" />");
    $chatSyncPanel.css("display", "block");
  }
};

ChatApplication.prototype.showErrorPanel = function() {
  this.whoIsOnlineMD5 = "";
  this.hidePanels();
  //console.log("show-error-panel");
  var $chatErrorPanel = $(".chat-error-panel");
  $chatErrorPanel.html(this.labels.get("label-panel-error1")+"<br/><br/>"+this.labels.get("label-panel-error2"));
  $chatErrorPanel.css("display", "block");
};

ChatApplication.prototype.showLoginPanel = function() {
  this.hidePanels();
  //console.log("show-login-panel");
  var $chatLoginPanel = $(".chat-login-panel");
  $chatLoginPanel.html(this.labels.get("label-panel-login1")+"<br><br><a href=\"#\" onclick=\"javascript:reloadWindow();\">"+this.labels.get("label-panel-login2")+"</a>");
  $chatLoginPanel.css("display", "block");
};

ChatApplication.prototype.showAboutPanel = function() {
  var about = "eXo Chat<br>";
  about += "Version 0.7.1 (build 130731)<br><br>";
  about += "Designed and Developed by <a href=\"mailto:bpaillereau@exoplatform.com\">Benjamin Paillereau</a><br>";
  about += "for <a href=\"http://www.exoplatform.com\" target=\"_new\">eXo Platform</a><br><br>";
  about += "Sources available on <a href=\"https://github.com/exo-addons/chat-application\" target=\"_new\">https://github.com/exo-addons/chat-application</a>";
  about += "<br><br><a href=\"#\" id=\"about-close-btn\" >Close</a>";
  this.hidePanels();
  var $chatAboutPanel = $(".chat-about-panel");
  $chatAboutPanel.html(about);
  $chatAboutPanel.width($('#chat-application').width()+40);
  $chatAboutPanel.height($('#chat-application').height());
  $chatAboutPanel.css("display", "block");

  var thiss = this;
  $("#about-close-btn").on("click", function() {
    thiss.hidePanel('.chat-about-panel');
    $('#chat-search').attr("value", "");
  });
};

ChatApplication.prototype.showDemoPanel = function() {
  this.hidePanels();
  //console.log("show-demo-panel");
  var $chatDemoPanel = $(".chat-demo-panel");
  var intro = this.labels.get("label-panel-demo");
  if (this.isPublic) intro = this.labels.get("label-panel-public");
  $chatDemoPanel.html(intro+"<br><br><div class='welcome-panel'>" +
    "<br><br>"+this.labels.get("label-display-name")+"&nbsp;&nbsp;<input type='text' id='anonim-name'>" +
    "<br><br>"+this.labels.get("label-email")+"&nbsp;&nbsp;<input type='text' id='anonim-email'></div>" +
    "<br><a href='#' id='anonim-save'>"+this.labels.get("label-save-profile")+"</a>");
  $chatDemoPanel.css("display", "block");

  $("#anonim-save").on("click", function() {
    var fullname = $("#anonim-name").val();
    var email = $("#anonim-email").val();
    this.createDemoUser(fullname, email);
  });
};
