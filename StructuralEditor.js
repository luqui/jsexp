// StructuralEditor : jQuery * StructuralFramework -> top_node -> event_node -> Module

StructuralEditor = function($, SF, top_node, event_node) {

// CodeCatalog Snippet http://www.codecatalog.net/16/3/
var elt = function(name, attrs) {
    var r = $(document.createElement(name));
    if (attrs) {
        for (var i in attrs) {
            r.attr(i, attrs[i]);
        }
    }
    for (var i = 2; i < arguments.length; ++i) {
        r.append(arguments[i]);
    }
    return r;
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/256/1/
var text_node = function(text) { return document.createTextNode(text) };
// End CodeCatalog Snippet

var container = elt('div');

var input_buffer = '';

var zipper = new SF.Zipper([], top_node);

var update = function(z) {
    if (!z) return;
    zipper = z;
    container.empty();
    container.append(elt('pre', {}, SF.render_zipper_with(z, function(t) { 
        return elt('span', {'class': 'selected'}, t, text_node(input_buffer)) 
    })));
};

update(zipper);

event_node.keydown(function(e) {
    var head = typeof(zipper.expr) === 'string' ? new SF.SynClass({}) : zipper.expr.head;

    var navigate = function(dir) {
        input_buffer = '';
        update(head[dir].call(head, zipper));
    };
    
    if (37 == e.which) { // left
        navigate('nav_left');
    }
    else if (38 == e.which) { // up
        navigate('nav_up');
    }
    else if (39 == e.which) { // right
        navigate('nav_right');
    }
    else if (40 == e.which) { // down
        navigate('nav_down');
    }
    else if (8 == e.which) { // backspace
        input_buffer = input_buffer.slice(0, input_buffer.length-1);
        update(zipper);
        return false;  // prevent browser from handling it
    }
    else {
        //console.log(e.which, e.charCode);
    }
});

event_node.keypress(function(e) {
    if (e.which == 8) {  // backspace
        return false;
    }

    if (typeof(zipper.expr) !== 'string') {
        var ch = String.fromCharCode(e.charCode);
        input_buffer += ch;
        var tokresult = zipper.expr.head.parse_insert(zipper.expr)(input_buffer);
        if (tokresult) {
            input_buffer = tokresult[1];
            update(new SF.Zipper(zipper.contexts, tokresult[0]));
        }
        else {
            update(zipper);
        }
    }
    return false;
});

return container;

};
