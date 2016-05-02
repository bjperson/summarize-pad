// ==UserScript==
// @name summarize-pad
// @namespace https://github.com/bjperson/summarize-pad
// @author Brice Person
// @date 09/09/2015
// @version 1
// @license AGPL V3; http://en.wikipedia.org/wiki/WTF_Public_License
// @include https://regardscitoyens.framapad.org/*
// @include https://pad.lqdn.fr/p/*
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
    overflow: auto;  \
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
    <h1>Aide</h1> \
    <p> \
    Une section doit être soulignée, en majuscule et ne doit pas comporter de couleurs d\'auteurs, exemple : \
    <br /> \
    <u>SECTION</u><br /> \
    <br /> \
    Si une section se termine par ":" les tâches seront comptées et affichées, exemple : \
  <br /><u>SECTION :</u><br /> \
    <br /> \
    Si une section ne comporte pas de tâches, elle ne sera pas affichée. \
    <br /><br /> \
    </p> \
    <p>  \
    Une tâche est un élément de liste à puce de premier niveau avec ou sans couleurs, exemple : \
    <br /> \
  <ul><li><span style="background-color:#FFC7F1">Tâche</span></li></ul> \
    </p> \
  </div>';

  var isLite = !($(".EtherpadLink").length);
  var regtype = '^[A-Z :]{2,}$';
  var regflag = /\[([^\]]{2,})\]/g;
  var countflag = ':$';

  var colors = {
    '[URGENT]':'red',
    '[RDV]':'green',
    '[CONF]':'blue',
    '[PARL]':'violet'
  };

  function getMainIframe() {
    return isLite ? $($('iframe')[0]).contents() : $(document.getElementsByTagName('iframe')[1]).contents();
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
          console.log('TASKTYPE[' + id + ']: ' + text);
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
          console.log('TASKTYPE[' + listid + ']: ' + $(this).text() + ' @' + this.getBoundingClientRect().top);
        }
      }

    });

    if ($('#padassistant').length === 1) {
      $('#padassistant').html('');
    }
    else {
      top = $('#editbar').outerHeight();
      $('#editorcontainer').prepend('<div id="padassistant" style="top: '+top+'px;"></div>');
      $('#editorcontainer').prepend('<div id="toggleassistant" title="Open/Close" onclick="javascript:summarizePad.toggleAssistant()" style="top: '+top+'px;">#</div>');
    }

    for (item in list) {
      if (list[item].tasks.length > 0) {
        var tasktype = list[item].tasktype;
        if (tasktype.match(countflag)) { tasktype += ' '+list[item].tasks.length; }
        $('#padassistant').append('<div class="tasktype">'+tasktype+'</div>');
        for (task in list[item].tasks) {
          var text = list[item].tasks[task].text;
          var color;

          if (text.match(regflag)) { color = colors[text.match(regflag)[0]]; }
          else { color = 'gray';}
          $('#padassistant').append('<div class="task" onclick="javascript:summarizePad.goToTask(\''+list[item].tasks[task].top+'\')" style="color:'+color+';">'+text+'</div>');
        }
      }
    }
    $('#padassistant').append('<div style="background-color:#e8e9e9;cursor:pointer;text-align:center;" onclick="javascript:summarizePad.openHelp()">?</div>'+help);
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
