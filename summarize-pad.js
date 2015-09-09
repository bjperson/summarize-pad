(function(){
  var link=document.createElement("link");
  link.rel='stylesheet';
  link.type='text/css';
  link.href="https://raw.githubusercontent.com/bjperson/summarize-pad/master/css/main.css?rand="+(Math.round(Math.random()*1000));
  document.head.appendChild(link);
})()

function summarize() {
  
  data = $('iframe').contents().find('iframe').contents();
  
  regtype = '^[A-Z :]{2,}$';
  
  regflag = /\[([^\]]{2,})\]/g;
  
  list = {}
  
  colors = {
    '[URGENT]':'red',
    '[RDV]':'green',
    '[CONF]':'blue',
    '[PARL]':'violet'
  };
  
  $.each($(data).find("div[id*='magicdomid']"), function() {
    that = $(this);
    id = this.id;
    text = that.text();
    if(text.match(regtype)) {
      if (that.contents().find('u').length === 1) {
        list[id] = {'tasktype':text, 'tasks':[]}
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
  
  if ($('#padassistant').length === 1) {
    $('#padassistant').html('');
  }
  else {
    top = $('#editbar').outerHeight();
    $('#editorcontainer').prepend('<div id="padassistant" style="top: '+top+'px;"></div>');
    $('#editorcontainer').prepend('<div id="toggleassistant" onclick="javascript:toggleAssistant()" style="top: '+top+'px;">@</div>');
    
  }
  
  for (item in list) {
    if (list[item].tasks.length > 0) {
      $('#padassistant').append('<div class="tasktype">'+list[item].tasktype+'</div>');
      for (task in list[item].tasks) {
        if (list[item].tasks[task].text.match(regflag)) { color = colors[list[item].tasks[task].text.match(regflag)[0]]; }
        else { color = 'gray';}
        $('#padassistant').append('<div class="task" onclick="javascript:goToTask(\''+list[item].tasks[task].top+'\')" style="color:'+color+';">'+list[item].tasks[task].text+'</div>');
      }
    }
  }
}

function goToTask(top) { 
  $('iframe').contents().find("html, body").animate({ scrollTop: top }, { duration: 'medium', easing: 'swing' });
}

function closePA() {
  $('#padassistant').remove();
}

function toggleAssistant() {
  if ($('#padassistant').length === 1) {
    closePA();
  }
  else {
    summarize();
  }
}

summarize();
