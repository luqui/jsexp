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

// CodeCatalog Snippet http://www.codecatalog.net/323/2/
var for_kv = function(object, body) {
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            body(k, object[k]);
        }
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/331/2/
var object = function(methods) {
    var constr = methods['init'] || function() {};
    for_kv(methods, function(k,v) {
        constr.prototype[k] = v;
    });
    return constr;
};
// End CodeCatalog Snippet



var code_container = elt('div');
var mode_container = elt('span', {'class': 'modeline'});
var container = elt('div', {}, code_container, mode_container);

var mode;

var NormalMode = object({
    init: function(zipper) {
        this.zipper = zipper;
        this.update(zipper);
        mode_container.text('Normal');
    },
    keydown: function(e) {
        var head = typeof(this.zipper.expr) === 'string' ? new SF.SynClass({}) : this.zipper.expr.head;
        var self = this;

        var navigate = function(dir) {
            self.update(head[dir].call(head, self.zipper));
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
        else {
            //console.log(e.which, e.charCode);
        }
    },
    keypress: function(e) {
        var ch = String.fromCharCode(e.charCode);
        if (ch == 'i') {
            mode = new InsertMode(new SF.Cursor(this.zipper, 0));
        }
    },
    render: function() {
        code_container.empty();
        code_container.append(elt('pre', {}, SF.render_zipper(this.zipper)));
    },
    update: function(z) {
        if (!z) return;
        this.zipper = z;
        this.render();
    }
});

var InsertMode = object({
    init: function(cursor) {
        this.cursor = cursor;
        this.input_buffer = '';
        this.update(cursor);
        mode_container.text('Insert');
    },
    keydown: function(e) {
        if (8 == e.which) { // backspace
            this.input_buffer = this.input_buffer.slice(0, this.input_buffer.length-1);
            this.render();
        }
        else if (27 == e.which) { // escape
            mode = new NormalMode(this.cursor.zipper);
        }
    },
    keypress: function(e) {
        if (!(32 <= e.which && e.which <= 127)) return;  // non-printable

        var ch = String.fromCharCode(e.charCode);
        this.input_buffer += ch;

        var tokresult = this.cursor.parse_insert(this.input_buffer);
        if (tokresult) {
            this.input_buffer = tokresult[1];
            this.update(tokresult[0]);
        }
        this.render();
    },
    render: function() {
        code_container.empty();
        code_container.append(elt('pre', {}, SF.render_cursor(this.cursor, text_node(this.input_buffer))));
    },
    update: function(c) {
        if (!c) return;
        this.cursor = c;
        this.render();
    },
});

var TopCls = new SF.SynClass({});

mode = new NormalMode(new SF.Zipper([], TopCls.make([top_node])));

event_node.keydown(function(e) {
    return mode.keydown(e);
});

event_node.keypress(function(e) {
    return mode.keypress(e);
});

return container;

};
