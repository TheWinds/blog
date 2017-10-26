$(function() {
    $('code').each(function() {
    //   $(this).parent('pre').addClass('line-numbers')
      let code_class=$(this).attr('class')
      if (code_class===undefined){ 
          addDefaultHighlightClass($(this))
          return
        }
      if (code_class.indexOf('language-')===-1){
        addDefaultHighlightClass($(this))
      }
    })
    
})

function addDefaultHighlightClass(el) {
    el.addClass('language-default');
}