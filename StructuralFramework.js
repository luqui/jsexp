
// StructuralFramework : jQuery -> Module

StructuralFramework = function($) {

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

var foreach = function(array, body) {
    for (var i = 0; i < array.length; ++i) {
        body(array[i]);
    }
};

var text_node = function(text) { return document.createTextNode(text) };

var replace = function(e, replacement, xs) {
    var r = [];
    foreach(xs, function(x) {
        if (e === x) {
            r.push(replacement);
        }
        else {
            r.push(x);
        }
    });
    return r;
};

var arguments_to_array = function(argobj) {
    return Array.prototype.slice.call(argobj);
};

var flatten = function(AoA) {
    return Array.prototype.concat.apply([], AoA);
};


var map_tokenizer = function(f, tokenizer) {
    return function(str) {
        var tokresult = tokenizer(str);
        if (tokresult) {
            return [f(tokresult[0]), tokresult[1]];
        }
        else {
            return null;
        }
    };
};

var extend = function(target, src) {
    for (var k in src) {
        target[k] = src[k];
    }
    return target;
};

var range = function(left, right) {
    var r = [];
    for (var i = left; i < right; i++) {
        r.push(i);
    }
    return r;
};

var splice_replace = function(e, replacements, xs) {
    var r = [];
    foreach(xs, function(x) {
        if (x === e) {
            r.push.apply(r, replacements);
        }
        else {
            r.push(x);
        }
    });
    return r;
};

var $$ = {};

// An Expr is basically an S-expression.  The "head" is a SynClass (see below) rather than
// a string, and the args are a list of ordered arguments, which can be either Exprs or
// strings.  Strings represent dumb literals.
$$.Expr = object({
    init: function(head, args) {
        this.head = head;
        this.args = args;
    }
});

// A SynClass represents a syntactic class, and can go at the head of an Expr.  Creating
// a SynClass is the same as subclassing it; i.e.:
//
//     inherit(SynClass, {
//         method_1: function(x) {...}
//         method_2: function(x,y) {...}
//     })
//
// In addition to the methods here, SynClasses require a 'parse_prefix' method,
// which returns a tokenizer (codecatalog.net/379/) returning a Cursor (see below),
// positioned just after the parsed token.
$$.SynClass = {
    // Make takes Exprs/strings for args and constructs an Expr with this class
    // at the head.  Note that this function takes a list, it is not variadic.
    make: function(args) {
        return new $$.Expr(this, args);
    },
    
    // Render takes a *pre_rendered* argument for each argument in the Expr's
    // args.  It's up to this function just to stitch them together.
    render: function() {
        // XXX yuck, there *has* to be a better way to do this.
        var s = $([]);
        foreach(arguments, function(arg) { s = s.add(arg) });
        return s;
    },
    nav_up: function(zipper) { return zipper.up() },
    nav_down: function(zipper) { return zipper.down(0) },
    nav_left: function(zipper) { return zipper.left() },
    nav_right: function(zipper) { return zipper.right() }
};


// A Context is just like an Expr, except that exactly one of its args has a "hole"
// (represented by null).  The fill method takes an Expr and fills in the hole with
// that Expr.
$$.Context = object({
    init: function(head, args) { // exactly one of args will be null, this is where the "hole" is
        this.head = head;
        this.args = args;
    },
    fill: function(hole) {
        return new $$.Expr(this.head, replace(null, hole, this.args));
    }
});


var context_in = function(expr, pos) {
    var args = expr.args.slice(0);
    args[pos] = null;
    return new $$.Context(expr.head, args);
};

// A Zipper purely represents a syntax tree with a "focused node".  It has a list of
// contexts going from inner to outer representing the context of the focused node, and
// an expr which is the focused node itself.  So eg, if we wanted to represent this tree
// (in s-exp format):
//
//      (foo (bar b c) (baz c (quux d (hopo e) f)) (guam g))
//
// where the quux node is focused, we would use:
//
//     expr: (quux d (hopo e) f)
//     contexts: 
//         (baz c [])
//         (foo (bar b c) [] (guam g))
//
// where we denote the hole in a context by [].
$$.Zipper = object({
    init: function(contexts, expr) {
        this.contexts = contexts;
        this.expr = expr;
    },
    
    // find the position of the focused node within the innermost context
    position: function() {
        return this.contexts[0].args.indexOf(null);
    },
    up: function() {
        if (this.contexts.length == 0) return null;
        
        var cx = this.contexts[0];
        return new $$.Zipper(this.contexts.slice(1), cx.fill(this.expr));
    },
    down: function(n) {
        if (!(0 <= n && typeof(this.expr) === 'object' && n < this.expr.args.length)) return null;

        var focus = this.expr.args[n];
        return new $$.Zipper(
            [context_in(this.expr, n)].concat(this.contexts),
            focus);
    },
    left: function() {
        var u = this.up();
        if (!u) return null;
        return u.down(this.position()-1);
    },
    right: function() {
        var u = this.up();
        if (!u) return null;
        return u.down(this.position()+1);
    },
});


// A Cursor is a Zipper combined with a position.  The position represents a position
// *between* symbols in the focused expression.  So the Cursor is inside some symbols 
// above us, and between two symbols in the focus.  
//
// The position cannot be at the start or the end of the focused expression unless 
// the context stack is empty, because then we are really between two symbols one level
// up.  We require that the focus has at least one child (represent an empty tree by
// padding it with a single node with an empty child).  This requirement is just to
// simplify an already-complicated implementation.
$$.Cursor = object({
    // pos represents the position right before zipper.expr.args[pos].
    init: function(zipper, pos) {
        // normalize to invariant
        while (zipper.contexts.length > 0) {
            if (pos == 0) {
                pos = zipper.position();
                zipper = zipper.up();
            }
            else if (pos == zipper.expr.args.length) {
                pos = zipper.position()+1;
                zipper = zipper.up();
            }
            else {
                break;
            }
        }
        this.zipper = zipper;
        this.pos = pos;
    },
    parse_insert: function(text) {
        var expr = this.zipper.expr;

        var tokresult = expr.args[this.pos].head.parse_prefix()(text);
        if (tokresult) {
            var newcursor = tokresult[0];
            var thiscx = context_in(expr, this.pos);
            var contexts = [].concat(newcursor.zipper.contexts, [thiscx], this.zipper.contexts);
            return [new $$.Cursor(
                        new $$.Zipper(contexts, newcursor.zipper.expr),
                        newcursor.pos),
                    tokresult[1] ];
        }
        else { 
            return null;
        }
    },
    cons_context: function(cx) {
        var cxs = this.zipper.contexts.concat([cx]);
        return new $$.Cursor(new $$.Zipper(cxs, this.zipper.expr), this.pos);
    }
});

var render_head = function(head, args) {
    return elt('span', {}, head.render.apply(head, args));
};

var render_expr_tree = function(expr) {
    if (typeof(expr) === 'string') return $(text_node(expr));
    
    var args = [];
    foreach(expr.args, function(arg) {
        args.push(render_expr_tree(arg));
    });
    return render_head(expr.head, args);
};

var render_context = function(contexts, hole) {
    var r = hole;
    foreach(contexts, function(cx) {
        var args = cx.args.map(function(a) {
            return a === null ? r : render_expr_tree(a)
        });
        r = render_head(cx.head, args);
    });
    return r;
};

$$.render_zipper_with = function(zipper, f) {
    return render_context(
        zipper.contexts,
        f(render_expr_tree(zipper.expr)));
};

$$.render_zipper = function(zipper) {
    return $$.render_zipper_with(zipper, function(t) { 
        return elt('span', {'class': 'selected'}, t);
    });
};

$$.render_cursor = function(cursor, ins) {
    if (typeof(ins) === 'undefined') { ins = $([]) }

    if (cursor.zipper.expr.args.length > 0) {
        var args = cursor.zipper.expr.args.map(function(a,i) {
            var r = render_expr_tree(a);
            return i == cursor.pos ? $(ins).add(elt('span', {'class': 'cursor_selected'}, r)) : r;
        });
        if (cursor.pos == cursor.zipper.expr.args.length) {
            args[args.length-1] = elt('span', {'class': 'cursor_selected_right'}, args[args.length-1], ins);
        }
        var h = render_head(cursor.zipper.expr.head, args);
    }
    else {
        var h = elt('span', {'class': 'cursor_selected'}, 
                    ins, render_head(cursor.zipper.expr.head, args));
    }
        
    return render_context(cursor.zipper.contexts, h);
};

return $$;

};
