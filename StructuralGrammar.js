// StucturalGrammar : StructuralFramework -> Module

StructuralGrammar = function(SF) {

// CodeCatalog Snippet http://www.codecatalog.net/323/2/
var for_kv = function(object, body) {
    for (var k in object) {
        if (object.hasOwnProperty(k)) {
            body(k, object[k]);
        }
    }
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
        if (bestFunc && bestMatch[0].length < str.length) {
            return [bestFunc(bestMatch), str.slice(bestMatch[0].length)];
        }
        else {
            return null;
        }
    }
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/391/1/
var choice_tokenizer = function(tokenizers) {
    return function(str) {
        for (var i = 0; i < tokenizers.length; ++i) {
            var tokresult = tokenizers[i](str);
            if (tokresult) {
                return tokresult;
            }
        }
        return null;
    };
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

// CodeCatalog Snippet http://www.codecatalog.net/256/1/
var text_node = function(text) { return document.createTextNode(text) };
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/357/3/
var escape_for_regexp = function(text) {
    return text.replace(/[\]\[\\^$*+?{}\.()|]/g, function(x) { return '\\' + x });
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/394/3/
var string_tokenizer = function(str, func) {
    var d = {};
    d[escape_for_regexp(str)] = func;
    return regexp_tokenizer(d);
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

var prefix_tokenizer = function(tokenizers) {
    return function(str) {
        var ret = [];
        for (var i = 0; i < tokenizers.length; i++) {
            var tokresult = tokenizers[i](str); 
            if (tokresult) {
                ret.push(tokresult[0]);
                str = tokresult[1];
            }
            else {
                return [ ret, str ];
            }
        }
        return ret;
    };
};

var nonempty_choice_tokenizer = function(tokenizers) {
    if (tokenizers.length == 0) { return function(str) { return null } }
    if (tokenizers.length == 1) { return tokenizers[0] }
    
    return function(str) {
        for (var i = 0; i < tokenizers.length; i++) {
            var tokresult = tokenizers[i](str);
            if (tokresult && tokresult[1].length < str.length) {
                return tokresult;
            }
        }
        return null; // er.. if they *all* accept the empty string, then... er...
    };
};

// CodeCatalog Snippet http://www.codecatalog.net/392/1/
var wrap_fields = function(wrapper, dict) {
    var ret = {};
    for_kv(dict, function(k,v) {
        ret[k] = k in wrapper ? wrapper[k](v) : v;
    });
    return ret;
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/368/1/
var arguments_to_array = function(argobj) {
    return Array.prototype.slice.call(argobj);
};
// End CodeCatalog Snippet

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
    return new SF.SynClass({
        render: function() {
            return elt('span', {'class': 'box'}, text_node(' '));
        },
        parse_prefix: cls.parse_prefix,
        parse_insert: function() {
            return cls.parse_prefix;
        }
    });
};

$$.sym = function(name) {
    return function(grammar) { return grammar(name) }
};

var cursor = function(expr, pos) {
    return new SF.Cursor(new SF.Zipper([], expr), pos);
};

var cons_context = function(cx, cursor) {
    var cxs = [cx].concat(cursor.zipper.contexts);
    return new SF.Cursor(new SF.Zipper(cxs, cursor.zipper.expr), cursor.pos);
};

$$.empty = function(grammar) {
    var c = new SF.SynClass({
        open: function() { return this.make([]) },
        parse_prefix: function(str) { 
            return [ cursor(c.make([]), 0), str ] 
        }
    });
    return c;
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

$$.literal = function(str) {
    return function(grammar) {
        var c = new SF.SynClass({
            open: function() {
                return c.make([str]);
            },
            parse_prefix: string_tokenizer(str, function() { 
                return cursor(c.make([str]), 1);
            })
        });
        return c;
    };
};

$$.token = function(rx) {
    return function(grammar) {
        var toks = {};
        toks[rx.source] = function(m) {
            return cursor($$.literal(m[0])(grammar).make([m[0]]), 1);
        };
        var c = new SF.SynClass({
            open: function() { return box_synclass(c).make([]) },
            parse_prefix: regexp_tokenizer(toks)
        });
        return c;
    };
};

$$.seq = function() {
    var xs = arguments_to_array(arguments);
    return function(grammar) {
        var get_subsyms = function() { return xs.map(function(x) { return x(grammar) }) };
        var c = new SF.SynClass({
            open: function() {
                return this.make(get_subsyms().map(function(x) { return x.open() }));
            },
            parse_prefix: function(str) {
                var subsyms = get_subsyms();
                var rs = subsyms.map(function(x) { return x.open() });
                for (var i = 0; i < subsyms.length; i++) {
                    var tokresult = subsyms[i].parse_prefix(str);
                    if (tokresult) {
                        rs[i] = tokresult[0];
                        if (tokresult[1].length < str.length) { // consumed input
                            rs[i] = null;
                            var newcx = new SF.Context(c, rs);
                            return [ cons_context(newcx, tokresult[0]), tokresult[1] ]
                        }
                    }
                    else {
                        return null;
                    }
                }
                // no input consumed.  the sequence accepts the empty string.
                return [ cursor(c.make(rs), rs.length), str ];
            }
        });
        return c;
    };
};

$$.choice = function() {
    if (arguments.length == 0) { throw "Empty choice node" }
    if (arguments.length == 1) { return arguments[0] } 
    
    var xs = arguments_to_array(arguments);
    return function(grammar) {
        var c = new SF.SynClass({
            open: function() {
                return box_synclass(c).make([]);
            },
            parse_prefix: nonempty_choice_tokenizer(xs.map(function(x) {
                return x(grammar).parse_prefix
            }))
        });
        return c;
    };
};

$$.grammar = function(top, grammar) {
    var lookup = function(s) { return grammar[s](lookup) };
    return lookup(top);
};

return $$;

};
