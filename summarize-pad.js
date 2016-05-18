// ==UserScript==
// @name summarize-pad
// @namespace https://github.com/bjperson/summarize-pad
// @author Brice Person
// @date 18/05/2015
// @version 1.5
// @license AGPL V3; https://en.wikipedia.org/wiki/GNU_Affero_General_Public_License
// @include https://pad.regardscitoyens.org/*
// @include https://framapad.org/*
// @include https://pad.lqdn.fr/*
// @compat Firefox, Chrome
// @description Parse any etherpad content to summarize it with simple rules
// ==/UserScript==

var summarizePad = (function() {
  var style = document.createElement('style');

  style.textContent = " \
  #padassistant {  \
    background-color: #fff;  \
    border-left: 1px solid #dfdfdf;  \
    font-size: 1.5em;  \
    height: 100%;  \
    overflow: auto;  \
    position: absolute;  \
    right: 0;  \
    width: 30%;  \
    z-index: 100;  \
  }  \
  #toggleassistant {  \
    background-color: #e8e9e9;  \
    border: 1px solid #dfdfdf;  \
    color: #fff;  \
    font-size: 2.5em;  \
    font-weight: bold;  \
    height: 32px;  \
    overflow: hidden;  \
    position: absolute;  \
    right: 0;  \
    text-align: center;  \
    width: 32px;  \
    z-index: 101;  \
    cursor:pointer;  \
  }  \
  .tasktype {  \
    color:#000;  \
    background-color:#e8e9e9;  \
    padding:0.8em;  \
    font-weight:bold;  \
  }  \
  .task {  \
    border-bottom:1px solid #dfdfdf;  \
    padding:0.3em;  \
    cursor:pointer;  \
  }  \
  .task:hover {  \
    background-color: #F2F7F7;  \
  } \
  #help { \
    padding: 1em; \
    border-top: 1px solid #dfdfdf; \
  } \
  #help h1 { \
    font-weight: bold; \
    margin-bottom: 0.5em; \
  }";

  document.head.appendChild(style);

  var help = '<div id="help" style="display: none"> \
    <h2>Help</h2> \
    <p> \
    A list must be uppercase with an underline and without author colors, example : \
    <br /> \
    <u>LIST</u><br /> \
    <br /> \
    If a list title ends with ":", tasks will be counted and displayed, example : \
    <br /><u>LIST :</u><br /> \
    <br /> \
    If a list does not contain tasks, it will not be displayed. \
    <br /><br /> \
    </p> \
    <p>  \
    A task is a top-level bullet list item, example : \
    <br /> \
    <ul><li><span style="background-color:#FFC7F1;">Task</span></li></ul> \
    </p> \
    <p><br />  \
    You can setup tags writing anything like this anywhere on your pad : \
    <br /> \
    [URGENT]: red; <br />\
    [DONE]: #E5E5E5; \
    </p> \<br /><p><hr  style="color:gray;"/>  \
    <span style="color:gray;font-size:0.8em;">Powered by <a href="https://github.com/bjperson/summarize-pad">Summarize-pad</a></span> \
    </p> \
  </div>';

  var isLite = !($(".EtherpadLink").length);
  var regtype = '^[A-Z :]{2,}$';
  var regflag = /\[([^\]]{2,})\]/g;
  var colorflag = /^(\[[^\]]{2,}\]):/;
  var flagcolor = /\]: ([^;]{2,});/;
  var countflag = ':$';

  var colors = {
    '[URGENT]':'red',
    '[RDV]':'green',
    '[CONF]':'blue',
    '[PARL]':'violet'
  };

  function getMainIframe() {
    return isLite ? $('iframe').contents() : $(document.getElementsByTagName('iframe')[1]).contents();
  }

  function summarize() {
    var data = getMainIframe().find('iframe').contents();
    data.find('body').css('width', '69%');

    var list = {};

    $.each($(data).find("div[id*='magicdomid']"), function() {
      that = $(this);
      id = this.id;
      text = that.text();
      if(text.match(regtype)) {
        if (that.contents().find('u').length === 1) {
          list[id] = {'tasktype':text, 'tasks':[]}
        }
      }
      if(text.match(colorflag)) {
        if(text.match(flagcolor)) {
          colors[text.match(colorflag)[1]] = text.match(flagcolor)[1];
        }
      }
    });

    $.each($(data).find("div[id*='magicdomid']"), function() {
      if (list[this.id] !== undefined) {
        listid = this.id;
      }
      if (typeof listid != 'undefined') {
        if ($(this).find('ul').hasClass('list-bullet1')) {
          list[listid].tasks.push({'id':this.id,'text':$(this).text(),'top':this.getBoundingClientRect().top});
        }
      }

    });

    if ($('#assistanttasks').length === 1) {
      $('#assistanttasks').html('');
    }
    else {
      top = $('#editbar').outerHeight();
      $('#editorcontainer').prepend('<div id="padassistant" style="top: '+top+'px;"><div id="assistanttasks"></div></div>');
      $('#editorcontainer').prepend('<div id="toggleassistant" title="Open/Close" onclick="javascript:summarizePad.toggleAssistant()" style="top: '+top+'px;">#</div>');
      $('#padassistant').append('<div style="background-color:#e8e9e9;cursor:pointer;text-align:center;" onclick="javascript:summarizePad.openHelp()">?</div>'+help);
    }

    for (item in list) {
      if (list[item].tasks.length > 0) {
        var tasktype = list[item].tasktype;
        if (tasktype.match(countflag)) { tasktype += ' '+list[item].tasks.length; }
        $('#assistanttasks').append('<div class="tasktype">'+tasktype+'</div>');
        for (task in list[item].tasks) {
          var text = list[item].tasks[task].text;
          var color;

          if (text.match(regflag)) { color = colors[text.match(regflag)[0]]; }
          else { color = 'gray';}
          $('#assistanttasks').append('<div class="task" onclick="javascript:summarizePad.goToTask(\''+list[item].tasks[task].top+'\')" style="color:'+color+';">'+text+'</div>');
        }
      }
    }
  }

  function goToTask(top) {
    getMainIframe().find("html, body").animate({ scrollTop: top }, { duration: 'medium', easing: 'swing' });
  }

  function closePA() {
    $('#padassistant').remove();
  }

  function toggleAssistant() {
    if ($('#padassistant').length === 1) {
      clearInterval(refresh);
      closePA();
      getMainIframe().find('iframe').contents().find('body').css('width', '100%');
    }
    else {
      summarize();
      refresh = setInterval(summarize, 5000);
    }
  }

  function openHelp() {
    $('#help').toggle();
  }

  summarize();
  var refresh = setInterval(summarize, 5000);

  return {
    goToTask: goToTask,
    closePA: closePA,
    openHelp: openHelp,
    toggleAssistant: toggleAssistant
  };
}());
