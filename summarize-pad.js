function summarize() {
  data = $('iframe').contents().find('iframe').contents();
  
  regtype = '^[A-Z :]{2,}$';
  
  regflag = /\[([^\]]{2,})\]/g;
  
  list = {}
  
  colors = {
    '[URGENT]':'red',
    '[RDV]':'green',
    '[CONF]':'blue',
    '[PARL]':'yellow'
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
        list[listid].tasks.push($(this).text());
      }
    }
    
  });
  
  if ($('#padassistant').length === 1) {
    $('#padassistant').html('');
  }
  else {
    top = $('#editbar').outerHeight();
    $('#editorcontainer').prepend('<div id="padassistant" style="background-color: #fff; border-left: 1px solid #dfdfdf; font-size: 1.5em; height: 100%; overflow: auto; position: absolute; right: 0; top: '+top+'px; width: 30%; z-index: 100;"></div>');
  }
  
  $('#padassistant').append('<a href="javascript:closePA()" title="fermer" style="float:right;font-weight:bold;font-size:2em;color:gray;text-decoration:none">[X]</a>');
  
  for (item in list) {
    if (list[item].tasks.length > 0) {
      $('#padassistant').append('<div style="color:#000;background-color:#D9E7F9;padding:0.8em;font-weight:bold;">'+list[item].tasktype+'</div>');
      console.log(list[item].tasktype)
      for (task in list[item].tasks) {
        if (list[item].tasks[task].match(regflag)) { color = colors[list[item].tasks[task].match(regflag)[0]]; }
        else { color = 'gray';}
        $('#padassistant').append('<div style="color:'+color+';border-bottom:1px solid #dfdfdf;padding:0.3em">'+list[item].tasks[task]+'</div>');
        console.log(list[item].tasks[task])
      }
    }
  }
  
  console.log(list)
}

function closePA() {
  $('#padassistant').remove();
}

summarize();
