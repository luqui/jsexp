
// StructuralFramework : jQuery -> Module

StructuralFramework = function($) {

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

// CodeCatalog Snippet http://www.codecatalog.net/279/1/
var foreach = function(array, body) {
    for (var i = 0; i < array.length; ++i) {
        body(array[i]);
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/256/1/
var text_node = function(text) { return document.createTextNode(text) };
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/366/2/
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
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/368/1/
var arguments_to_array = function(argobj) {
    return Array.prototype.slice.call(argobj);
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/370/1/
var flatten = function(AoA) {
    return Array.prototype.concat.apply([], AoA);
};
// End CodeCatalog Snippet


// CodeCatalog Snippet http://www.codecatalog.net/383/1/
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
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/385/2/
var extend = function(target, src) {
    for (var k in src) {
        target[k] = src[k];
    }
    return target;
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/387/1/
var range = function(left, right) {
    var r = [];
    for (var i = left; i < right; i++) {
        r.push(i);
    }
    return r;
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/389/2/
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
// End CodeCatalog Snippet

var $$ = {};

$$.Expr = object({
    init: function(head, args) {
        this.head = head;
        this.args = args;
    }
});

$$.SynClass = object({
    init: function(opts) {
        extend(this, opts);
    },
    make: function(args) {
        return new $$.Expr(this, args);
    },
    render: function() {
        return arguments_to_array(arguments);
    },
    parse_insert: function(expr) {
        return function(inp) {
            var new_args = expr.args.slice(0);
            for (var i = 0; i < expr.args.length; i++) {
                var arg = expr.args[i];
                if (typeof(arg) === 'string') {
                    // skip literals, why would they type it if it's already there?  (brackets are an exception)
                    continue;
                }
                
                var tokresult = arg.head.parse_insert(arg)(inp);
                if (tokresult) {
                    new_args[i] = tokresult[0];
                    inp = tokresult[1];
                }
                else {
                    break;
                }
            }
            return [new $$.Expr(expr.head, new_args), inp];
        }
    },
    nav_up: function(zipper) { return zipper.up() },
    nav_down: function(zipper) { return zipper.down(0) },
    nav_left: function(zipper) { return zipper.left() },
    nav_right: function(zipper) { return zipper.right() }
});

$$.Context = object({
    init: function(head, args) { // exactly one of args will be null, this is where the "hole" is
        this.head = head;
        this.args = args;
    },
    fill: function(hole) {
        return new $$.Expr(this.head, replace(null, hole, this.args));
    }
});

$$.Zipper = object({
    init: function(contexts, expr) {
        this.contexts = contexts;
        this.expr = expr;
    },
    position: function() {
        return this.contexts[0].args.indexOf(null);
    },
    arity: function() {
        return this.contexts[0].args.length;
    },
    up: function() {
        if (this.contexts.length == 0) return null;
        
        var cx = this.contexts[0];
        return new $$.Zipper(this.contexts.slice(1), cx.fill(this.expr));
    },
    down: function(n) {
        if (!(0 <= n && typeof(this.expr) === 'object' && n < this.expr.args.length)) return null;

        var args = this.expr.args.slice(0);
        var focus = args[n];
        args[n] = null;
        
        return new $$.Zipper(
            [new $$.Context(this.expr.head, args)].concat(this.contexts),
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

var render_head = function(head, args) {
    var ret = elt('span');
    foreach(head.render.apply(head, args), function(arg) {
        ret.append(arg);
    });
    return ret;
};

var render_expr_tree = function(expr) {
    if (typeof(expr) === 'string') return text_node(expr);
    
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

return $$;

};
