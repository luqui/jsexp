// StructuralEditor : jQuery * StructuralFramework -> top_node -> event_node -> Module

StructuralEditor = function($, SF, top_node, event_node) {

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

var text_node = function(text) { return document.createTextNode(text) };

var for_kv = function(object, body) {
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            body(k, object[k]);
        }
    }
};

var object = function(methods) {
    var constr = methods['init'] || function() {};
    for_kv(methods, function(k,v) {
        constr.prototype[k] = v;
    });
    return constr;
};


var action_map = {
    left:  { key: '&larr;', keycode: 37 },
    up:    { key: '&uarr;', keycode: 38 },
    right: { key: '&rarr;', keycode: 39 },
    down:  { key: '&darr;', keycode: 40 }
};


var code_container = elt('div');
var mode_container = elt('span', {'class': 'modeline'});
var help_container = elt('div');
var container = elt('div', {}, code_container, mode_container, help_container);

var mode;

var NormalMode = object({
    init: function(zipper) {
        this.zipper = zipper;
        this.update(zipper);
        mode_container.text('Normal');
    },
    get_head: function() {
        return typeof(this.zipper.expr) === 'string' ? SF.SynClass : this.zipper.expr.head;
    },
    keydown: function(e) {
        var head = this.get_head();
        var self = this;

        var navigate = function(dir) {
            self.update(self.zipper.actions()[dir]());
        };

        for_kv(self.zipper.actions(), function(k,v) {
            if (action_map[k] && action_map[k].keycode == e.which) {
                self.update(v());
            }
        });
        //console.log(e.which, e.charCode);
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
        this.render_help();
    },
    render_help: function() {
        var head = this.get_head();
        var self = this;
        help_container.empty();

        var table = elt('table');
        help_container.append(table);
        for_kv(self.zipper.actions(), function(k,v) {
            if (action_map[k]) {
                table.append(
                    elt('tr', {},
                        elt('td', {}, text_node(k + " : ")),
                        elt('td', {}, action_map[k].key)));
            }
        });
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
            return false;
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
        var newel = elt('pre', {}, SF.render_cursor(this.cursor, $(text_node(this.input_buffer))));
        code_container.append(newel);
    },
    update: function(c) {
        if (!c) return;
        this.cursor = c;
        this.render();
    },
});

var TopCls = SF.SynClass;

mode = new NormalMode(new SF.Zipper([], TopCls.make([top_node])));

event_node.keydown(function(e) {
    return mode.keydown(e);
});

event_node.keypress(function(e) {
    return mode.keypress(e);
});

return container;

};
