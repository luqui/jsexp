// StucturalGrammar : StructuralFramework -> Module

StructuralGrammar = function(SF, Tok) {

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

var wrap_fields = function(wrapper, dict) {
    var ret = { constructor: dict.constructor };
    for (var k in dict) {
        ret[k] = k in wrapper ? wrapper[k](dict[k]) : dict[k];
    }
    return ret;
};

var arguments_to_array = function(argobj) {
    return Array.prototype.slice.call(argobj);
};

// A grammar is an object that maps nonterminal names to syntactic forms,
// where syntactic forms are built up as combinators.

// The final representation returned by these combinators is simply an
// SynClass representing that symbol.

// Our intermediate representation will be a simple open fixed point.
// Grammar = String -> (Grammar -> SynClass).   We will pass the final grammar
// to a point in the grammar so it can refer to other nonterminals within itself.  
// As an unintended bonus, we also get grammar inheritance.
//
// For the Grammar argument, we'll use a proper function instead of an object
// so we can do renaming during inheritance.

var $$ = {};

// a synclass for an "open box"...
// this should be separated into two concepts: classes of actual exprs,
// and classes of expr generators, or something.
var box_synclass = function(cls) {
    return inherit(SF.SynClass, {
        render: function() {
            return elt('span', {'class': 'box'}, text_node(' '));
        },
        parse_prefix: cls.parse_prefix
    });
};

$$.sym = function(name) {
    return function(grammar) { return grammar(name) }
};

var cursor = function(expr, pos) {
    return new SF.Cursor(new SF.Zipper([], expr), pos);
};

$$.empty = function(grammar) {
    return inherit(SF.SynClass, {
        open: function() { return this.make([]) },
        parse_prefix: method(function(self) {
            return function(str) { 
                // XXX cursor violates nonempty invariant
                return [ cursor(self.make([]), 0), str ] 
            } 
        })
    })
};

$$.cls = function(clsname, syn) {
    return function(grammar) {
        return wrap_fields({
            render: function(render) {
                return elt('span', {'class': clsname}, render.apply(this, arguments));
            }
        }, syn(grammar));
    };
};

var extend = function(target, src) {
    for (var k in src) {
        target[k] = src[k];
    }
    return target;
};

var trace = function() {
    console.log.apply(console, arguments);
    return arguments[arguments.length-1];
};

var inherit = function(o, newmethods) {
    var F = function() {};
    F.prototype = o;
    return extend(new F(), newmethods);
};

var method = function(m) {
    return function() {
        var args = [this].concat(arguments);
        return m.apply(this, args);
    };
};

$$.indent = function(syn) {
    return function(grammar) {
        return inherit(SF.SynClass, {
            open: function() { return this.make([syn(grammar).open()]) },
            render: function() {
                var subelt = this.__proto__.render.apply(this, arguments);
                return elt('div', {'class': 'indented'}, subelt);
            },
            parse_prefix: function() { 
                var self = this;
                return Tok.map(function(t) {
                    return t.cons_context(new SF.Context(self, [null]));
                }, syn(grammar).parse_prefix());
            }
        });
    };
};

$$.literal = function(str, canon) {
    if (typeof(canon) == 'undefined') {
        canon = str;
    }
    return function(grammar) {
        return inherit(SF.SynClass, {
            open: function() {
                return this.make([canon]);
            },
            parse_prefix: method(function(self) {
                return Tok.string(str, function() { 
                    return cursor(self.make([canon]), 1);
                })
            })
        });
    };
};

$$.token = function(rx, canon) {
    return function(grammar) {
        var toks = {};
        toks[rx.source] = function(m) {
            var tok = typeof(canon) === 'undefined' ? m[0] : canon;
            return cursor($$.literal(m[0])(grammar).make([tok]), 1);
        };

        return inherit(SF.SynClass, {
            open: function() { return box_synclass(this).make([]) },
            parse_prefix: function() { return Tok.regexp(toks) }
        });
    };
};

$$.seq = function() {
    var xs = arguments_to_array(arguments);
    return function(grammar) {
        var get_subsyms = function() { return xs.map(function(x) { return x(grammar) }) };
        return inherit(SF.SynClass, {
            open: function() {
                return this.make(get_subsyms().map(function(x) { return x.open() }));
            },
            parse_prefix: method(function(self) { return function(str) {
                var subsyms = get_subsyms();
                var rs = subsyms.map(function(x) { return x.open() });
                for (var i = 0; i < subsyms.length; i++) {
                    var tokresult = subsyms[i].parse_prefix()(str);
                    if (tokresult) {
                        rs[i] = tokresult[0];
                        if (tokresult[1].length < str.length) { // consumed input
                            rs[i] = null;
                            var newcx = new SF.Context(self, rs);
                            return [ tokresult[0].cons_context(newcx), tokresult[1] ]
                        }
                    }
                    else {
                        return null;
                    }
                }
                // no input consumed.  the sequence accepts the empty string.
                return [ cursor(self.make(rs), rs.length), str ];
            } })
        });
    };
};

$$.choice = function() {
    if (arguments.length == 0) { throw "Empty choice node" }
    if (arguments.length == 1) { return arguments[0] } 
    
    var xs = arguments_to_array(arguments);
    return function(grammar) {
        return inherit(SF.SynClass, {
            open: function() {
                return box_synclass(this).make([]);
            },
            parse_prefix: function() { 
                return Tok.nonempty_choice(xs.map(function(x) {
                    return x(grammar).parse_prefix()
                })) 
            }
        });
    };
};

$$.grammar = function(top, grammar) {
    var lookup = function(s) { return grammar[s](lookup) };
    return lookup(top);
};

return $$;

};
