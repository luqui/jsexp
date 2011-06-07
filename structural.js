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

// CodeCatalog Snippet http://www.codecatalog.net/366/1/
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

var Expr = object({
    init: function(head, args) {
        this.head = head;
        this.args = args;
    }
});

var EClass = object({
    init: function(opts) {
        this.cls = opts.cls;
        this.render = opts.render;
        this.keypress = opts.keypress;
    },
    make: function() {
        return new Expr(this, arguments_to_array(arguments));
    },
})

var Exp_E = new EClass({
    cls: 'E',
    render: function(eplus) {
        return [eplus];
    },
});

var Exp_eplus = new EClass({
    cls: 'eplus',
    render: function(eplus, plus_token, eatom) {
        return [eplus, plus_token, eatom];
    },
});

var Exp_plus_token = new EClass({
    cls: 'plus_token',
    render: function() {
        return [text_node(' + ')]
    }
});

var Exp_eatom = new EClass({
    cls: 'eatom',
    render: function() {
        return [text_node('0')];
    }
});

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
        if (bestFunc) {
            return [bestFunc(bestMatch), str.slice(bestMatch[0].length)];
        }
        else {
            return null;
        }
    }
};

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


var Exp_unassembled = function(parser) {
    var tokenize = parser.tokenizer;
    var parse = parser.parser;

    return new EClass({
        cls: 'unassembled',
        render: function() {
            return arguments_to_array(arguments);
        },
        keypress: function(char, zipper) {
            var args = zipper.exp.args;
            if (args == 0 || typeof(args[args.length-1]) != 'string') {
                args = args.concat(['']);
            }
            
            var str = args[args.length-1] + char;
            var tokresult = tokenize(str);
            if (tokresult) {
                var toks = tokresult[0];
                var remaining = tokresult[1];
            }
            else {
                var toks = [];
                var remaining = str;
            }

            var newargs = parse(args.slice(0, args.length-1))
                               .concat(toks)
                               .concat(remaining === '' ? [] : [remaining]);
            return new Zipper(zipper.contexts, new Expr(zipper.exp.head, newargs));
        }
    })
};

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
    init: function(contexts, exp) {
        this.contexts = contexts;
        this.exp = exp;
    },
    position: function() {
        return this.contexts[0].args.indexOf(null);
    },
    arity: function() {
        return this.contexts[0].args.length;
    },
    up: function() {
        var cx = this.contexts[0];
        return new Zipper(this.contexts.slice(1), cx.fill(this.exp));
    },
    down: function(n) {
        var args = this.exp.args.slice(0);
        var focus = args[n];
        args[n] = null;
        
        return new Zipper(
            [new Context(this.exp.head, args)].concat(this.contexts),
            focus);
    },
    left: function() {
        return this.up().down(this.position()-1);
    },
    right: function() {
        return this.up().down(this.position()+1);
    }
});

var render_head = function(head, args) {
    var ret = elt('span', { 'class': head.cls });
    foreach(head.render.apply(head, args), function(arg) {
        ret.append(arg);
    });
    return ret;
};

var render_exp_tree = function(exp) {
    if (typeof(exp) === 'string') return text_node(exp);
    
    var args = [];
    foreach(exp.args, function(arg) {
        args.push(render_exp_tree(arg));
    });
    return render_head(exp.head, args);
};

var render_context = function(contexts, hole) {
    var r = hole;
    foreach(contexts, function(cx) {
        var args = cx.args.map(function(a) {
            return a === null ? r : render_exp_tree(a)
        });
        r = render_head(cx.head, args);
    });
    return r;
};

var render_zipper = function(zipper) {
    return render_context(
        zipper.contexts, 
        elt('span', {'class': 'selected'}, 
            render_exp_tree(zipper.exp)));
};
