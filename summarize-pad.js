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

import summaryCSS from './summarize-pad.css';
import summaryHTML from './summarize-pad.html';

window.summarizePad = (function () {
  const style = document.createElement('style');
  style.textContent = summaryCSS;
  document.head.appendChild(style);

  const isLite = !($(".EtherpadLink").length);
  const regtype = '^[A-Z :]{2,}$';
  const regflag = /\[([^\]]{2,})\]/g;
  const colorflag = /^(\[[^\]]{2,}\]):/;
  const flagcolor = /\]: ([^;]{2,});/;
  const countflag = ':$';
  const colors = {
    '[URGENT]': 'red',
    '[RDV]': 'green',
    '[CONF]': 'blue',
    '[PARL]': 'violet'
  };

  const $editor = $('#editorcontainer');
  const $assistant = $(summaryHTML);
  const $assistantTasks = $assistant.find('#assistanttasks');
  const $helpToggle = $assistant.find('#helpToggle');
  const $toggle = $('<div id="toggleassistant" title="Open/Close">#</div>');

  function getMainIframe() {
    return isLite ? $('iframe').contents() : $(document.getElementsByTagName('iframe')[1]).contents();
  }

  function itemsList() {
    const data = getMainIframe().find('iframe').contents();
    const list = {};
    let parent;

    $.each($(data).find("div[id*='magicdomid']"), function () {
      let that = $(this);
      let id = this.id;
      let text = that.text();

      if (text.match(regtype)) {
        if (that.contents().find('u').length === 1) {
          parent = list[id] = {
            tasktype: text,
            tasks: []
          }
        }
      }

      if (parent) {
        if ($(this).find('ul').hasClass('list-bullet1')) {
          parent.tasks.push({
            id,
            text,
            top: this.getBoundingClientRect().top
          });
        }
      }

      if (text.match(colorflag)) {
        if (text.match(flagcolor)) {
          colors[text.match(colorflag)[1]] = text.match(flagcolor)[1];
        }
      }
    });

    return list
  }

  function summarize() {
    const list = itemsList();
    $assistantTasks.empty();
    for (let item in list) {
      if (list[item].tasks.length > 0) {
        let tasktype = list[item].tasktype;
        if (tasktype.match(countflag)) {
          tasktype += ' ' + list[item].tasks.length;
        }

        $assistantTasks.append('<div class="tasktype">' + tasktype + '</div>');
        for (let task in list[item].tasks) {
          let text = list[item].tasks[task].text;
          let color = text.match(regflag) ? colors[text.match(regflag)[0]] : 'gray';
          let $task = $('<div class="task"></div>')
          $task.css('color', color);
          $task.text(text);
          $task.on('click', function(){
            goToTask(list[item].tasks[task].top);
          });
          $assistantTasks.append($task);
        }
      }
    }
  }

  function goToTask(top) {
    getMainIframe().find("html, body").animate({ scrollTop: top }, { duration: 'medium', easing: 'swing' });
  }

  let refresh;
  function toggleAssistant(toggle) {
    if (toggle === undefined) toggle = !$.contains($editor, $assistant);

    if (toggle) {
      getMainIframe().find('iframe').contents().find('body').css('width', '69%');
      $editor.prepend($assistant);
      summarize();
      refresh = setInterval(summarize, 5000);
    }
    else {
      clearInterval(refresh);
      $assistant.detach();
      getMainIframe().find('iframe').contents().find('body').css('width', '100%');
    }
  }

  function toggleHelp() {
    $('#help').toggle();
  }

  $editor.prepend($toggle);
  $helpToggle.on('click', toggleHelp);
  $toggle.on('click', function(){
    toggleAssistant();
  });
  toggleAssistant();

  return {
    goToTask,
    toggleAssistant
  };
}());
