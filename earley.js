EarleyParser = function() {

// CodeCatalog Snippet http://www.codecatalog.net/279/1/
var foreach = function(array, body) {
    for (var i = 0; i < array.length; ++i) {
        body(array[i]);
    }
};
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

// CodeCatalog Snippet http://www.codecatalog.net/321/1/
var unique_id = function() {
    var id = 0;
    return function() { return id++ };
}();
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/186/1/
var maximum_by = function(measure, xs) {
    var max_x = xs[0];
    var max_measure = measure(max_x);
    for (var i = 1; i < xs.length; i++) {
        var m = measure(xs[i]);
        if (m > max_measure) {
            max_x = xs[i];
            max_measure = m;
        }
    }
    return max_x;
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/32/2/
var max = function() {
    var r = arguments[0];
    for (var i = 1; i < arguments.length; ++i) {
        if (arguments[i] > r) r = arguments[i];
    }
    return r;
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/328/1/
var terminal_path = function(root, children) {
    var traverse = function(x) {
        var r = [];
        while (x) {
            r.push(x.node);
            x = x.pred;
        }
        return r.reverse();
    };
    
    var queue = [{node: root, pred: null}];
    while (queue.length > 0) {
        var e = queue.splice(0,1)[0];
        var ch = children(e.node);
        if (ch.length == 0) {
            return traverse(e);
        }
        else {
            foreach(ch, function(c) { queue.push({ node: c, pred: e }) });
        }
    }
    throw "How ever did we get here?";
};
// End CodeCatalog Snippet

// CodeCatalog Snippet http://www.codecatalog.net/331/1/
var object = function(methods) {
    var constr = methods['init'] || function() {};
    for_kv(methods, function(k,v) {
        constr.prototype[k] = v;
    });
    return constr;
};
// End CodeCatalog Snippet


// A grammar is a hash of LoLs.  Each key is a nonterminal, and each value is
// a disjunction of juxtapositions of symbols.  A symbol can be:
//
// * A string, indicating a nonterminal
// * A function, indicating a terminal (returns the value of the nonterminal parse, or 'null').

var Production = object({
    init: function(lhs, rhss) {
        this.lhs = lhs;
        this.rhss = rhss;
        this.id = unique_id();
    }
});

var DotProduction = object({
    init: function(prod, dot) {
        this.prod = prod;
        this.dot = dot;
    },
    
    toString: function() { return this.prod.id + ' ' + this.dot },
    focus: function() { return this.prod.rhss[this.dot] },
    advance: function() { return new DotProduction(this.prod, this.dot+1) },
    pretty: function() { 
        return this.prod.lhs + " ::= " + this.prod.rhss.slice(0,this.dot).join(' ') + " * " + this.prod.rhss.slice(this.dot).join(' ') 
    }
});

var State = object({
    init: function(position, dotprod, predictFrom) {
        this.position = position;
        this.dotprod = dotprod;
        this.completed = [];
        this.predictFrom = predictFrom || [];
    },

    toString: function() {
        return this.position + ' ' + this.dotprod;
    },
    
    pretty: function() {
        return "(" + this.position + ") " + this.dotprod.pretty();
    },

    advance: function(value) {
        var newstate = new State(this.position, this.dotprod.advance(), this.predictFrom);
        newstate.completed = this.completed.slice(0);
        newstate.completed[newstate.dotprod.dot-1] = value;
        return newstate;
    },

    nom: function(other_state) {
        var self = this;  // ugh javascript
        foreach(other_state.predictFrom, function(s) { self.predictFrom.push(s) }); // XXX can there be overlap?
        var maxix = max(this.completed.length, other_state.completed.length);
        for (var i = 0; i < maxix; i++) {
            if (i in this.completed && i in other_state.completed) {
                // TODO if they are both defined and disagree?  (ambiguous grammar)
                console.log("Completion conflict: " + this.pretty() + " +++ " + other_state.pretty());
            }
            this.completed[i] = i in this.completed ? this.completed[i] : other_state.completed[i];
        }
    },

    context: function() {
        return terminal_path(this, function(x) { return x.predictFrom })
                 .map(function(x) { return new Sexp(x.dotprod.prod.lhs, x.completed) });
    }
});

var make_state_set = function(position, grammar, initial_states) {

    // There is a subtle bug in here regarding productions that match
    // the empty string.   Take this pathological grammar:
    //
    // A ::= B C
    // B ::=
    // C ::= B
    //
    // Start:    A ::= * B C
    // Predict:  B ::= *
    // Complete: A ::= B * C
    // Predict:  C ::= * B
    // Predict:  B ::= *  (already in set, so not visited)
    //
    // However, B should be completed *again* since C ::= * B was added to 
    // its predictFrom set, generating:
    //
    // Complete: C ::= B *
    // Complete: A ::= B C *
    //
    // But this does not currently happen.
   
    var stateset = {};
    var scans = [];
    var queue = [];

    var completions = {};

    var add_state = function(state, hack) {
        if (state.dotprod in stateset) {
            stateset[state].nom(state);
        }
        else {
            queue.push(state);
            stateset[state] = state;
        }
    };

    var visit_state = function(state) {
        var symbol = state.dotprod.focus();
        if (typeof(symbol) === 'string') {       // nonterminal: predict
            foreach(grammar[symbol], function(prod) {
                var dp = new DotProduction(prod, 0);
                add_state(new State(position, dp, [state]));
            });
            if (symbol in completions) {
                //add_state(state.advance(value));
            }
        }
        else if (typeof(symbol) === 'function') { // terminal: scan
            scans.push(state);
        }
        else if (typeof(symbol) === 'undefined') { // end: complete
            var nonterm = state.dotprod.prod.lhs;
            var value = new Sexp(nonterm, state.completed);
            completions[nonterm] = value;
            foreach(state.predictFrom, function(pstate) {
                add_state(pstate.advance(value));
            });
        }
        else {
            throw "Unknown symbol type: " + symbol;
        }
    };

    foreach(initial_states, add_state);

    while (queue.length > 0) { 
        var e = queue.splice(0,1)[0];  // remove from beginning
        visit_state(e);
    }

    return scans;
};


var make_grammar = function(grammarlol) {
    var grammar = {};
    for_kv(grammarlol, function(k,lol) {
        grammar[k] = [];
        foreach(lol, function(l) {
            grammar[k].push(new Production(k, l));
        });
    });
    return grammar;
};

var parse_step = function(grammarlol, startsym) {
    var grammar = make_grammar(grammarlol);
    
    var step = function(position, stateset) {
        return stateset.map(function(state) {
            return { 
                symbol: state.dotprod.focus(), 
                consume: function(inp) { 
                    return step(position+1, make_state_set(position+1, grammar, [state.advance(inp)]));
                },
                context: function() { return state.context() }
            };
        });
    };

    return step(0, make_state_set(0, grammar, grammar[startsym].map(function(s) {
        return new State(0, new DotProduction(s, 0))
    })));
};

return parse_step;

}();
