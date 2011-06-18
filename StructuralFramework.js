
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

// CodeCatalog Snippet http://www.codecatalog.net/359/1/
var trace = function() {
    console.log.apply(console, arguments);
    return arguments[arguments.length-1];
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
    make: function() {
        return new $$.Expr(this, arguments_to_array(arguments));
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

$$.Exp_box = function(tokenizer) {
    return new $$.SynClass({
        render: function() {
            var epsilon = tokenizer('');
            // if it accepts the empty string, then assume that was parsed
            if (epsilon) { 
                // should return epsilon[0].head.render(); }
                // but that gets us into a infinite loop if we return a box
                // when parsing empty string, as we would like
                return [] 
            }
            // otherwise display a visible "empty box"
            else { 
                return [ elt('span', { 'class': 'box' }, text_node(' '))] 
            }
        },
        parse_insert: function(expr) {
            return tokenizer;
        }
    });
};

$$.Infix_assoc_box = function(term_tokenizer, op_tokenizer) {
    return new $$.SynClass({
        make: function() {
            var view = $$.Infix_assoc_view(term_tokenizer, op_tokenizer);
            return this.__proto__.make.call(this, view.make.apply(view, arguments));
        }
    });
};

$$.Infix_assoc_view = function(term_tokenizer, op_tokenizer) {
    var slice_zipper = function(zipper, cxargs, args) {
        return new Zipper([new $$.Context(zipper.contexts[0].head, cxargs)].concat(zipper.contexts.slice(1)),
                          new $$.Expr(zipper.expr.head, args));
    };

    return new $$.SynClass({
        parse_insert: function(expr) {
            var self = this;
            return function(inp) {
                // XXX __proto__ instead of prototype?
                var tokresult = self.__proto__.parse_insert.call(self, expr)(inp);
                if (tokresult && tokresult[1] !== '') {
                    inp = tokresult[1];
                    var op_tokresult = op_tokenizer(inp);
                    if (op_tokresult) {
                        var term = $$.Exp_box(term_tokenizer).make();
                        var r = tokresult[0];
                        return [ new $$.Expr(r.head, r.args.concat([ op_tokresult[0], term ])), op_tokresult[1] ];
                    }
                    else {
                        return tokresult;
                    }
                }
                else {
                    return tokresult;
                }
            }
        },
        make: function() {
            if (arguments.length == 0) {  // can't be empty
                return this.make($$.Exp_box(term_tokenizer).make());
            }
            else {
                // XXX __proto__ instead of prototype?
                return this.__proto__.make.apply(this, arguments);
            }
        },
        nav_down: function(zipper) {
            var args = zipper.expr.args;

            if (args.length == 1) {
                return zipper.down(0);
            }

            var newargs = args.slice(0, args.length-2);  // 2 = one operand, one operator
            var newcxargs = splice_replace(null, [null, args[args.length-2], args[args.length-1]], zipper.contexts[0].args);

            return slice_zipper(zipper, newcxargs, newargs);
        },
        nav_up: function(zipper) {
            var cxargs = zipper.contexts[0].args;
            var args = zipper.expr.args;
            if (cxargs.length == 1) {
                return zipper.up();
            }
            
            var pos = cxargs.indexOf(null);

            if (pos == cxargs.length-1) {   // get the two thingies to the left
                var newargs = cxargs.slice(cxargs.length-3, cxargs.length-1).concat(args);
                var newcxargs = cxargs.slice(0, cxargs.length-3).concat([null]);
            }
            else if (pos == 0 || args.length > 1 || pos % 2 == 0) { // get the two thingies to the right
                var newargs = args.concat(cxargs.slice(pos+1, pos+3));
                var newcxargs = cxargs.slice(0, pos).concat([null], cxargs.slice(pos+3));
            }
            else {
                // we must be on an operator
                var newargs = [].concat([cxargs[pos-1]], args, [cxargs[pos+1]]);
                var newcxargs = cxargs.slice(0, pos-1).concat([null], cxargs.slice(pos+2));
            }
            
            return slice_zipper(zipper, newcxargs, newargs);
        },
        nav_right: function(zipper) {
            var cxargs = zipper.contexts[0].args;
            var args = zipper.expr.args;
            var pos = cxargs.indexOf(null);
            
            if (cxargs.length == 1) return null;
            if (pos == cxargs.length-1) return null;

            if (args.length == 1) {
                var newargs = [cxargs[pos+1]];
                var newcxargs = cxargs.slice(0, pos).concat([args[0], null], cxargs.slice(pos+2));
            }
            else {
                var newargs = args.slice(2).concat(cxargs.slice(pos+1, pos+3));
                var newcxargs = cxargs.slice(0, pos).concat(args.slice(0,2), [null], cxargs.slice(pos+3));
            }

            return slice_zipper(zipper, newcxargs, newargs);
        },
        nav_left: function(zipper) {
            var cxargs = zipper.contexts[0].args;
            var args = zipper.expr.args;
            var pos = cxargs.indexOf(null);
            
            if (cxargs.length == 1) return null;
            if (pos == 0) return null;

            if (args.length == 1) {
                var newargs = [cxargs[pos-1]];
                var newcxargs = cxargs.slice(0, pos-1).concat([null, args[0]], cxargs.slice(pos+1));
            }
            else {
                var newargs = cxargs.slice(pos-2,pos).concat(args.slice(0, args.length-2));
                var newcxargs = cxargs.slice(0, pos-2).concat([null], args.slice(args.length-2), cxargs.slice(pos+1));
            }

            return slice_zipper(zipper, newcxargs, newargs);
        }
    });
};


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
