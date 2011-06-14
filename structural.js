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

// CodeCatalog Snippet http://www.codecatalog.net/378/2/
var regexp_tokenizer = function(tokens) { 
    return function(str) {
        var bestMatch = null;
        var bestFunc = null; 
        for_kv(tokens, function(k,v) {
            var m = new RegExp('^' + k)(str);
            if (m && (!bestMatch || m[0].length > bestMatch[0].length)) {
                bestMatch = m;
                bestFunc = v;
            }
        });

        // don't match the whole string in case we are in the middle of typing a token
        // we use \0 to mean "eof" so this will pass.
        if (bestFunc && (bestMatch[0].length < str.length || true)) {
            return [bestFunc(bestMatch), str.slice(bestMatch[0].length)];
        }
        else {
            return null;
        }
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/381/1/
var multi_tokenizer = function(tokenizer) {
    return function(str) {
        var tokresult = tokenizer(str);
        var ret = [];
        while (tokresult) {
            ret.push(tokresult[0]);
            str = tokresult[1];
            tokresult = tokenizer(str);
        }
        return [ret, str];
    };
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

var Expr = object({
    init: function(head, args) {
        this.head = head;
        this.args = args;
    }
});

var EClass = object({
    init: function(opts) {
        extend(this, opts);
    },
    make: function() {
        return new Expr(this, arguments_to_array(arguments));
    },
    render: function() {
        return arguments_to_array(arguments);
    },
    parse: function(zipper) {
        var expr = zipper.expr;
        return function(inp) {
            var new_args = expr.args.slice(0);
            for (var i = 0; i < expr.args.length; i++) {
                var arg = expr.args[i];
                if (typeof(arg) === 'string') {
                    // skip literals, why would they type it if it's already there?  (brackets are an exception)
                    continue;
                }
                
                var tokresult = arg.head.parse(zipper.down(i))(inp);
                if (tokresult) {
                    new_args[i] = tokresult[0].expr;  // what if the context was changed!
                    inp = tokresult[1];
                }
                else {
                    if (inp === '') break;  // ok, just partial input
                    else return null;       // legit failure
                }
            }
            return [new Zipper(zipper.contexts, new Expr(expr.head, new_args)), inp];
        }
    }
});

var Exp_E = new EClass({
    cls: 'E'
});

var Exp_eplus_single = new EClass({
    cls: 'eplus'
});

var Exp_eplus = new EClass({
    cls: 'eplus'
});

var Exp_plus_token = new EClass({
    cls: 'plus_token',
    render: function() {
        return [text_node(' + ')]
    }
});

var Exp_eatom = new EClass({
    cls: 'eatom'
});

var Exp_box = function(cls, tokenizer) {
    return new EClass({
        cls: cls,
        render: function() {
            var epsilon = tokenizer('');
            // if it accepts the empty string, then assume that was parsed
            console.log("Epsilon: ", epsilon);
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
        parse: function(zipper) {
            return map_tokenizer(function(expr) { 
                return new Zipper(zipper.contexts, expr) }, tokenizer)
        }
    });
};

var Exp_eplus_box = Exp_box('eplus', regexp_tokenizer({
    '\\d+': function(m) { 
        return Exp_eplus.make(Exp_eatom.make(m[0]), Exp_eplus_cont_box.make()) 
    }
}));

var Exp_eplus_cont_box = Exp_box('eplus', regexp_tokenizer({
    '': function(m) {
        return Exp_eplus_cont_box.make();
    },
    '\\+': function(m) {
        return Exp_eplus.make(Exp_plus_token.make(), Exp_eplus_box.make())
    }
}));

var Context = object({
    init: function(head, args) { // exactly one of args will be null, this is where the "hole" is
        this.head = head;
        this.args = args;
    },
    fill: function(hole) {
        return new Expr(this.head, replace(null, hole, this.args));
    }
});

var Zipper = object({
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
        var cx = this.contexts[0];
        return new Zipper(this.contexts.slice(1), cx.fill(this.expr));
    },
    down: function(n) {
        var args = this.expr.args.slice(0);
        var focus = args[n];
        args[n] = null;
        
        return new Zipper(
            [new Context(this.expr.head, args)].concat(this.contexts),
            focus);
    },
    left: function() {
        return this.up().down(this.position()-1);
    },
    right: function() {
        return this.up().down(this.position()+1);
    },
});

var zipper_leaves = function(z) {
    if (z.arity == 0) { return [z] }
    return flatten(
        range(0,arity).map(function(i) { return zipper_leaves(z.down(i)) }));
};

var render_head = function(head, args) {
    var ret = elt('span', { 'class': head.cls });
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

var render_zipper = function(zipper) {
    return render_context(
        zipper.contexts, 
        elt('span', {'class': 'selected'}, 
            render_expr_tree(zipper.expr)));
};
