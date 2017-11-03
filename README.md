# fifolist
jquery plugin.
It changes element to the list of lines, which could be continually growing.

Without users intervence, the list is following added lines - it is scrolling to the last one added.
If user scrolls the list somewhere, list keeps that position, until it is scrolled to the end.
Then it start follow lines again.

There is also available method "goto" for direct scrolling to the beginning or to the end of list.

After configured amount of lines is reached, oldest lines start disapear - first in first out.
This feature is initially switched off.

Lines also could be prepended to the beginning, instead to the end of list.
In such case, all user interaction is reverted accordingly.


Usage:
``` html
    <!-- insert before the end tag of body element, after included jquery: -->
    <script type="text/javascript" src="jquery.fifolist.js" ></script>
    <script type="text/javascript" >
    /* If direct reference to instance api is needed: */
    var fifolist = $.FiFoList('#fifoList', { /* options */ });
    /* OR: */
    $('.fifoLists').FiFoList({/* options */});
    </script>
    
```

Options:
``` javascript
    var fifolist = $.FiFoList('#fifoList', {
      // These are the default values:
        'maxListLength': false, // If number, after that length the listing lines start disapear - first in first out.
        'prepend': false, // new lines could be appended or prepended.
        'api': variable, // into this variable is inserted api interface to this instance. Optional.
        'line': string, // this line is added to element. Optional.
        
        // List is empty:
        'onEmpty': function() {}, // Callback. Default is to trigger jquery event "fifolist-empty"
        
        // List begins to overflow: there is more lines then allows css height, scrollbar start appeared:
        'onOverflow': function() {}, // Callback. Default is to trigger jquery event "fifolist-overflow"
        
        // User scrolled somewhere inside element, so plugin stops followed new added lines:
        'onUser': function() {}, // Callback. Default is to trigger jquery event "fifolist-user"
        
        // User scrolled in the end, so plugin follows new added lines:
        'onAuto': function() {} // Callback. Default is to trigger jquery event "fifolist-auto"
    });
```

Methods:
``` javascript
    fifolist.add(line); // adds one line to the element. If element is UL/OL, added line is LI, else DIV is used.
    fifolist.count(); // returns integer count of lines
    fifolist.clear(); // element is emptied
    fifolist.destroy(); // free instance
    fifolist.goto('start'); // scrolls element to the beginning or end, valid options are strings ['start', 'end']
    fifolist.go({ /* options */ }); //evaluates options as in constructor.
```
